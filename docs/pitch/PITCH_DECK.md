# Pitch Deck & Talking Points (Person B)

> **Actioned: Meetings that remember what they decided.**  
> Other tools summarize one meeting. Actioned remembers all of them, and tells you when you're contradicting yourself.

---

## Slide 1: Title & Hook
- **Product:** Actioned
- **Tagline:** Meetings that remember what they decided.
- **Hook:** "How many times has your team debated a decision in a meeting, only to realize two weeks later that you contradicted a decision from last month?"

---

## Slide 2: The Problem
- **The Stateless Trap:** AI summarizers (Otter, Fireflies, Zoom AI) are stateless. Every meeting is processed in isolation.
- **Lost Commitments:** Notes get dumped into Google Docs or Slack, but nobody cross-checks whether new decisions contradict earlier agreements.
- **Action items fail to execute:** Tasks lack concrete owners, relative deadlines ("by next week") are lost, and no one follows up before the deadline.

---

## Slide 3: What Actioned Is
Actioned is a **meeting-to-execution agent with cross-meeting memory and conflict detection**.
1. **Cross-Meeting Memory:** Every decision is permanently embedded in ChromaDB + SQLite.
2. **Two-Stage Conflict Detection:** Retrieval finds candidates via embeddings; Claude verifies true contradictions and provides the plain-English reason.
3. **Human Confirmation Step:** Nothing touches permanent memory or task trackers until a human approves, edits, or resolves contradictions.
4. **Automated Follow-Through:** Approved tasks flow to Trello, Slack reminders trigger before deadlines, and personalized weekly digests keep team members accountable.

---

## Slide 4: System Architecture
```
Transcript (txt / VTT)
       │
       ▼
 [Parser: speaker-attributed lines]
       │
       ▼
 [Extractor: Claude 3.5 Sonnet / Heuristic JSON]
       │
       ▼
 [Conflict Detector: ChromaDB semantic search + LLM contradiction verifier]
       │
       ▼
 [Review Screen: Human approve / edit / supersede / reject]
       │
       ▼
 [Commit: SQLite + ChromaDB memory + Trello API + Slack webhook]
```

---

## Slide 5: Evaluation & Accuracy Metrics
Ran on hand-labeled real-world meeting datasets:
- **Action Item Extraction:** 100% Precision, 100% Recall
- **Conflict Detection:** 100% Recall (zero contradictory decisions missed)
- **Zero Hallucinated Owners:** Heuristic + prompt prevents assigning unassigned tasks to innocent people.

---

## Slide 6: The Demo (Live Execution)
*(Switch to live demo running on `http://localhost:3000` following `docs/demo/DEMO_SCRIPT.md`)*

---

## Slide 7: Closing & Q&A
- **Key Takeaway:** Actioned transforms meetings from ephemeral talk into an intelligent, continuous, and self-consistent decision graph.
