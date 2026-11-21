# Actioned

> **Meetings that remember what they decided.**  
> A meeting-to-execution agent with cross-meeting memory and conflict detection.

## Monorepo Structure

```
actioned/
├── backend/               # AI + Backend Core (FastAPI, SQLite, ChromaDB, Claude)
│   ├── api/               # API endpoints (/meetings, /decisions, /digest)
│   ├── services/          # Parser, Extractor, Dates, Memory, Conflicts, Integrations
│   ├── prompts/           # LLM prompt templates (extract.txt, conflict.txt)
│   ├── eval/              # Benchmark & evaluation on hand-labeled transcripts
│   ├── tests/             # Pytest test suite
│   ├── requirements.txt   # Python dependencies
│   └── main.py            # FastAPI entry point
├── frontend/              # Next.js + Tailwind + shadcn/ui Frontend
├── docs/                  # API Contracts, documentation, and specs
│   └── API_CONTRACT.md    # Shared frontend/backend schema contract
└── mvp.md                 # Complete MVP specification and execution plan
```

## Quick Start

### Backend

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# Mac/Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env

# Run server
python main.py
# Runs at http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Runs at http://localhost:3000
```

### Run Tests & Evaluation

```bash
cd backend
pytest tests/
python -m eval.run_eval
```
