# Actioned — Official Presentation & Pitch Script

> **Product**: Actioned — Autonomous Meeting-to-Execution Agent  
> **Target Audience**: Hackathon Judges, Technical Evaluators, Enterprise Stakeholders  
> **Presenter Role**: Lead Presenter / Product Architect  

---

## 1. The 30-Second Elevator Pitch

> *"Every company has the exact same silent productivity killer: **decisions made in meetings get lost.**
> 
> Right now, tools like Otter, Fireflies, and Zoom AI generate passive meeting summaries. But summaries don't do work. A summary can't remember that two weeks ago the team agreed to launch on April 15, and it won't stop you when today's meeting casually pivots to April 2 without checking dependencies.
> 
> We built **Actioned**: an autonomous execution agent with persistent cross-meeting vector memory. It ingests transcripts or raw audio, extracts decisions, assigns owners, calculates ISO deadlines, and most importantly—**acts as a memory watchdog**. When a new meeting contradicts a past agreement, Actioned catches the conflict, explains the clash, and upon human confirmation, dispatches tasks straight into Trello with 24-hour deadline reminders."*

---

## 2. The Problem Statement Breakdown

### The Core Problem:
> *"Decisions made in meetings get lost. Teams must build:
> 1. Transcript ingestion with speaker attribution;
> 2. Extraction of decisions, action items, owners, and deadlines;
> 3. Detection of conflicts with earlier decisions stored in memory;
> 4. Creation of tasks in a tracker through an integration;
> 5. Reminders before deadlines;
> 6. A weekly digest per person;
> 7. A confirmation step before anything gets posted."*

### Why Cross-Meeting Memory Is the Missing Piece:
Most AI apps are **ephemeral**—they process one meeting in total isolation. Actioned is a **stateful agent**. Its cross-meeting memory and semantic contradiction engine turn passive transcripts into a governed execution pipeline.

---

## 3. The 3-Minute Stage Demo Script

### **[0:00 - 0:30] Hook & Ingestion**
* **Action on Screen**: Start on the Home Ingestion Screen (`/`).
* **Spoken Pitch**:
  > *"Welcome to Actioned. Let's see what happens during a real team lifecycle.
  > Here, our team can ingest meeting audio via Whisper, raw transcripts, or Zoom/Google Meet WebVTT captions with speaker attribution.
  > Let's load our first meeting: **Meeting 1: Roadmap Kickoff** on October 3rd."*
* **Action on Screen**: Click `01 / ROADMAP KICKOFF`. Click **Analyze transcript & check memory**.

---

### **[0:30 - 1:15] Extraction, Resolution & The Authorization Gate**
* **Action on Screen**: The screen transitions to `/meetings/1/review`.
* **Spoken Pitch**:
  > *"Notice what happened in under two seconds:
  > 1. **Speaker Attribution**: The engine isolated speaker turns.
  > 2. **Decision & Action Item Extraction**: It extracted the core decision—that launch is targeted for April 15.
  > 3. **Entity & Fuzzy Date Resolution**: When Arjun said 'next Friday,' the engine automatically resolved it to an exact calendar ISO date.
  > 4. **Human Authorization Gate**: This is critical. Actioned **never** silently writes to production systems. Everything enters an executive docket where the human operator can edit text, assign owners, or reject items.
  > 
  > Let's authorize this meeting."*
* **Action on Screen**: Click **Authorize & Commit to Memory**. Point out that the decisions are now indexed in SQLite and the ChromaDB vector database.

---

### **[1:15 - 2:00] The Showstopper: Semantic Contradiction Detection**
* **Action on Screen**: Return to the Home screen (`/`) and click `03 / SCHEDULE SHIFT` (*Executive Review* on November 21st). Click **Analyze transcript & check memory**.
* **Spoken Pitch**:
  > *"Now, weeks later, the leadership team holds an Executive Review. In the meeting, they decide: 'We are preponing launch to April 2.'
  > In any other company, this creates chaos. Frontend doesn't know, QA is blindsided, and the old April 15 deadline is forgotten.
  > 
  > Watch what Actioned does."*
* **Action on Screen**: Point to the **Contradiction with Historical Consensus** memorandum at the top of the docket.
* **Spoken Pitch**:
  > *"Actioned queried ChromaDB across historical meetings and flagged an immediate conflict:
  > - **On the left**: It pulls the historical consensus from Meeting 1 (*'Launch on April 15'*).
  > - **On the right**: The newly proposed revision (*'Launch on April 2'*).
  > - **The Contradiction Analysis**: Actioned explicitly explains that moving the date to April 2 directly shortens the schedule by 13 days and contradicts earlier consensus.
  > 
  > The operator can choose: **Supersede previous decision** or **Keep both decisions with a deviation note**. We choose 'Supersede' and authorize the docket."*
