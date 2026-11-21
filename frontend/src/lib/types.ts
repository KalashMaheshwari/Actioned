export interface ExtractedDecision {
  id: string;
  text: string;
  owner?: string | null;
  source_line: number;
  confidence: number;
}

export interface ExtractedActionItem {
  id: string;
  text: string;
  owner?: string | null;
  deadline?: string | null;
  source_line: number;
  confidence: number;
}

export interface OldDecisionRef {
  id: string | number;
  text: string;
  owner?: string | null;
  meeting_title?: string | null;
  date?: string | null;
}

export interface DetectedConflict {
  new_decision_id: string;
  old_decision: OldDecisionRef;
  reason: string;
}

export interface MeetingIngestionResponse {
  meeting_id: number;
  decisions: ExtractedDecision[];
  action_items: ExtractedActionItem[];
  conflicts: DetectedConflict[];
}

export interface MeetingCreateRequest {
  title: string;
  date: string;
  transcript: string;
  format: "txt" | "vtt";
}

export interface MeetingApprovalRequest {
  approved_decision_ids: string[];
  approved_action_item_ids: string[];
  edits?: Record<string, { owner?: string; deadline?: string; text?: string }>;
  conflict_resolutions?: Record<string, "supersede" | "dismiss">;
}

export interface MeetingApprovalResponse {
  status: string;
  meeting_id: number;
  committed_decisions: any[];
  committed_action_items: any[];
  resolved_conflicts: any[];
}

export interface Decision {
  id: string;
  meeting_id: number;
  text: string;
  owner?: string | null;
  date?: string | null;
  status: "active" | "superseded" | "conflicted";
  source_line?: number | null;
  chroma_id?: string | null;
  created_at?: string | null;
  meeting_title?: string | null;
}

export interface ActionItem {
  id: string;
  meeting_id: number;
  text: string;
  owner?: string | null;
  deadline?: string | null;
  confidence: number;
  source_line?: number | null;
  status: "proposed" | "approved" | "rejected" | "done";
  tracker_task_id?: string | null;
  created_at?: string | null;
}

export interface PersonDigestResponse {
  person: string;
  open_action_items: ActionItem[];
  upcoming_deadlines: ActionItem[];
  decisions_affecting_person: Decision[];
  summary?: string | null;
}
