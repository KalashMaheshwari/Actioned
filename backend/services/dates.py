import re
from datetime import datetime, timedelta
from typing import Optional
from dateutil import parser as date_parser
from dateutil.relativedelta import relativedelta, MO, TU, WE, TH, FR, SA, SU

WEEKDAYS = {
    "monday": MO,
    "tuesday": TU,
    "wednesday": WE,
    "thursday": TH,
    "friday": FR,
    "saturday": SA,
    "sunday": SU,
}

def resolve_deadline(deadline_phrase: Optional[str], meeting_date_str: str) -> Optional[str]:
    """
    Resolves relative deadline phrases ("by Friday", "next week", "end of month", "in 2 days")
    against the meeting date string (YYYY-MM-DD).
    Returns resolved date in YYYY-MM-DD format, or None if unresolvable.
    """
    if not deadline_phrase or not deadline_phrase.strip():
        return None

    phrase = deadline_phrase.strip().lower()
    # Clean leading prepositions
    phrase = re.sub(r"^(by|before|until|on|due|for)\s+", "", phrase).strip()

    try:
        meeting_date = datetime.strptime(meeting_date_str, "%Y-%m-%d").date()
    except Exception:
        meeting_date = datetime.now().date()

    # Exact date check (e.g. "2026-11-28", "Nov 28", "March 15")
    try:
        parsed_dt = date_parser.parse(phrase, default=datetime(meeting_date.year, meeting_date.month, meeting_date.day))
        # If parsed date is in past relative to meeting date, and year wasn't specified, push to next year
        res_date = parsed_dt.date()
        if res_date < meeting_date and str(meeting_date.year) not in phrase:
            res_date = res_date.replace(year=meeting_date.year + 1)
        return res_date.strftime("%Y-%m-%d")
    except Exception:
        pass

    # Relative expressions
    if phrase in ("today", "eod", "end of day"):
        return meeting_date.strftime("%Y-%m-%d")

    if phrase == "tomorrow":
        return (meeting_date + timedelta(days=1)).strftime("%Y-%m-%d")

    # "in X days" / "in X weeks"
    in_days_match = re.match(r"in\s+(\d+)\s+days?", phrase)
    if in_days_match:
        days = int(in_days_match.group(1))
        return (meeting_date + timedelta(days=days)).strftime("%Y-%m-%d")

    in_weeks_match = re.match(r"in\s+(\d+)\s+weeks?", phrase)
    if in_weeks_match:
        weeks = int(in_weeks_match.group(1))
        return (meeting_date + timedelta(weeks=weeks)).strftime("%Y-%m-%d")

    # "end of week" / "eow" -> Friday of current week
    if phrase in ("end of week", "eow"):
        friday = meeting_date + relativedelta(weekday=FR(+1))
        return friday.strftime("%Y-%m-%d")

    # "next week" -> next Monday or Friday
    if phrase == "next week":
        next_mon = meeting_date + relativedelta(weekday=MO(+1))
        if next_mon <= meeting_date:
            next_mon = meeting_date + relativedelta(days=7, weekday=MO)
        return next_mon.strftime("%Y-%m-%d")

    # "end of month" / "eom" -> last day of current month
    if phrase in ("end of month", "eom"):
        next_month = meeting_date.replace(day=28) + timedelta(days=4)
        last_day = next_month - timedelta(days=next_month.day)
        return last_day.strftime("%Y-%m-%d")

    # "Friday", "this Friday", "next Friday"
    weekday_match = re.search(r"(this|next)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)", phrase)
    if weekday_match:
        prefix, day_name = weekday_match.groups()
        target_wd = WEEKDAYS[day_name]
        if prefix == "next":
            res = meeting_date + relativedelta(weekday=target_wd(+2))
        else:
            res = meeting_date + relativedelta(weekday=target_wd(+1))
            if res <= meeting_date:
                res = meeting_date + relativedelta(weekday=target_wd(+2))
        return res.strftime("%Y-%m-%d")

    return None