* **Action on Screen**: Click **Authorize & Commit to Memory**.

---

### **[2:00 - 2:30] Decision Memory Log**
* **Action on Screen**: Click **Decision Memory** in the navigation bar (`/decisions`).
* **Spoken Pitch**:
  > *"Here is Actioned's permanent Decision Memory Log.
  > Notice the intelligence at play:
  > - The new decision (*April 2 launch*) is stamped as **Active Consensus** in sage green.
  > - The old decision (*April 15 launch*) is automatically archived as **Superseded** with a strike-through and a lineage reference to Meeting 3.
  > Anyone on the team can search semantically—typing 'launch date' or 'pricing'—and instantly see what was decided, who owns it, and when it changed."*

---

### **[2:30 - 3:00] Per-Person Weekly Digest & Task Execution**
* **Action on Screen**: Click **Team Digest** in the navigation bar (`/digest`).
* **Spoken Pitch**:
  > *"Finally, how does this drive execution?
  > Every person on the team gets an automated, personalized executive digest.
  > Let's click on **Arjun**, our backend lead:
  > - He gets an **AI Executive Synthesis** of his week.
  > - His open deliverables are synchronized with **Trello**, displaying live card references.
  > - Our **APScheduler engine** is running in the background, monitoring deadlines and staging automated **Slack alerts 24 hours prior**.
  > 
  > No lost decisions. No forgotten tasks. Complete team alignment.
  > Thank you, and we're excited to answer your questions!"*

---

## 4. Competitive Differentiation: "Why Not Just Use Otter or ChatGPT?"

If judges ask: *"How is this different from existing transcription or AI note-taking tools?"*

| Feature | Standard AI Note-Takers (Otter, Fireflies, Zoom AI) | Actioned |
|---|---|---|
| **Memory Scope** | Single-meeting isolation (amnesiac). | **Persistent Cross-Meeting Vector Store** (ChromaDB). |
| **Conflict Detection** | None. Will summarize contradictory meetings without noticing. | **Semantic Contradiction Radar** (identifies date shifts, scope clashes, and broken commitments). |
| **Downstream Execution** | Static notes or email text. | **Two-way Tracker Integration** (Trello cards with assignees & ISO deadlines). |
| **Proactive Reminders** | None. | **Background Scheduler** (APScheduler alert engine 24h before deadlines). |
| **Governance** | Unchecked AI generation. | **Human Authorization Gate** before anything commits to permanent memory. |
| **Personalization** | One generic summary for all attendees. | **Per-Person Executive Dossier** tailored to each individual's deliverables. |

---

## 5. Judge Q&A Defense Guide

### Q1: *"How does conflict detection actually work under the hood?"*
> **Answer**:
> *"When a meeting is ingested, we extract decisions and embed them into a 1,536-dimensional vector space using ChromaDB. We perform cosine similarity queries against all past approved decisions to find top-k relevant historical records. If semantic relevance is high, our contradiction engine analyzes whether the new statement negates, shifts, or contradicts the temporal or operational scope of the historical statement. If a conflict exists, it is isolated and flagged with an explicit natural language rationale."*

### Q2: *"Why is the human authorization step mandatory?"*
> **Answer**:
> *"In enterprise software, fully autonomous writes without human verification are dangerous. Hallucinations or misunderstood nuances in speech could delete valid roadmap milestones or spam tracker boards. Actioned implements a strict **human-in-the-loop governance gate**. The agent drafts the docket, highlights conflicts, and suggests solutions, but the human retains authority to commit to memory."*

### Q3: *"How are deadlines resolved from vague speech?"*
> **Answer**:
> *"We built an entity resolution pipeline that pairs meeting anchor dates with relative expressions. When a speaker says 'by next Friday' during a meeting on October 3, 2026, the engine computes the exact offset and outputs `2026-10-10`. If a speaker says 'end of month,' it anchors to the final calendar day. This standardized date powers both Trello cards and APScheduler 24-hour reminder triggers."*

### Q4: *"What is the tech stack?"*
> **Answer**:
> - **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide Icons, Plus Jakarta Sans & Newsreader typography.
> - **Backend**: Python FastAPI with full async pipeline.
> - **Memory & Database**: ChromaDB vector store for semantic memory + SQLite WAL for transactional durability.
> - **Automation**: APScheduler background daemon for pre-deadline alerts.
> - **Transcription**: OpenAI Whisper speech-to-text pipeline for audio files with WebVTT parser for conference captions.
> - **Integrations**: Trello REST API + Slack Webhook dispatcher.
