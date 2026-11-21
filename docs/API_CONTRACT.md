# Actioned API Contract & Architecture

> **Meetings that remember what they decided.**  
> A meeting-to-execution agent with cross-meeting memory and conflict detection.

---

## Architecture Overview

```
 Transcript (txt / VTT)
        |
        v
 [Parser: services/parser.py] ---> speaker-attributed lines
        |
        v
 [Extractor: Claude 3.5 Sonnet / Heuristic, structured JSON]
   decisions + action items (owner, deadline, confidence, source line)
        |
        v
 [Conflict detector: services/conflicts.py]
   1. ChromaDB vector query (all-MiniLM-L6-v2) for similar past decisions
   2. Claude verifies: true contradiction? which one? why?
        |
        v
 [Review screen: Next.js Frontend] <-- human approve / edit / reject
        |
        v
 [Commit: POST /meetings/{id}/approve]
   - write decisions to SQLite + ChromaDB (memory)
   - create tasks in Trello
   - schedule Slack reminders
        |
        v
 [Weekly digest per person: GET /digest/{person}]
```

---

## API Endpoints

### 1. Ingest Meeting
`POST /meetings`
- **Request**:
```json
{
  "title": "Sprint planning",
  "date": "2026-11-21",
  "transcript": "Priya: ...",
  "format": "txt"
}
```
- **Response**:
```json
{
  "meeting_id": 1,
  "decisions": [
    { "id": "d1", "text": "Launch moves to March 15", "owner": "Priya", "source_line": 14, "confidence": 0.93 }
  ],
  "action_items": [
    { "id": "a1", "text": "Update the launch checklist", "owner": "Rahul", "deadline": "2026-11-28", "source_line": 22, "confidence": 0.88 }
  ],
  "conflicts": [
    {
      "new_decision_id": "d1",
      "old_decision": { "id": "d1_old", "text": "Launch on April 2", "owner": "Arjun", "meeting_title": "Kickoff", "date": "2026-10-03" },
      "reason": "Both set the launch date, but to different dates."
    }
  ]
}
```

### 2. Decision Memory Log
`GET /decisions?status=active&q=launch`
- Retrieves the persistent cross-meeting decision log. Supports semantic similarity search (`q=...`) and status filtering.

### 3. Commit & Approve Meeting
`POST /meetings/{id}/approve`
- **Request**:
```json
{
  "approved_decision_ids": ["d1"],
  "approved_action_item_ids": ["a1"],
  "edits": {
    "a1": { "owner": "Rahul", "deadline": "2026-11-29" }
  },
  "conflict_resolutions": {
    "d1_old": "supersede"
  }
}
```
- **Response**:
```json
{
  "status": "committed",
  "meeting_id": 1,
  "committed_decisions": [...],
  "committed_action_items": [...],
  "resolved_conflicts": [...]
}
```

### 4. Person Digest
`GET /digest/{person}`
- Returns open action items, upcoming deadlines, and decisions affecting that person with an AI executive summary.

### 5. Health Check
`GET /health`
- Status of backend core service.
