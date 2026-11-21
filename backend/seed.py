import os
import sys
import shutil
from db import get_db_connection, init_db
from services.memory import add_decision, save_meeting, save_action_item, get_chroma_collection, CHROMA_PERSIST_DIR
import chromadb

def reset_all():
    print("Resetting SQLite database...")
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("DROP TABLE IF EXISTS conflicts")
    c.execute("DROP TABLE IF EXISTS action_items")
    c.execute("DROP TABLE IF EXISTS decisions")
    c.execute("DROP TABLE IF EXISTS meetings")
    conn.commit()
    conn.close()

    init_db()

    print("Resetting ChromaDB vector collection...")
    try:
        col = get_chroma_collection()
        col.delete(where={"status": "active"})
        col.delete(where={"status": "superseded"})
    except Exception as e:
        print(f"Chroma reset warning: {e}")

    print("Database & vector memory reset successfully.")

def seed_demo_data():
    reset_all()
    print("\nSeeding Demo Meeting 1 (Kickoff - Oct 3, 2026)...")
    m1_id = save_meeting(
        title="Kickoff Meeting",
        date="2026-10-03",
        transcript_raw=(
            "Arjun: Welcome everyone to the Actioned project kickoff.\n"
            "Arjun: First big milestone: we decided that launch is scheduled for April 2.\n"
            "Neha: Great. I will prepare the cloud architecture document by next Friday.\n"
            "Arjun: Sounds good. Let's make sure everyone reviews the spec before end of month."
        )
    )

    # Decision 1
    add_decision(
        id="d1",
        meeting_id=m1_id,
        text="Launch is scheduled for April 2",
        owner="Arjun",
        date="2026-10-03",
        source_line=2,
        status="active"
    )

    # Action Item 1
    save_action_item(
        id="a1",
        meeting_id=m1_id,
        text="Prepare the cloud architecture document",
        owner="Neha",
        deadline="2026-10-09",
        confidence=0.95,
        source_line=3,
        status="approved",
        tracker_task_id="trello_card_101"
    )

    print("Seeding Demo Meeting 2 (Sprint Planning - Nov 14, 2026)...")
    m2_id = save_meeting(
        title="Sprint Planning",
        date="2026-11-14",
        transcript_raw=(
            "Priya: Okay team, let's review our sprint backlog.\n"
            "Priya: Someone should look into the pricing page and competitors.\n"
            "Rahul: I will update the user onboarding flow by Friday.\n"
            "Priya: We decided to use Tailwind for the design system overhaul.\n"
            "Rahul: Got it. I'll take care of the component styling as well."
        )
    )

    # Decision 2
    add_decision(
        id="d2",
        meeting_id=m2_id,
        text="Use Tailwind for the design system overhaul",
        owner="Priya",
        date="2026-11-14",
        source_line=4,
        status="active"
    )

    # Action Items 2 & 3
    save_action_item(
        id="a2",
        meeting_id=m2_id,
        text="Update the user onboarding flow",
        owner="Rahul",
        deadline="2026-11-20",
        confidence=0.90,
        source_line=3,
        status="approved",
        tracker_task_id="trello_card_102"
    )

    save_action_item(
        id="a3",
        meeting_id=m2_id,
        text="Look into the pricing page and competitors",
        owner=None,
        deadline=None,
        confidence=0.65,
        source_line=2,
        status="proposed"
    )

    print("\nSUCCESS! Seeded 2 Meetings, 2 Active Decisions, and 3 Action Items into SQLite + ChromaDB.")
    print("Now, ingesting Meeting 3 ('Launch moves to March 15') will immediately trigger conflict detection against Decision 1!")

def inspect_db():
    conn = get_db_connection()
    c = conn.cursor()

    print("\n" + "=" * 60)
    print("MEETINGS TABLE:")
    print("=" * 60)
    c.execute("SELECT id, title, date, created_at FROM meetings")
    for row in c.fetchall():
        print(dict(row))

    print("\n" + "=" * 60)
    print("DECISIONS TABLE (Persistent Memory):")
    print("=" * 60)
    c.execute("SELECT id, meeting_id, text, owner, date, status, chroma_id FROM decisions")
    for row in c.fetchall():
        print(dict(row))

    print("\n" + "=" * 60)
    print("ACTION ITEMS TABLE:")
    print("=" * 60)
    c.execute("SELECT id, meeting_id, text, owner, deadline, status, tracker_task_id FROM action_items")
    for row in c.fetchall():
        print(dict(row))

    print("\n" + "=" * 60)
    print("CONFLICTS TABLE:")
    print("=" * 60)
    c.execute("SELECT id, meeting_id, new_decision_id, old_decision_id, reason, status FROM conflicts")
    for row in c.fetchall():
        print(dict(row))

    conn.close()

if __name__ == "__main__":
    arg = sys.argv[1].lower() if len(sys.argv) > 1 else "seed"
    if arg == "reset":
        reset_all()
    elif arg == "inspect":
        inspect_db()
    else:
        seed_demo_data()
        inspect_db()
