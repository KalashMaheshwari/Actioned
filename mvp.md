# Actioned: MVP Plan

> **Meetings that remember what they decided.**
> A meeting-to-execution agent with cross-meeting memory and conflict detection.

Team of 2. **Person A (you): AI + backend core.** **Person B: frontend, integrations, demo and pitch.**

---

## 1. The problem

Decisions made in meetings get lost. Notes get written, but nobody checks whether a new decision contradicts an old one, and action items rarely make it into a tracker with an owner and a deadline.

Transcript summarizers don't fix this. They are stateless: every meeting is processed in isolation.

## 2. What Actioned is

Actioned ingests meeting transcripts, extracts decisions and action items, stores decisions in a persistent memory, and **flags when a new decision conflicts with an earlier one**. After a human approves, it creates tasks in a tracker, sends reminders before deadlines, and sends each person a weekly digest.

The two things that make it a system, not a summarizer:

1. **Cross-meeting memory** (a searchable log of every decision ever made)
2. **Conflict detection** (the agent says *which* earlier decision conflicts, who made it, and why)

## 3. MVP scope

### Must have (this is the product)

| # | Feature | Owner |
|---|---|---|
| 1 | Transcript ingestion with speaker attribution (plain text + Zoom/Meet VTT) | A |
| 2 | Extraction of decisions, action items, owners, deadlines (with confidence + source line) | A |
| 3 | Decision memory (structured DB + vector index) | A |
| 4 | Conflict detection against earlier decisions, with a stated reason | A |
| 5 | Confirmation step before anything is posted (approve / edit / reject) | A (API) + B (UI) |
| 6 | Task creation in one tracker (Trello) via API | B (A provides the approved payload) |

### Should have

| # | Feature | Owner |
|---|---|---|
| 7 | Reminders before deadlines (Slack) | B |
| 8 | Weekly digest per person | A (generation) + B (delivery/UI) |
| 9 | Evaluation: precision/recall on hand-labeled transcripts | A |

### Cut list (in this order, if time runs out)

1. Audio input (Whisper)
2. Weekly digest
3. Slack reminders
4. Edit-in-review (keep approve/reject)

**Never cut:** conflict detection and the confirmation step.

## 4. Architecture

```
 Transcript (txt / VTT)
        |
        v
 [Parser] ---> speaker-attributed lines
        |
        v
 [Extractor: Claude, structured JSON]
   decisions + action items (owner, deadline, confidence, source line)
        |
        v
 [Conflict detector]
   1. embed each new decision, query ChromaDB for similar past decisions
   2. Claude verifies: true contradiction? which one? why?
        |
        v
 [Review screen]  <-- human approve / edit / reject
        |
        v
 [Commit]
   - write decisions to SQLite + Chroma (memory)
   - create tasks in Trello
   - schedule reminders (APScheduler -> Slack)
        |
        v
 [Weekly digest per person]
```

**Key design choices**

- **Two-stage conflict detection.** Embeddings are cheap and good at *finding candidates*, but bad at deciding contradiction ("launch Mar 15" vs "launch Apr 2" are semantically close but conflicting). So retrieval finds candidates, then an LLM verifies and explains. This cuts false positives.
- **Memory is written only after approval.** Unapproved or rejected items never pollute the decision log.
- **Everything traces to a source.** Every extracted item stores the transcript line it came from, so a human can verify it in one click.
- **Dates are resolved in code, not by the LLM.** The LLM outputs the phrase ("by Friday"); `dates.py` resolves it against the meeting date. This avoids wrong-date hallucinations.

## 5. Tech stack

| Layer | Choice |
|---|---|
| Backend | Python 3.11+, FastAPI |
| Database | SQLite (structured decisions, items, meetings) |
| Vector memory | ChromaDB (local, persistent) |
| LLM | Claude API, structured JSON output |
| Embeddings | sentence-transformers (`all-MiniLM-L6-v2`), local |
| Scheduler | APScheduler |
| Integrations | Trello API, Slack incoming webhook |
| Frontend | Next.js + Tailwind + shadcn/ui |
| Optional | Whisper for audio |

## 6. Data model and API contract

### SQLite tables

**meetings**: `id, title, date, transcript_raw, created_at`

**decisions**: `id, meeting_id, text, owner, date, status (active | superseded | conflicted), source_line, chroma_id`

**action_items**: `id, meeting_id, text, owner, deadline, confidence, source_line, status (proposed | approved | rejected | done), tracker_task_id`

**conflicts**: `id, new_decision_id, old_decision_id, reason, status (open | confirmed | dismissed)`

### Endpoints

**`POST /meetings`**: transcript in, extracted items out (nothing is committed yet)

```json
// request
{ "title": "Sprint planning", "date": "2026-11-21", "transcript": "Priya: ...", "format": "txt" }

// response
{
  "meeting_id": 12,
  "decisions": [
    { "id": "d1", "text": "Launch moves to March 15", "owner": "Priya", "source_line": 14, "confidence": 0.93 }
  ],
  "action_items": [
    { "id": "a1", "text": "Update the launch checklist", "owner": "Rahul", "deadline": "2026-11-28", "source_line": 22, "confidence": 0.88 }
  ],
  "conflicts": [
    {
      "new_decision_id": "d1",
      "old_decision": { "id": 7, "text": "Launch on April 2", "owner": "Arjun", "meeting_title": "Kickoff", "date": "2026-10-03" },
      "reason": "Both set the launch date, but to different dates."
    }
  ]
}
```

