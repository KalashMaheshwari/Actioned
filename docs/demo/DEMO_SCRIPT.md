# Actioned Demo Walkthrough Script (Person B & A)

> **Goal:** Prove that Actioned is a **system with cross-meeting memory**, not just a summarizer.

---

## Setup Before Demo
1. Start backend:
   ```bash
   cd backend
   .venv\Scripts\activate
   python main.py
   ```
2. Start frontend:
   ```bash
   cd frontend
   npm run dev
   ```
3. Open browser to `http://localhost:3000`.

---

## Step-by-Step Demo (3-5 Minutes)

### Act 1: The Baseline Meeting (Meeting 1 - Kickoff)
1. On `http://localhost:3000`, click **"Meeting 1: Kickoff Meeting"** under Quick Demo Scenarios.
2. Point out the transcript:
   - Arjun states: *"First big milestone: we decided that launch is scheduled for April 2."*
   - Neha commits: *"I will prepare the cloud architecture document by next Friday."*
3. Click **"Analyze & Extract"**.
4. Show the Review Screen:
   - Decision extracted: *"Launch is scheduled for April 2"* (Owner: Arjun, Confidence: 92%).
   - Action item extracted: *"Prepare the cloud architecture document"* (Owner: Neha, Deadline resolved to Oct 9).
   - Conflicts: 0 (since this is the first meeting).
5. Click **"Approve & Commit"**.
6. Navigate to **"Decision Memory"** tab:
   - Point out that *"Launch is scheduled for April 2"* is now active in persistent cross-meeting memory.

---

### Act 2: Vague Owners & Relative Dates (Meeting 2 - Sprint Planning)
1. Return to **"Ingest Meeting"** and click **"Meeting 2: Sprint Planning"**.
2. Point out:
   - Priya says: *"Someone should look into the pricing page."*
3. Click **"Analyze & Extract"**.
4. Show:
   - The pricing page task has **no invented owner** (`null`) and an attention flag.
   - Assignee can be assigned to "Rahul" right in the UI before committing.
5. Click **"Approve & Commit"**.

---

### Act 3: The Climax — Cross-Meeting Conflict Detection (Meeting 3 - Planning Review)
1. Return to **"Ingest Meeting"** and click **"Meeting 3: Planning Review"** (Nov 21).
2. Point out what happens in this meeting:
   - Priya says: *"Big update on timeline: we decided that launch moves to March 15."*
3. Click **"Analyze & Extract"**.
4. **BOOM! The Amber Conflict Alert Card appears at the top:**
   - **Earlier Decision:** *"Launch is scheduled for April 2"* (Owner: Arjun, Kickoff Meeting, Oct 3).
   - **New Proposed Decision:** *"Launch moves to March 15"*.
   - **Reason:** *"Both set the launch date, but to different dates."*
5. Show the human confirmation control:
   - Toggle **"Supersede Old Decision"**.
6. Click **"Approve & Commit"**.

---

### Act 4: Memory Verification & Digest
1. Click **"Decision Memory"**:
   - The old April 2 decision is now strikethrough / marked **"Superseded"**.
   - The new March 15 decision is marked **"Active"**.
   - Test semantic search: type `"launch"` into the search bar to demonstrate ChromaDB vector query.
2. Click **"Team Digest"**:
   - Select **Rahul** or **Neha** to show open tasks with deadlines and active decisions.
   - Highlight the AI executive summary.
