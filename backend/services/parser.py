import io
import re
from typing import List, Dict, Any, Optional

def parse_plain_text(transcript: str) -> List[Dict[str, Any]]:
    """
    Parses plain text transcripts.
    Expected line format: 'Speaker: text' or 'Speaker (timestamp): text' or bare text.
    Handles multi-line utterances by attributing subsequent lines without a speaker prefix
    to the previous speaker.
    """
    lines = transcript.strip().splitlines()
    parsed_lines = []
    line_no = 1
    current_speaker = "Unknown"
    current_timestamp = None

    # Pattern for "Speaker: Message" or "[10:00] Speaker: Message" or "Speaker [10:00]: Message"
    speaker_pattern = re.compile(
        r"^(?:\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*)?([^:\n]+?)(?:\s*\[(\d{1,2}:\d{2}(?::\d{2})?)\])?:\s*(.*)$"
    )

    for raw_line in lines:
        stripped = raw_line.strip()
        if not stripped:
            continue

        match = speaker_pattern.match(stripped)
        if match:
            t1, speaker_cand, t2, content = match.groups()
            timestamp = t1 or t2 or current_timestamp
            speaker = speaker_cand.strip() if speaker_cand else "Unknown"
            # Avoid matching random URLs or colons in sentences
            if len(speaker) > 40:
                # Unlikely to be a speaker name; treat as continuation
                content = stripped
                speaker = current_speaker
                timestamp = current_timestamp
            else:
                current_speaker = speaker
                current_timestamp = timestamp

            parsed_lines.append({
                "line_no": line_no,
                "speaker": current_speaker,
                "timestamp": current_timestamp,
                "text": content.strip()
            })
        else:
            # Continuation line or bare utterance without explicit speaker
            parsed_lines.append({
                "line_no": line_no,
                "speaker": current_speaker,
                "timestamp": current_timestamp,
                "text": stripped
            })
        line_no += 1

    return parsed_lines

def parse_vtt(vtt_content: str) -> List[Dict[str, Any]]:
    """
    Parses Zoom / Google Meet WebVTT transcripts.
    Extracts speaker attribution from <v Speaker> tags and timestamps.
    Falls back to line-by-line parsing if webvtt parsing fails.
    """
    parsed_lines = []
    line_no = 1
    speaker_regex = re.compile(r"<v\s+([^>]+)>(.*?)(?:</v>|$)", re.DOTALL)
    plain_speaker_regex = re.compile(r"^([^:]+):\s*(.*)$")

    try:
        import webvtt
        buffer = io.StringIO(vtt_content)
        vtt = webvtt.from_buffer(buffer)

        for caption in vtt:
            # Use raw_text to preserve <v Speaker> tags
            raw_text = getattr(caption, "raw_text", caption.text).strip()
            for line in raw_text.splitlines():
                line = line.strip()
                if not line:
                    continue

                speaker = "Unknown"
                text = line

                # Check <v Speaker> tag standard in VTT
                v_match = speaker_regex.search(line)
                if v_match:
                    speaker = v_match.group(1).strip()
                    text = v_match.group(2).strip()
                else:
                    # Check "Speaker: utterance"
                    p_match = plain_speaker_regex.match(line)
                    if p_match and len(p_match.group(1)) <= 40:
                        speaker = p_match.group(1).strip()
                        text = p_match.group(2).strip()

                parsed_lines.append({
                    "line_no": line_no,
                    "speaker": speaker,
                    "timestamp": caption.start,
                    "text": text
                })
                line_no += 1

        if parsed_lines:
            return parsed_lines
    except Exception:
        pass

    # Regex-based fallback for VTT with <v Speaker> tags
    for line in vtt_content.splitlines():
        line = line.strip()
        if not line or line.startswith("WEBVTT") or "-->" in line or line.isdigit():
            continue
        v_match = speaker_regex.search(line)
        if v_match:
            parsed_lines.append({
                "line_no": line_no,
                "speaker": v_match.group(1).strip(),
                "timestamp": None,
                "text": v_match.group(2).strip()
            })
            line_no += 1
        else:
            p_match = plain_speaker_regex.match(line)
            if p_match and len(p_match.group(1)) <= 40:
                parsed_lines.append({
                    "line_no": line_no,
                    "speaker": p_match.group(1).strip(),
                    "timestamp": None,
                    "text": p_match.group(2).strip()
                })
                line_no += 1

    if parsed_lines:
        return parsed_lines

    return parse_plain_text(vtt_content)

def parse_transcript(transcript: str, format: str = "txt") -> List[Dict[str, Any]]:
    """
    Main entry point to parse a transcript into speaker-attributed lines.
    """
    if format.lower() == "vtt" or "WEBVTT" in transcript[:50]:
        return parse_vtt(transcript)
    return parse_plain_text(transcript)
