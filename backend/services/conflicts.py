import os
import json
import re
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
import anthropic

from schemas import ExtractedDecision, DetectedConflict, OldDecisionRef
from services.memory import search_similar_decisions

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"

def get_conflict_prompt_template() -> str:
    prompt_file = PROMPTS_DIR / "conflict.txt"
    if prompt_file.exists():
        return prompt_file.read_text(encoding="utf-8")
    return ""

def _heuristic_verify_conflict(
    new_dec: ExtractedDecision,
    cand: Dict[str, Any]
) -> Tuple[bool, str]:
    """
    Heuristic contradiction check when ANTHROPIC_API_KEY is not set or for offline testing.
    Checks date contradiction, opposing launch dates, or polar opposites.
    """
    new_t = new_dec.text.lower()
    old_t = cand["text"].lower()

    # Launch date conflict: both mention launch and different statements
    if "launch" in new_t and "launch" in old_t:
        if new_t != old_t:
            return True, f"Both set the launch date, but to different dates ('{cand['text']}' vs '{new_dec.text}')."

    # Target changes
    if ("move to" in new_t or "moves to" in new_t or "change" in new_t) and ("launch" in new_t or "deadline" in new_t or "date" in new_t):
        if new_t != old_t:
            return True, f"Directly alters the previously agreed target in '{cand['text']}'."

    return False, ""

def detect_conflicts(
    meeting_title: str,
    meeting_date: str,
    new_decisions: List[ExtractedDecision]
) -> List[DetectedConflict]:
    """
    Two-stage conflict detection:
    1. Embed each new decision and retrieve top candidates from ChromaDB
    2. LLM (or heuristic fallback) verifies: true contradiction? which one? why?
    """
    conflicts: List[DetectedConflict] = []
    api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    prompt_template = get_conflict_prompt_template()

    for new_dec in new_decisions:
        # Step 1: Candidate retrieval
        candidates = search_similar_decisions(new_dec.text, k=5, filter_status="active")
        if not candidates:
            continue

        for cand in candidates:
            is_conflict = False
            reason = ""

            # Step 2: Verification
            if api_key and prompt_template:
                try:
                    client = anthropic.Anthropic(api_key=api_key)
                    prompt = prompt_template.format(
                        old_id=cand.get("id"),
                        old_text=cand.get("text"),
                        old_owner=cand.get("owner") or "Unassigned",
                        old_meeting_title=cand.get("meeting_title") or "Previous Meeting",
                        old_meeting_date=cand.get("date") or "Earlier",
                        new_id=new_dec.id,
                        new_text=new_dec.text,
                        new_owner=new_dec.owner or "Unassigned",
                        new_meeting_title=meeting_title,
                        new_meeting_date=meeting_date
                    )
                    resp = client.messages.create(
                        model="claude-3-5-sonnet-20241022",
                        max_tokens=600,
                        messages=[{"role": "user", "content": prompt}]
                    )
                    content_text = resp.content[0].text.strip()
                    if content_text.startswith("```"):
                        content_text = re.sub(r"^```(?:json)?\n", "", content_text)
                        content_text = re.sub(r"\n```$", "", content_text)
                    eval_data = json.loads(content_text)
                    is_conflict = eval_data.get("is_conflict", False)
                    reason = eval_data.get("reason", "")
                except Exception as e:
                    print(f"[ConflictDetector] LLM verification failed: {e}. Falling back to heuristic.")
                    is_conflict, reason = _heuristic_verify_conflict(new_dec, cand)
            else:
                is_conflict, reason = _heuristic_verify_conflict(new_dec, cand)

            if is_conflict:
                conflicts.append(DetectedConflict(
                    new_decision_id=new_dec.id,
                    old_decision=OldDecisionRef(
                        id=cand["id"],
                        text=cand["text"],
                        owner=cand.get("owner"),
                        meeting_title=cand.get("meeting_title"),
                        date=cand.get("date")
                    ),
                    reason=reason
                ))

    return conflicts
