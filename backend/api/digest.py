import os
from typing import List, Optional
from fastapi import APIRouter, HTTPException

from schemas import PersonDigestResponse, ActionItem, Decision
from db import get_db_connection
import anthropic

router = APIRouter(prefix="/digest", tags=["Digest"])

@router.get("/{person}", response_model=PersonDigestResponse)
async def get_person_digest(person: str):
    """
    Retrieves open action items, upcoming deadlines, and decisions affecting the person,
    with an optional AI-generated executive digest summary.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Open action items
    cursor.execute(
        "SELECT * FROM action_items WHERE LOWER(owner) = LOWER(?) AND status = 'approved' ORDER BY deadline ASC",
        (person,)
    )
    action_rows = [dict(r) for r in cursor.fetchall()]

    # Decisions affecting person
    cursor.execute(
        "SELECT * FROM decisions WHERE LOWER(owner) = LOWER(?) AND status = 'active' ORDER BY date DESC",
        (person,)
    )
    decision_rows = [dict(r) for r in cursor.fetchall()]
    conn.close()

    open_items = [
        ActionItem(
            id=r["id"],
            meeting_id=r["meeting_id"],
            text=r["text"],
            owner=r.get("owner"),
            deadline=r.get("deadline"),
            confidence=float(r.get("confidence", 1.0)),
            source_line=r.get("source_line"),
            status=r.get("status", "approved"),
            tracker_task_id=r.get("tracker_task_id"),
            created_at=r.get("created_at")
        )
        for r in action_rows
    ]

    upcoming_deadlines = [item for item in open_items if item.deadline]

    decisions = [
        Decision(
            id=r["id"],
            meeting_id=r["meeting_id"],
            text=r["text"],
            owner=r.get("owner"),
            date=r.get("date"),
            status=r.get("status", "active"),
            source_line=r.get("source_line"),
            chroma_id=r.get("chroma_id"),
            created_at=r.get("created_at")
        )
        for r in decision_rows
    ]

    # Generate summary paragraph
    summary = f"{person} currently has {len(open_items)} active action items and {len(decisions)} active decisions recorded."
    api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    if api_key and (open_items or decisions):
        try:
            client = anthropic.Anthropic(api_key=api_key)
            prompt = (
                f"Write a concise 2-sentence weekly digest for {person}.\n"
                f"Action Items: {[a.text + ' (Due: ' + str(a.deadline) + ')' for a in open_items]}\n"
                f"Decisions: {[d.text for d in decisions]}\n"
            )
            resp = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=200,
                messages=[{"role": "user", "content": prompt}]
            )
            summary = resp.content[0].text.strip()
        except Exception:
            pass

    return PersonDigestResponse(
        person=person,
        open_action_items=open_items,
        upcoming_deadlines=upcoming_deadlines,
        decisions_affecting_person=decisions,
        summary=summary
    )
