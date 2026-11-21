from __future__ import annotations
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field

# --- Meeting Ingestion Models ---

class MeetingCreateRequest(BaseModel):
    title: str = Field(..., description="Title of the meeting")
    date: str = Field(..., description="Date of the meeting (YYYY-MM-DD)")
    transcript: str = Field(..., description="Raw transcript content (plain text or VTT)")
    format: str = Field("txt", description="Transcript format: 'txt' or 'vtt'")

class ExtractedDecision(BaseModel):
    id: str = Field(..., description="Temporary identifier e.g. d1")
    text: str = Field(..., description="Statement of the decision")
    owner: Optional[str] = Field(None, description="Person responsible or null if team-wide/unassigned")
    source_line: int = Field(..., description="Line number in the transcript")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Extraction confidence score")

class ExtractedActionItem(BaseModel):
    id: str = Field(..., description="Temporary identifier e.g. a1")
    text: str = Field(..., description="Action item description")
    owner: Optional[str] = Field(None, description="Person responsible or null if vague/unassigned")
    deadline: Optional[str] = Field(None, description="Resolved deadline YYYY-MM-DD or null")
    source_line: int = Field(..., description="Line number in the transcript")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Extraction confidence score")

class OldDecisionRef(BaseModel):
    id: Union[str, int]
    text: str
    owner: Optional[str] = None
    meeting_title: Optional[str] = None
    date: Optional[str] = None

class DetectedConflict(BaseModel):
    new_decision_id: str
    old_decision: OldDecisionRef
    reason: str

class MeetingIngestionResponse(BaseModel):
    meeting_id: int
    decisions: List[ExtractedDecision]
    action_items: List[ExtractedActionItem]
    conflicts: List[DetectedConflict]

class MeetingSummary(BaseModel):
    id: int
    title: str
    date: str
    created_at: Optional[str] = None
    decisions_count: int = 0
    action_items_count: int = 0
    conflicts_count: int = 0

class MeetingDetailResponse(BaseModel):
    id: int
    title: str
    date: str
    transcript_raw: str
    format: str
    created_at: Optional[str] = None
    decisions: List[Decision] = []
    action_items: List[ActionItem] = []
    conflicts: List[Conflict] = []

# --- Approval Models ---

class MeetingApprovalRequest(BaseModel):
    approved_decision_ids: List[str] = Field(default_factory=list)
    approved_action_item_ids: List[str] = Field(default_factory=list)
    edits: Optional[Dict[str, Dict[str, Any]]] = Field(
        default_factory=dict,
        description="e.g. {'a1': {'owner': 'Rahul', 'deadline': '2026-11-29', 'text': '...'}}"
    )
    conflict_resolutions: Optional[Dict[str, str]] = Field(
        default_factory=dict,
        description="e.g. {'d1_old': 'supersede'} or {'d1_old': 'dismiss'}"
    )

class MeetingApprovalResponse(BaseModel):
    status: str
    meeting_id: int
    committed_decisions: List[Dict[str, Any]]
    committed_action_items: List[Dict[str, Any]]
    resolved_conflicts: List[Dict[str, Any]]

# --- Persistent Entity Models ---

class Decision(BaseModel):
    id: str
    meeting_id: int
    text: str
    owner: Optional[str] = None
    date: Optional[str] = None
    status: str = "active"  # active | superseded | conflicted
    source_line: Optional[int] = None
    chroma_id: Optional[str] = None
    created_at: Optional[str] = None
    meeting_title: Optional[str] = None

class ActionItem(BaseModel):
    id: str
    meeting_id: int
    text: str
    owner: Optional[str] = None
    deadline: Optional[str] = None
    confidence: float = 1.0
    source_line: Optional[int] = None
    status: str = "proposed"  # proposed | approved | rejected | done
    tracker_task_id: Optional[str] = None
    created_at: Optional[str] = None
    meeting_title: Optional[str] = None

class ActionItemUpdateRequest(BaseModel):
    text: Optional[str] = None
    owner: Optional[str] = None
    deadline: Optional[str] = None
    status: Optional[str] = None  # proposed | approved | rejected | done

class Conflict(BaseModel):
    id: str
    meeting_id: int
    new_decision_id: str
    old_decision_id: str
    reason: str
    status: str = "open"  # open | confirmed | dismissed
    created_at: Optional[str] = None

# --- Digest Models ---

class PersonDigestResponse(BaseModel):
    person: str
    open_action_items: List[ActionItem]
    upcoming_deadlines: List[ActionItem]
    decisions_affecting_person: List[Decision]
    summary: Optional[str] = None

# --- Audio Transcription Models ---

class AudioTranscriptionResponse(BaseModel):
    status: str
    transcript: str
    format: str = "txt"
    meeting_ingestion: Optional[MeetingIngestionResponse] = None
