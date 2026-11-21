import pytest
from fastapi.testclient import TestClient

from main import app
from db import init_db, get_db_connection
from services.parser import parse_plain_text, parse_vtt, parse_transcript
from services.dates import resolve_deadline
from services.memory import (
    get_chroma_collection,
    list_decisions,
    add_decision,
    search_similar_decisions
)
from services.scheduler import check_upcoming_deadlines

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_environment():
    """
    Ensures fresh database and vector memory before each test run.
    Uses safe DELETE statements that do not conflict with open connections.
    """
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("DELETE FROM conflicts")
    c.execute("DELETE FROM action_items")
    c.execute("DELETE FROM decisions")
    c.execute("DELETE FROM meetings")
    conn.commit()
    conn.close()

    try:
        col = get_chroma_collection()
        col.delete(where={"status": "active"})
        col.delete(where={"status": "superseded"})
    except Exception:
        pass


# ==============================================================================
# REQUIREMENT 1: Transcript Ingestion with Speaker Attribution
# ==============================================================================
def test_req1_transcript_ingestion_with_speaker_attribution():
    # 1. Plain text transcript with multiple speakers & continuation lines
    plain_text = (
        "Arjun: Welcome everyone to the kickoff meeting.\n"
        "Neha [10:02]: I will complete the spec by next Friday.\n"
        "This is a continuation line from Neha.\n"
        "Just an unassigned thought.\n"
        "Priya: We decided that launch is scheduled for April 2."
    )
    parsed = parse_transcript(plain_text, format="txt")
    assert len(parsed) == 5
    assert parsed[0]["line_no"] == 1
    assert parsed[0]["speaker"] == "Arjun"
    assert "kickoff" in parsed[0]["text"]
    assert parsed[1]["speaker"] == "Neha"
    # Continuation line inherits previous speaker
    assert parsed[2]["speaker"] == "Neha"
    # Utterance without prior speaker or context
    assert parsed[4]["speaker"] == "Priya"

    # 2. WebVTT format (Zoom / Google Meet)
    vtt_sample = (
        "WEBVTT\n\n"
        "00:00:01.000 --> 00:00:04.000\n"
        "<v Arjun>Let's review the sprint roadmap.</v>\n\n"
        "00:00:05.000 --> 00:00:09.000\n"
        "<v Rahul>I will fix the onboarding flow by Friday.</v>\n"
    )
    parsed_vtt = parse_transcript(vtt_sample, format="vtt")
    assert len(parsed_vtt) == 2
    assert parsed_vtt[0]["speaker"] == "Arjun"
    assert "roadmap" in parsed_vtt[0]["text"]
    assert parsed_vtt[1]["speaker"] == "Rahul"
    assert "onboarding" in parsed_vtt[1]["text"]


# ==============================================================================
# REQUIREMENT 2: Extraction of Decisions, Action Items, Owners, and Deadlines
# ==============================================================================
def test_req2_extraction_of_decisions_action_items_owners_deadlines():
    meeting_date = "2026-11-14"  # Saturday
    transcript = (
        "Priya: We decided to use Tailwind for the design system overhaul.\n"
        "Rahul: I will update the user onboarding flow by Friday.\n"
        "Priya: Someone should look into the pricing page."
    )
    res = client.post("/meetings", json={
        "title": "Sprint Planning",
        "date": meeting_date,
        "transcript": transcript,
        "format": "txt"
    })
    assert res.status_code == 200
    data = res.json()

    # 1. Decisions extracted with owner, confidence, source line
    decisions = data["decisions"]
    assert len(decisions) >= 1
    d = decisions[0]
    assert "Tailwind" in d["text"]
    assert d["owner"] == "Priya"
    assert d["confidence"] >= 0.8
    assert d["source_line"] == 1

    # 2. Action items extracted
    actions = data["action_items"]
    assert len(actions) >= 2

    # Concrete owner + resolved deadline
    rahul_task = next((a for a in actions if a["owner"] == "Rahul"), None)
    assert rahul_task is not None
    assert "onboarding" in rahul_task["text"]
    # Friday relative to Nov 14 (Saturday) resolves to Nov 20
    assert rahul_task["deadline"] == "2026-11-20"
    assert rahul_task["source_line"] == 2

    # Vague owner detection: "Someone should look into the pricing page"
    vague_task = next((a for a in actions if "pricing" in a["text"]), None)
    assert vague_task is not None
    assert vague_task["owner"] is None, "Vague owner ('someone') must NOT be hallucinated!"
    assert vague_task["confidence"] < 0.75, "Vague task must have lower confidence score"


# ==============================================================================
# REQUIREMENT 3: Detection of Conflicts with Earlier Decisions in Memory
# ==============================================================================
def test_req3_detection_of_conflicts_with_earlier_decisions():
    # 1. Ingest & Approve Meeting 1 (Sets baseline decision)
    m1_res = client.post("/meetings", json={
        "title": "Kickoff Meeting",
        "date": "2026-10-03",
        "transcript": "Arjun: We decided that launch is scheduled for April 2.",
        "format": "txt"
    })
    m1_data = m1_res.json()
    m1_id = m1_data["meeting_id"]
    m1_dec_id = m1_data["decisions"][0]["id"]

    # Confirm and commit Meeting 1 into persistent memory
    client.post(f"/meetings/{m1_id}/approve", json={
        "approved_decision_ids": [m1_dec_id],
        "approved_action_item_ids": []
    })

    # Verify decision is active in persistent memory
    active_decs = client.get("/decisions?status=active").json()
    assert any("April 2" in d["text"] for d in active_decs)

    # 2. Ingest Meeting 3 (Proposes contradictory launch date)
    m3_res = client.post("/meetings", json={
        "title": "Planning Review",
        "date": "2026-11-21",
        "transcript": "Priya: We decided that launch moves to March 15.",
        "format": "txt"
    })
    assert m3_res.status_code == 200
    m3_data = m3_res.json()

    # Verify conflict was automatically detected!
    conflicts = m3_data["conflicts"]
    assert len(conflicts) >= 1, "Conflict detector must flag contradiction between April 2 and March 15!"
    conf = conflicts[0]
    assert "April 2" in conf["old_decision"]["text"]
    assert conf["old_decision"]["owner"] == "Arjun"
    assert "launch" in conf["reason"].lower()
    assert conf["new_decision_id"] == m3_data["decisions"][0]["id"]


