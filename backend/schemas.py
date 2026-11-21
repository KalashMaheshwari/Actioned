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

# --- Approval Models ---

class MeetingApprovalRequest(BaseModel):
    approved_decision_ids: List[str] = Field(default_factory=list)
    approved_action_item_ids: List[str] = Field(default_factory=list)
    edits: Optional[Dict[str, Dict[str, Any]]] = Field(default_factory=dict, description="e.g. {'a1': {'owner': 'Rahul', 'deadline': '2026-11-29'}}")
    conflict_resolutions: Optional[Dict[str, str]] = Field(default_factory=dict, description="e.g. {'7': 'supersede'}")

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

class ActionItem(BaseModel):
    id: str
    meeting_id: int
    text: str
    owner: Optional[str] = None
    deadline: Optional[str] = None
    confidence: float
    source_line: Optional[int] = None
    status: str = "proposed"  # proposed | approved | rejected | done
    tracker_task_id: Optional[str] = None
    created_at: Optional[str] = None

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
