import io
import pytest
from fastapi.testclient import TestClient

from main import app
from services.audio import transcribe_audio_file, _format_into_speakers

client = TestClient(app)

def test_audio_formatter():
    raw_speech = "We decided to launch on April 2. Arjun will lead the frontend deployment."
    formatted = _format_into_speakers(raw_speech)
    assert "Speaker 1:" in formatted
    assert "launch on April 2" in formatted

def test_audio_upload_endpoint():
    # Synthetic mock audio bytes
    fake_audio = io.BytesIO(b"RIFF....WAVEfmt ....data....fake audio bytes")
    files = {"file": ("demo_kickoff.mp3", fake_audio, "audio/mpeg")}
    data = {"title": "Audio Kickoff Meeting", "date": "2026-10-03"}

    res = client.post("/meetings/audio", files=files, data=data)
    assert res.status_code == 200
    res_data = res.json()
    assert res_data["meeting_id"] is not None
    assert len(res_data["decisions"]) >= 1
    assert "April 2" in res_data["decisions"][0]["text"]
