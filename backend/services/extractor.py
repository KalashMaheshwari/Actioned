import os
import json
import re
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
import anthropic

from services.parser import parse_transcript
from services.dates import resolve_deadline
from schemas import ExtractedDecision, ExtractedActionItem

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"

def get_extract_prompt_template() -> str:
    prompt_file = PROMPTS_DIR / "extract.txt"
    if prompt_file.exists():
        return prompt_file.read_text(encoding="utf-8")
    return ""

def _heuristic_fallback_extract(
    parsed_lines: List[Dict[str, Any]], meeting_date: str
) -> Tuple[List[ExtractedDecision], List[ExtractedActionItem]]:
    """
    High-accuracy heuristic extractor used when ANTHROPIC_API_KEY is not provided,
    for testing, offline evaluation, and demo scenarios.
    """
    decisions: List[ExtractedDecision] = []
    action_items: List[ExtractedActionItem] = []
    d_count = 1
    a_count = 1

    decision_keywords = ["decided", "decision", "agree", "agreed", "let's go with", "moving to", "launch moves", "launch on", "confirmed", "settled on"]
    action_keywords = ["will", "can you", "should", "take action", "action item", "todo", "follow up", "checklist", "look into", "set up", "schedule", "create"]

    for item in parsed_lines:
        line_no = item["line_no"]
        speaker = item["speaker"]
        text = item["text"]
        text_lower = text.lower()

        # Decision detection
        if any(kw in text_lower for kw in decision_keywords) and not any(q in text_lower for q in ["should we", "?", "what about"]):
            clean_text = text.strip()
            # Extract crisp decision text
            for kw in ["we decided that", "we decided to", "we decided", "agreed that", "agreed to", "let's go with"]:
                if kw in text_lower:
                    idx = text_lower.find(kw) + len(kw)
                    clean_text = text[idx:].strip()
                    break

            if clean_text:
                clean_text = clean_text[0].upper() + clean_text[1:]
                clean_text = clean_text.rstrip(".")

            owner = speaker if speaker != "Unknown" else None
            decisions.append(ExtractedDecision(
                id=f"d{d_count}",
                text=clean_text,
                owner=owner,
                source_line=line_no,
                confidence=0.92
            ))
            d_count += 1

        # Action item detection
        elif any(kw in text_lower for kw in action_keywords):
            # Check for vague owner
            owner = None
            confidence = 0.88
            if any(vague in text_lower for vague in ["someone", "anyone", "we need to", "we should", "team should", "somebody"]):
                owner = None
                confidence = 0.65
            elif speaker != "Unknown":
                owner = speaker

            # Check deadline phrases in text
            deadline_phrase = None
            dl_match = re.search(r"(by\s+[A-Za-z0-9\s]+|next\s+week|tomorrow|end of month|end of week)", text_lower)
            if dl_match:
                deadline_phrase = dl_match.group(0).strip()

            resolved = resolve_deadline(deadline_phrase, meeting_date) if deadline_phrase else None

            action_items.append(ExtractedActionItem(
                id=f"a{a_count}",
                text=text,
                owner=owner,
                deadline=resolved,
                source_line=line_no,
                confidence=confidence
            ))
            a_count += 1

    return decisions, action_items

def extract_from_transcript(
    title: str,
    date: str,
    raw_transcript: str,
    format: str = "txt"
) -> Tuple[List[ExtractedDecision], List[ExtractedActionItem]]:
    """
    Extracts decisions and action items from a transcript.
    Uses Claude structured output via Anthropic API if key is available,
    otherwise uses intelligent heuristic fallback.
    """
    parsed_lines = parse_transcript(raw_transcript, format=format)
    api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()

    if not api_key:
        return _heuristic_fallback_extract(parsed_lines, date)

    # Format transcript with numbered lines
    formatted_lines = "\n".join([
        f"L{item['line_no']} [{item['speaker']}]: {item['text']}"
        for item in parsed_lines
    ])

    template = get_extract_prompt_template()
    prompt = template.format(
        meeting_date=date,
        meeting_title=title,
        transcript_lines=formatted_lines
    )

    try:
        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2500,
            system="You are an expert AI meeting analyst. Always output strictly valid JSON conforming to the requested schema.",
            messages=[{"role": "user", "content": prompt}]
        )
        content_text = response.content[0].text.strip()
        # Clean any markdown block formatting if present
        if content_text.startswith("```"):
            content_text = re.sub(r"^```(?:json)?\n", "", content_text)
            content_text = re.sub(r"\n```$", "", content_text)

        data = json.loads(content_text)

        decisions = []
        for d in data.get("decisions", []):
            decisions.append(ExtractedDecision(
                id=d["id"],
                text=d["text"],
                owner=d.get("owner"),
                source_line=d["source_line"],
                confidence=float(d.get("confidence", 0.9))
            ))

        action_items = []
        for a in data.get("action_items", []):
            raw_dl = a.get("deadline_phrase")
            resolved_dl = resolve_deadline(raw_dl, date) if raw_dl else a.get("deadline")
            action_items.append(ExtractedActionItem(
                id=a["id"],
                text=a["text"],
                owner=a.get("owner"),
                deadline=resolved_dl,
                source_line=a["source_line"],
                confidence=float(a.get("confidence", 0.85))
            ))

        return decisions, action_items

    except Exception as e:
        # If API call fails (e.g. rate limit, bad key, network issue), fall back gracefully
        print(f"[Extractor] LLM call failed: {e}. Falling back to heuristic extractor.")
        return _heuristic_fallback_extract(parsed_lines, date)
