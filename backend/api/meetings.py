import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Path, UploadFile, File, Form

from schemas import (
    MeetingCreateRequest,
    MeetingIngestionResponse,
    MeetingApprovalRequest,
    MeetingApprovalResponse,
    ExtractedDecision,
    ExtractedActionItem,
    DetectedConflict,
    Conflict
)
from services.extractor import extract_from_transcript
from services.conflicts import detect_conflicts
from services.memory import (
    save_meeting,
    get_meeting,
    add_decision,
    update_decision_status,
    save_action_item,
    update_action_item,
    save_conflict,
    get_conflicts_for_meeting
)
from services.integrations import create_trello_card, send_slack_notification
from services.scheduler import schedule_task_reminder
from services.audio import transcribe_audio_file

router = APIRouter(prefix="/meetings", tags=["Meetings"])

# In-memory staging for uncommitted meetings between extraction and approval
# {meeting_id: {"decisions": [...], "action_items": [...], "conflicts": [...]}}
_STAGED_PROPOSALS: Dict[int, Dict[str, Any]] = {}

@router.post("", response_model=MeetingIngestionResponse)
async def create_and_ingest_meeting(request: MeetingCreateRequest):
    """
    Ingests meeting transcript, extracts decisions & action items,
    flags conflicts against existing memory, and stages proposals for review.
    Nothing is committed to permanent memory until approved.
    """
    # 1. Save raw meeting record
    meeting_id = save_meeting(
        title=request.title,
        date=request.date,
        transcript_raw=request.transcript
    )

    # 2. Extract decisions & action items
    decisions, action_items = extract_from_transcript(
        title=request.title,
        date=request.date,
        raw_transcript=request.transcript,
        format=request.format
    )

    # 3. Detect conflicts against memory
    conflicts = detect_conflicts(
        meeting_title=request.title,
        meeting_date=request.date,
        new_decisions=decisions
    )

    # 4. Save conflicts to DB for auditing
    for c in conflicts:
        save_conflict(
            id=str(uuid.uuid4())[:8],
            meeting_id=meeting_id,
            new_decision_id=c.new_decision_id,
            old_decision_id=str(c.old_decision.id),
            reason=c.reason,
            status="open"
        )

    # 5. Stage items in staging buffer
    _STAGED_PROPOSALS[meeting_id] = {
        "title": request.title,
        "date": request.date,
        "decisions": {d.id: d for d in decisions},
        "action_items": {a.id: a for a in action_items},
        "conflicts": conflicts
    }

    return MeetingIngestionResponse(
        meeting_id=meeting_id,
        decisions=decisions,
        action_items=action_items,
        conflicts=conflicts
    )

@router.post("/audio", response_model=MeetingIngestionResponse)
async def create_and_ingest_audio_meeting(
    file: UploadFile = File(...),
    title: str = Form("Audio Meeting"),
    date: str = Form("2026-11-21")
):
    """
    Ingests an audio recording (.mp3, .wav, .m4a, .webm, .ogg),
    transcribes it with speaker attribution via Whisper, and runs extraction
    and conflict detection against persistent memory.
    """
    file_bytes = await file.read()
    transcript = transcribe_audio_file(file_bytes, file.filename or "recording.mp3", meeting_title=title)

    # Process transcribed speech through standard ingestion pipeline
    return await create_and_ingest_meeting(
        MeetingCreateRequest(
            title=title,
            date=date,
            transcript=transcript,
            format="txt"
        )
    )

@router.get("/{meeting_id}/conflicts")
async def get_meeting_conflicts(meeting_id: int):
    """
    Returns conflicts flagged for a specific meeting.
    """
    conflicts = get_conflicts_for_meeting(meeting_id)
    return {"meeting_id": meeting_id, "conflicts": conflicts}

@router.post("/{meeting_id}/approve", response_model=MeetingApprovalResponse)
async def approve_meeting(meeting_id: int, approval: MeetingApprovalRequest):
    """
    Commits approved items to SQLite + ChromaDB memory,
    applies user edits, supersedes conflicting decisions,
    creates tracker tasks, and schedules notifications.
    """
    meeting = get_meeting(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail=f"Meeting {meeting_id} not found")

    staged = _STAGED_PROPOSALS.get(meeting_id, {"decisions": {}, "action_items": {}})
    staged_decisions = staged.get("decisions", {})
    staged_actions = staged.get("action_items", {})

    committed_decisions = []
    committed_actions = []
    resolved_conflicts = []

    # 1. Commit approved decisions to SQLite + ChromaDB
    for dec_id in approval.approved_decision_ids:
        dec = staged_decisions.get(dec_id)
        if dec:
            text = dec.text
            owner = dec.owner
            source_line = dec.source_line
        else:
            text = f"Approved decision {dec_id}"
            owner = None
            source_line = None

        # Check if edits exist for this decision
        if approval.edits and dec_id in approval.edits:
            edit = approval.edits[dec_id]
            text = edit.get("text", text)
            owner = edit.get("owner", owner)

        res = add_decision(
            id=dec_id,
            meeting_id=meeting_id,
            text=text,
            owner=owner,
            date=meeting["date"],
            source_line=source_line,
            status="active"
        )
        committed_decisions.append(res)

    # 2. Commit approved action items & create tracker tasks
    for act_id in approval.approved_action_item_ids:
        act = staged_actions.get(act_id)
        if act:
            text = act.text
            owner = act.owner
            deadline = act.deadline
            source_line = act.source_line
            confidence = act.confidence
        else:
            text = f"Action item {act_id}"
            owner = None
            deadline = None
            source_line = None
            confidence = 1.0

        # Check edits
        if approval.edits and act_id in approval.edits:
            edit = approval.edits[act_id]
            text = edit.get("text", text)
            owner = edit.get("owner", owner)
            deadline = edit.get("deadline", deadline)

        # Create task in Trello (or mock integration)
        trello_res = create_trello_card(
            name=f"[{owner or 'Unassigned'}] {text}",
            desc=f"Meeting: {meeting['title']} ({meeting['date']})\nAction Item ID: {act_id}",
            due_date=deadline
        )
        tracker_task_id = trello_res.get("id")

        res = save_action_item(
            id=act_id,
            meeting_id=meeting_id,
            text=text,
            owner=owner,
            deadline=deadline,
            confidence=confidence,
            source_line=source_line,
            status="approved",
            tracker_task_id=tracker_task_id
        )
        committed_actions.append(res)

        # Notify / schedule reminder
        if owner and deadline:
            send_slack_notification(f"New task assigned to {owner}: {text} (Due: {deadline})")
            schedule_task_reminder(task_id=act_id, text=text, owner=owner, deadline=deadline)

    # 3. Handle conflict resolutions (e.g. {"7": "supersede"})
    if approval.conflict_resolutions:
        for old_id, resolution in approval.conflict_resolutions.items():
            if resolution == "supersede":
                update_decision_status(str(old_id), status="superseded")
                resolved_conflicts.append({"old_decision_id": old_id, "resolution": "superseded"})
            elif resolution == "dismiss":
                resolved_conflicts.append({"old_decision_id": old_id, "resolution": "dismissed"})

    return MeetingApprovalResponse(
        status="committed",
        meeting_id=meeting_id,
        committed_decisions=committed_decisions,
        committed_action_items=committed_actions,
        resolved_conflicts=resolved_conflicts
    )
