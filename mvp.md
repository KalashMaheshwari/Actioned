# Actioned: Product & System Overview (MVP)

> **"Meetings that remember what they decided."**  
> An autonomous meeting-to-execution agent with cross-meeting vector memory and semantic conflict detection.

---

## 1. Executive Summary & Problem Statement

### The Problem:
Every organization suffers from **decision amnesia**:
1. **Decisions made in meetings get lost**: Important agreements are buried in raw audio or lost in passive meeting summaries that nobody reads.
2. **Commitments are contradicted across time**: A decision made in Week 1 (*"Launch is targeted for April 15"*) is casually contradicted in Week 3 (*"Let's launch on April 2"*) without the team realizing it, blindsiding engineering and QA.
3. **Action items slip through the cracks**: Spoken commitments rarely make it into issue trackers with assigned owners and realistic deadlines.
4. **Existing AI tools fail**: Conventional summarizers (Otter, Fireflies, Zoom AI) are **stateless and amnesiac**—they process each meeting in complete isolation, with zero memory of past agreements and zero ability to flag contradictions.

### What Actioned Is:
**Actioned** is an active, stateful execution engine. It ingests meeting transcripts or raw audio, extracts decisions and action items, maintains a persistent memory of all team consensus, and **acts as a memory watchdog**. When a newly proposed decision contradicts an earlier agreement stored in memory, Actioned flags the conflict, explains the clash, and provides a human-in-the-loop authorization gate before dispatching verified tasks to external trackers (Trello) with pre-deadline reminders (APScheduler $\to$ Slack).

---

## 2. Core Pillars & System Capabilities

```
  [ Multi-Modal Ingestion ]
    • Plain text transcripts (Speaker: Utterance)
    • Zoom / Google Meet WebVTT captions
    • Audio files (.mp3, .wav, .m4a, .webm) via Whisper
               │
               ▼
  [ Extraction & Entity Resolution Engine ]
    • Separates formal Decisions from concrete Action Items
    • Entity resolution for fuzzy deadlines ("next Friday" → ISO 2026-10-10)
    • Attributed speaker assignment & confidence scoring
               │
               ▼
  [ Two-Stage Semantic Conflict Detection ]
    • Step 1: ChromaDB 1,536-dim vector retrieval for historical candidates
    • Step 2: Semantic verification of true contradiction & reason extraction
               │
               ▼
  [ Mandatory Human Authorization Gate ]
    • Human reviews proposed items in Executive Docket
    • In-line editing, assignee reassignment, and conflict resolution
    • Operator chooses: "Supersede Historical Consensus" or "Keep Both"
               │
               ▼
         [ Execution ]
 ┌─────────────┴─────────────┐
 ▼                           ▼
[ Permanent Memory ]     [ Tracker Dispatch ]      [ Alert Radar ]
SQLite + ChromaDB        Trello Cards              APScheduler -> Slack
Indexed & Searchable     Assigned with Due Dates   24h Pre-Deadline Alerts
               │
               ▼
[ Weekly Executive Digest ]
Personalized dossiers per team member (Arjun, Priya, Rahul, Neha)
```

### 1. Multi-Modal Transcript Ingestion with Speaker Attribution
- **Plain Text**: Parses transcript lines formatted as `Speaker: utterance` or `[Speaker] utterance`.
- **Conference WebVTT**: Ingests Zoom and Google Meet `.vtt` exports, extracting speaker voice tags (`<v Speaker>`) and exact timestamp offsets.
- **Audio Speech-to-Text**: Built-in Whisper integration transcribing speech into speaker turns for `.mp3`, `.wav`, `.m4a`, and `.webm` files.

### 2. Decision & Action Item Extraction
- Distinguishes conversational banter from binding team **Decisions** and assignable **Action Items**.
- **Fuzzy-to-ISO Date Normalization**: Converts relative verbal deadlines (*"by Friday"*, *"next week"*, *"end of month"*) into standardized calendar ISO dates anchored to the meeting's date.
- **Source Line Tracing**: Every extracted item maintains a direct reference to the transcript line number where it was spoken, enabling instant human verification.

