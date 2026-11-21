import pytest
from fastapi.testclient import TestClient

from main import app
from services.parser import parse_plain_text, parse_transcript
from services.dates import resolve_deadline
from db import init_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    init_db()

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "actioned-backend"

def test_parser_plain_text():
    sample = (
        "Arjun: Launch is scheduled for April 2.\n"
        "Neha: I will update the roadmap by Friday.\n"
        "This is a continuation line."
    )
    parsed = parse_transcript(sample, format="txt")
    assert len(parsed) == 3
    assert parsed[0]["speaker"] == "Arjun"
    assert parsed[0]["line_no"] == 1
    assert parsed[1]["speaker"] == "Neha"
    assert parsed[2]["speaker"] == "Neha"

def test_dates_resolver():
    meeting_date = "2026-11-21"  # Saturday
    assert resolve_deadline("by Friday", meeting_date) == "2026-11-27"
    assert resolve_deadline("tomorrow", meeting_date) == "2026-11-22"
    assert resolve_deadline("March 15", meeting_date) == "2027-03-15"

def test_meetings_ingestion_and_approval_flow():
    # 1. Ingest Meeting 1: Kickoff
    m1_payload = {
        "title": "Kickoff Meeting",
        "date": "2026-10-03",
        "transcript": "Arjun: We decided that launch is scheduled for April 2.\nNeha: I will complete the spec by next Friday.",
        "format": "txt"
    }
    r1 = client.post("/meetings", json=m1_payload)
    assert r1.status_code == 200
    d1 = r1.json()
    assert d1["meeting_id"] is not None
    assert len(d1["decisions"]) >= 1
    dec_id = d1["decisions"][0]["id"]
    act_id = d1["action_items"][0]["id"]

    # Approve Meeting 1
    appr1_payload = {
        "approved_decision_ids": [dec_id],
        "approved_action_item_ids": [act_id]
    }
    appr1 = client.post(f"/meetings/{d1['meeting_id']}/approve", json=appr1_payload)
    assert appr1.status_code == 200
    assert appr1.json()["status"] == "committed"

    # Verify decision is listed
    dec_res = client.get("/decisions?status=active")
    assert dec_res.status_code == 200
    decisions = dec_res.json()
    assert any("April 2" in d["text"] for d in decisions)

    # 2. Ingest Meeting 3: Planning Review (Conflict: moves launch to March 15)
    m3_payload = {
        "title": "Planning Review",
        "date": "2026-11-21",
        "transcript": "Priya: We decided that launch moves to March 15.\nRahul: I will update the release checklist.",
        "format": "txt"
    }
    r3 = client.post("/meetings", json=m3_payload)
    assert r3.status_code == 200
    d3 = r3.json()
    assert len(d3["conflicts"]) >= 1
    conflict = d3["conflicts"][0]
    assert "launch" in conflict["reason"].lower()

    # Approve Meeting 3 and supersede old decision
    appr3_payload = {
        "approved_decision_ids": [d3["decisions"][0]["id"]],
        "approved_action_item_ids": [d3["action_items"][0]["id"]],
        "conflict_resolutions": {str(conflict["old_decision"]["id"]): "supersede"}
    }
    appr3 = client.post(f"/meetings/{d3['meeting_id']}/approve", json=appr3_payload)
    assert appr3.status_code == 200

    # Verify old decision is now superseded
    dec_active = client.get("/decisions?status=active").json()
    assert not any("April 2" in d["text"] for d in dec_active)
