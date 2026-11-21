import logging
from datetime import datetime, date, timedelta
from typing import Optional
from apscheduler.schedulers.background import BackgroundScheduler
from db import get_db_connection
from services.integrations import send_slack_notification

logger = logging.getLogger("actioned.scheduler")

_scheduler: Optional[BackgroundScheduler] = None

def get_scheduler() -> BackgroundScheduler:
    global _scheduler
    if _scheduler is None:
        _scheduler = BackgroundScheduler()
    return _scheduler

def check_upcoming_deadlines():
    """
    Periodic job that queries SQLite for tasks due within the next 48 hours
    and fires Slack reminders.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        today = date.today().strftime("%Y-%m-%d")
        soon = (date.today() + timedelta(days=2)).strftime("%Y-%m-%d")

        cursor.execute(
            """
            SELECT id, text, owner, deadline 
            FROM action_items 
            WHERE status = 'approved' AND deadline IS NOT NULL AND deadline BETWEEN ? AND ?
            """,
            (today, soon)
        )
        upcoming = [dict(r) for r in cursor.fetchall()]
        conn.close()

        for item in upcoming:
            msg = f"⏰ *Actioned Reminder:* '{item['text']}' assigned to {item['owner'] or 'Unassigned'} is due on {item['deadline']}!"
            send_slack_notification(msg)
    except Exception as e:
        logger.error(f"Error checking upcoming deadlines: {e}")

def schedule_task_reminder(task_id: str, text: str, owner: Optional[str], deadline: str):
    """
    Schedules an individual reminder for an action item.
    """
    scheduler = get_scheduler()
    if not scheduler.running:
        return

    # Reminder trigger before deadline
    try:
        due_date = datetime.strptime(deadline, "%Y-%m-%d")
        reminder_time = due_date - timedelta(days=1)
        if reminder_time > datetime.now():
            job_id = f"reminder_{task_id}"
            scheduler.add_job(
                send_slack_notification,
                "date",
                run_date=reminder_time,
                args=[f"⏰ *Actioned Reminder:* '{text}' for {owner or 'Unassigned'} is due tomorrow ({deadline})!"],
                id=job_id,
                replace_existing=True
            )
    except Exception as e:
        logger.warning(f"Could not schedule reminder job for {task_id}: {e}")

def start_scheduler():
    scheduler = get_scheduler()
    if not scheduler.running:
        # Check deadlines every 4 hours in the background
        scheduler.add_job(check_upcoming_deadlines, "interval", hours=4, id="periodic_deadline_check", replace_existing=True)
        scheduler.start()
        logger.info("Actioned APScheduler background service started.")

def stop_scheduler():
    scheduler = get_scheduler()
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Actioned APScheduler background service stopped.")