### 3. Persistent Cross-Meeting Vector Memory
- Hybrid storage architecture:
  - **SQLite Database**: Relational storage for meetings, structured decisions, action items, assignees, and conflict resolutions.
  - **ChromaDB Vector Store**: Embeds every confirmed decision into a persistent vector space using dense semantic embeddings.
- Full semantic search capability: team members can search conceptually (e.g., *"launch date"*, *"pricing structure"*, *"tech stack"*) and instantly retrieve active and superseded agreements.

### 4. Semantic Contradiction & Conflict Detection (The Showstopper)
- **Two-Stage Conflict Engine**:
  1. *Retrieval Stage*: Embeds incoming decisions and queries ChromaDB with cosine similarity filters against active historical decisions.
  2. *Verification Stage*: An LLM / contradiction reasoning engine analyzes candidate pairs to determine if there is a genuine factual, temporal, or operational clash.
- **Explicit Natural Language Rationale**: Rather than a black-box alert, Actioned explains *why* the contradiction exists (e.g., *"Moving the release to April 2 advances the launch by 13 days, directly contradicting the April 15 target established in the Kickoff Meeting"*).
- **Lineage Tracking**: When an old decision is superseded, it is struck through and tagged with a reference to the meeting that superseded it.

### 5. Mandatory Human Authorization Gate
- **Zero Silent Commits**: The agent never writes to permanent memory or external trackers during ingestion.
- The meeting enters a draft proposal state where human operators:
  - Review side-by-side memory collision cards.
  - Select conflict resolutions (*"Supersede Historical Consensus"* vs *"Retain Both with Deviation Note"*).
  - Edit decision text, reassign owners, or adjust deadlines inline.
  - Approve or reject individual items with a single click.

### 6. Tracker Integration (Trello)
- Upon operator authorization, approved action items are automatically created as cards in Trello (or external issue trackers).
- Cards include the task title, description, transcript line provenance, assigned member, and calculated due date.

### 7. Background Deadline Reminders (APScheduler $\to$ Slack)
- An active background daemon (`APScheduler`) continuously monitors open deliverables.
- Triggers automated notifications to Slack incoming webhooks **24 hours prior** to impending deadlines, eliminating last-minute delivery failures.

### 8. Per-Person Personalized Weekly Digest
- Generates focused executive briefings tailored to each team member (e.g., **Arjun**, **Priya**, **Rahul**, **Neha**):
  - **AI Executive Synthesis**: High-level narrative summary of their priorities.
  - **Open Deliverables**: List of assigned tasks with Trello card links and deadline countdowns.
  - **Decisions Owned**: Historical consensus items where the person is the designated owner.

---

## 3. System Architecture & Technical Stack

| Layer | Technology | Purpose & Implementation |
|---|---|---|
| **Frontend Framework** | **Next.js 16 (Turbopack)** | App Router, Server/Client components, React 19. |
| **UI Styling** | **Tailwind CSS v4** | Claude-inspired warm editorial palette (`#F5F0E6`), tactile paper surfaces, hairline borders. |
| **Typography** | **Google Fonts** | `Newsreader` (editorial serif headings), `Plus Jakarta Sans` (body), `JetBrains Mono` (metadata). |
| **Backend API** | **FastAPI (Python 3.11+)** | High-performance asynchronous REST API (`/meetings`, `/decisions`, `/digest`). |
| **Relational Database** | **SQLite (WAL Mode)** | Persistent transactional storage for meetings, decisions, and action items (`actioned.db`). |
| **Vector Database** | **ChromaDB** | Local persistent vector store with cosine distance indexing for decision retrieval. |
| **Extraction & Reasoning** | **Anthropic Claude / OpenAI** | Structured JSON extraction of decisions/items and contradiction verification with deterministic fallback. |
| **Audio Pipeline** | **OpenAI Whisper** | Audio transcription and speaker turn formatting. |
| **Background Scheduler** | **APScheduler** | 24-hour pre-deadline monitoring and alert dispatch. |
| **Integrations** | **Trello & Slack Webhooks** | External task tracker creation and webhook notifications. |

---

## 4. Data Model & Database Schemas

### SQLite Tables