**`GET /decisions`**: the memory log (`?status=active`, `?q=launch` for semantic search)

**`GET /meetings/{id}/conflicts`**: conflicts flagged for a meeting

**`POST /meetings/{id}/approve`**: commits approved items; writes memory, creates tracker tasks, schedules reminders

```json
{ "approved_decision_ids": ["d1"], "approved_action_item_ids": ["a1"], "edits": { "a1": { "owner": "Rahul", "deadline": "2026-11-29" } }, "conflict_resolutions": { "7": "supersede" } }
```

**`GET /digest/{person}`**: that person's open items, upcoming deadlines, and decisions affecting them

## 7. Person A: AI + backend core (your part)

You own everything that makes Actioned smart. Build in this order.

### Step 1: Project structure (done in the first commit)
Folders, stubs, `requirements.txt`, `.env.example`, health endpoint.

### Step 2: Contract + schemas
Write Pydantic models in `schemas.py` matching section 6. Share with B so they can build mocks. **Do this in hour 1.**

### Step 3: Parser (`services/parser.py`)
- Plain text format: `Speaker: text` per line
- Zoom/Meet VTT using `webvtt-py`
- Output: list of `{line_no, speaker, timestamp, text}`
- Edge cases: missing speaker (label "Unknown"), multi-line utterances

### Step 4: Extraction (`services/extractor.py` + `prompts/extract.txt`)
- Send numbered transcript lines to Claude with a JSON schema
- Extract decisions and action items, each with owner, deadline phrase, confidence, source line number
- Rules in the prompt: if the owner is vague ("someone should look into this"), set `owner: null` and lower the confidence; never invent an owner
- `services/dates.py` resolves deadline phrases ("by Friday", "next week", "end of month") against the meeting date using `python-dateutil`

### Step 5: Memory (`services/memory.py`, `db.py`)
- Create the SQLite tables from section 6
- On approval, store each decision in SQLite and embed it into ChromaDB (the `chroma_id` links the two)
- Functions: `add_decision()`, `search_similar(text, k)`, `list_decisions(filters)`

### Step 6: Conflict detection (`services/conflicts.py` + `prompts/conflict.txt`)
- For each new decision: `search_similar(text, k=5)` filtered to active decisions
- For each candidate pair, ask Claude: *is this a true contradiction? answer yes/no, give the reason in one sentence*
- Only return confirmed conflicts, with the old decision's owner, meeting, and date
- Tune the similarity threshold so unrelated decisions are not sent to the LLM

### Step 7: API endpoints (`api/*.py`)
Wire everything to the contract. Keep endpoints thin; logic lives in `services/`.

### Step 8: Approval flow
`POST /meetings/{id}/approve` writes memory, marks superseded decisions, and returns the final payload. B's code (or a function you call) creates the Trello tasks and schedules reminders.

### Step 9: Digest
Query open items and upcoming deadlines for a person; optionally have Claude write a short summary paragraph.

### Step 10: Evaluation (`eval/run_eval.py`)
- Hand-label 5-10 transcripts in `eval/labeled/` (expected action items and expected conflicts)
- Report precision and recall for action-item extraction and for conflict detection
- Put the numbers on a pitch slide

## 8. Person B: frontend, integrations, demo (for reference)

- Next.js app: upload page, review/confirm screen, decision log, digest view
- Trello task creation, Slack reminders (APScheduler), weekly digest delivery
- Demo data (3 fake meetings), pitch deck, demo script, backup recording

## 9. Build order and integration

| Phase | A | B |
|---|---|---|
| Hour 0-2 | Repo, contract, schemas | Scaffold Next.js, agree contract |
| Early | Parser + extraction | Review UI + decision log (on mocks) |
| Middle | Memory + conflict detection | Trello + demo meetings |
| **Integrate (by midpoint)** | Real endpoints live | Swap mocks for real API |
| Late | Evaluation, digest | Slack, reminders, pitch deck |
| Final | Both: rehearse the demo end to end, record a backup |

## 10. Demo script

Three pre-written meetings:

1. **Kickoff (Oct 3):** "Launch on April 2." Owner: Arjun.
2. **Sprint planning (Nov 14):** includes a vague owner ("someone should look into the pricing page") and a relative deadline ("by Friday").
3. **Planning review (Nov 21):** "Launch moves to March 15." This should trigger the conflict flag pointing back to Meeting 1.

Show: upload meeting 3, conflict flagged with reason, review screen, approve, task appears in Trello, decision log shows the old decision as superseded.

## 11. Pitch line

> *Actioned: meetings that remember what they decided.*
> Other tools summarize one meeting. Actioned remembers all of them, and tells you when you're contradicting yourself.

## 12. Git workflow

- One repo: `/backend`, `/frontend`, `/docs`
- A works on `backend/`, B works on `frontend/`, so merge conflicts are rare
- Commit small and often; push at least at every milestone
- Branches: `main` (always demoable), plus `feat/<name>` if you want them
- Never commit `.env` (it is gitignored)