# ==============================================================================
# REQUIREMENT 4: Creation of Tasks in a Tracker Through an Integration
# ==============================================================================
def test_req4_creation_of_tasks_in_tracker_through_integration():
    m_res = client.post("/meetings", json={
        "title": "Roadmap Session",
        "date": "2026-11-21",
        "transcript": "Neha: I will complete the spec by next Friday.",
        "format": "txt"
    })
    data = m_res.json()
    meeting_id = data["meeting_id"]
    action_id = data["action_items"][0]["id"]

    # Approve meeting and action item
    appr_res = client.post(f"/meetings/{meeting_id}/approve", json={
        "approved_decision_ids": [],
        "approved_action_item_ids": [action_id]
    })
    assert appr_res.status_code == 200
    appr_data = appr_res.json()
    committed_actions = appr_data["committed_action_items"]
    assert len(committed_actions) == 1
    # Tracker task ID must be populated from Trello integration
    assert committed_actions[0]["tracker_task_id"] is not None
    assert "trello" in committed_actions[0]["tracker_task_id"].lower()


# ==============================================================================
# REQUIREMENT 5: Reminders Before Deadlines
# ==============================================================================
def test_req5_reminders_before_deadlines():
    # Ingest and approve a task due tomorrow
    meeting_res = client.post("/meetings", json={
        "title": "Urgent Sync",
        "date": "2026-11-21",
        "transcript": "Rahul: I will deploy the hotfix tomorrow.",
        "format": "txt"
    })
    m_data = meeting_res.json()
    action_id = m_data["action_items"][0]["id"]

    appr = client.post(f"/meetings/{m_data['meeting_id']}/approve", json={
        "approved_decision_ids": [],
        "approved_action_item_ids": [action_id]
    })
    assert appr.status_code == 200

    # Trigger deadline checker job
    check_upcoming_deadlines()

    # Verify task in DB has valid deadline within reminder window
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT deadline, status FROM action_items WHERE id = ?", (action_id,))
    row = c.fetchone()
    conn.close()
    assert row["deadline"] == "2026-11-22"
    assert row["status"] == "approved"


# ==============================================================================
# REQUIREMENT 6: Weekly Digest Per Person
# ==============================================================================
def test_req6_weekly_digest_per_person():
    # Setup approved tasks and decisions for Arjun
    from services.memory import save_meeting
    m_id = save_meeting("Security Architecture Review", "2026-11-20", "Arjun: Review security")
    add_decision("d_arjun", m_id, "Establish zero-trust security architecture", "Arjun", "2026-11-20", 1, "active")

    client.post("/meetings", json={
        "title": "Arjun Task Sync",
        "date": "2026-11-21",
        "transcript": "Arjun: I will review pull requests by next Friday.",
        "format": "txt"
    })
    client.post(f"/meetings/{m_id}/approve", json={
        "approved_decision_ids": [],
        "approved_action_item_ids": ["a1"]
    })

    digest_res = client.get("/digest/Arjun")
    assert digest_res.status_code == 200
    digest = digest_res.json()
    assert digest["person"] == "Arjun"
    assert len(digest["decisions_affecting_person"]) >= 1
    assert any("security" in d["text"].lower() for d in digest["decisions_affecting_person"])
    assert digest["summary"] is not None


# ==============================================================================
# REQUIREMENT 7: Confirmation Step Before Anything Gets Posted
# ==============================================================================
def test_req7_confirmation_step_before_anything_gets_posted():
    # 1. Ingestion ONLY stages proposals — nothing in persistent memory yet!
    ingest_res = client.post("/meetings", json={
        "title": "Unapproved Proposal Meeting",
        "date": "2026-11-21",
        "transcript": "Priya: We decided to double marketing budget.\nRahul: I will hire 3 engineers.",
        "format": "txt"
    })
    data = ingest_res.json()
    dec_id = data["decisions"][0]["id"]
    act_id = data["action_items"][0]["id"]

    # Verify decision is NOT yet in persistent decisions log
    decs_before = client.get("/decisions?status=active").json()
    assert not any("double marketing budget" in d["text"] for d in decs_before), \
        "Unapproved decision must NOT appear in memory before confirmation!"

    # 2. Human confirms with inline edits (edits owner & deadline)
    approval_payload = {
        "approved_decision_ids": [dec_id],
        "approved_action_item_ids": [act_id],
        "edits": {
            dec_id: {"text": "We decided to increase marketing budget by 50%"},
            act_id: {"owner": "Rahul", "deadline": "2026-12-01"}
        }
    }
    appr_res = client.post(f"/meetings/{data['meeting_id']}/approve", json=approval_payload)
    assert appr_res.status_code == 200

    # 3. NOW it is committed with human edits applied!
    decs_after = client.get("/decisions?status=active").json()
    committed_dec = next((d for d in decs_after if "marketing" in d["text"].lower()), None)
    assert committed_dec is not None
    assert "increase marketing budget by 50%" in committed_dec["text"], "Human edit must be committed!"