#### `meetings`
- `id` (INTEGER, Primary Key): Unique meeting identifier.
- `title` (TEXT): Meeting subject / title.
- `date` (TEXT): ISO meeting date (`YYYY-MM-DD`).
- `transcript_raw` (TEXT): Raw ingested text or VTT content.
- `created_at` (TIMESTAMP): Ingestion timestamp.

#### `decisions`
- `id` (INTEGER, Primary Key): Unique decision identifier.
- `meeting_id` (INTEGER, Foreign Key): Origin meeting ID.
- `text` (TEXT): Verified decision statement.
- `owner` (TEXT): Designated owner or leader.
- `date` (TEXT): Effective date.
- `status` (TEXT): `active`, `superseded`, or `conflicted`.
- `source_line` (INTEGER): Transcript line provenance.
- `chroma_id` (TEXT): Link to vector embedding in ChromaDB.

#### `action_items`
- `id` (INTEGER, Primary Key): Unique action item identifier.
- `meeting_id` (INTEGER, Foreign Key): Origin meeting ID.
- `text` (TEXT): Deliverable description.
- `owner` (TEXT): Assigned team member.
- `deadline` (TEXT): Standardized ISO calendar deadline.
- `confidence` (FLOAT): Extraction confidence score (0.0 to 1.0).
- `source_line` (INTEGER): Transcript line provenance.
- `status` (TEXT): `proposed`, `approved`, `rejected`, or `done`.
- `tracker_task_id` (TEXT): External tracker card ID (e.g. `trello-card-...`).

#### `conflicts`
- `id` (INTEGER, Primary Key): Unique conflict record identifier.
- `new_decision_id` (INTEGER): Proposed incoming decision.
- `old_decision_id` (INTEGER): Contradicted historical decision in memory.
- `reason` (TEXT): Explicit natural language contradiction rationale.
- `status` (TEXT): `open`, `superseded`, or `dismissed`.

---

## 5. API Specification

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service heartbeat & database connectivity check. |
| `POST` | `/meetings/ingest` | Parses transcript, extracts decisions/items, and scans ChromaDB for conflicts (draft proposal; no memory written). |
| `POST` | `/meetings/audio` | Accepts multipart audio upload (.mp3, .wav, etc.), transcribes via Whisper, and triggers ingestion. |
| `POST` | `/meetings/{id}/approve` | **Executive Authorization Gate**: Writes approved decisions to SQLite & ChromaDB, pushes tasks to Trello, and arms APScheduler reminders. |
| `GET` | `/decisions` | Queries the permanent Decision Memory Log with optional filters (`?status=active`, `?q=semantic+query`). |
| `GET` | `/digest/{person_name}` | Generates the personalized weekly digest, open tasks, owned decisions, and AI executive summary for a person. |
| `POST` | `/meetings/reset-demo` | Administrative utility that restores the baseline workspace dataset for testing cycles. |

---

## 6. End-to-End Evaluation Lifecycle

The complete system lifecycle can be demonstrated using three canonical meetings:

1. **Meeting 1: Roadmap Kickoff (October 3, 2026)**
   - *Spoken statement*: *"We decided that launch is scheduled for April 15. Arjun is leading the backend API."*
   - *Outcome*: Decision extracted (*Launch: April 15*). Upon human authorization, it is indexed as **Active Consensus** in ChromaDB.
2. **Meeting 2: Sprint 14 Planning (November 14, 2026)**
   - *Spoken statement*: *"Priya will finish the frontend UI components by next Friday."*
   - *Outcome*: Engine resolves *"next Friday"* to ISO `2026-11-20`. Upon approval, a card is dispatched to Trello and a 24-hour pre-deadline Slack reminder is armed.
3. **Meeting 3: Executive Review (November 21, 2026)**
   - *Spoken statement*: *"Leadership agreed to move launch up to April 2."*
   - *Outcome*: **Conflict Triggered**. ChromaDB identifies the semantic collision with Meeting 1. The docket highlights both decisions with the explanation: *"Moving launch to April 2 advances the schedule by 13 days and contradicts the April 15 target established in Meeting 1."*
   - *Resolution*: The operator selects **Supersede**. Meeting 1’s decision is archived as **Superseded**, and Meeting 3’s decision becomes the new **Active Consensus**.
