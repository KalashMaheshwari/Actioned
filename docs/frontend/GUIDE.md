# Frontend Guide (Person B)

Welcome! This guide explains the frontend architecture, how to run and customize the UI, and how to connect with the backend core.

---

## Quick Start

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:3000
```

Make sure the backend is running at `http://localhost:8000`:
```bash
cd backend
.venv\Scripts\activate  # Windows
python main.py
```

---

## Pages & Routes

| Route | Purpose | Key Components |
|---|---|---|
| `/` | **Meeting Ingestion** | Preset loaders (1-click load Meeting 1, 2, 3), transcript textarea, format selector (txt/VTT), title & date input. |
| `/meetings/[id]/review` | **Human Confirmation Step** (MVP Scope #5) | Conflict detection banner (old vs new decision, contradiction reason, supersede toggle), editable decisions list, editable action items (assignee & deadline picker), Commit button. |
| `/decisions` | **Cross-Meeting Memory Log** (MVP Scope #3) | Semantic vector search input (`q=...`), status filter pills (active / superseded), full decision history cards. |
| `/digest` | **Weekly Person Digest** (MVP Scope #8) | Team member tabs (Arjun, Priya, Rahul, Neha), AI executive summary, open tasks table, active decisions list. |

---

## Data Flow & API Client

All API calls are centralized in [`src/lib/api.ts`](file:///c:/Github%20Repos/actioned/frontend/src/lib/api.ts):
- `ingestMeeting(payload)` -> `POST /meetings`
- `approveMeeting(id, payload)` -> `POST /meetings/{id}/approve`
- `getDecisions(status?, query?)` -> `GET /decisions`
- `getPersonDigest(person)` -> `GET /digest/{person}`
- `checkBackendHealth()` -> `GET /health`

All TypeScript interfaces match the backend Pydantic models in [`src/lib/types.ts`](file:///c:/Github%20Repos/actioned/frontend/src/lib/types.ts).

---

## Ready-to-Use Demo Transcripts

In [`src/lib/mockData.ts`](file:///c:/Github%20Repos/actioned/frontend/src/lib/mockData.ts), the 3 pre-written demo transcripts from Section 10 of `mvp.md` are pre-wired. On the home page, clicking any of the 3 cards automatically fills the form for instant demoing!
