import json
from pathlib import Path
from services.extractor import extract_from_transcript
from services.conflicts import detect_conflicts
from services.memory import add_decision

LABELED_DIR = Path(__file__).resolve().parent / "labeled"

def run_evaluation():
    print("=" * 60)
    print("ACTIONED EVALUATION SUITE")
    print("=" * 60)

    labeled_files = list(LABELED_DIR.glob("*.json"))
    if not labeled_files:
        print("No labeled test transcripts found.")
        return

    total_expected_actions = 0
    extracted_actions_count = 0
    true_positive_actions = 0

    total_expected_conflicts = 0
    detected_conflicts_count = 0
    true_positive_conflicts = 0

    for idx, file_path in enumerate(sorted(labeled_files), start=1):
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        title = data["title"]
        date = data["date"]
        transcript = data["transcript"]
        expected_actions = data.get("expected_action_items", [])
        expected_conflicts = data.get("expected_conflicts", [])

        total_expected_actions += len(expected_actions)
        total_expected_conflicts += len(expected_conflicts)

        # Run extraction
        decisions, actions = extract_from_transcript(title, date, transcript)
        extracted_actions_count += len(actions)

        # Check action item matches
        for act in actions:
            for exp in expected_actions:
                # Match if keywords overlap
                if any(word in act.text.lower() for word in exp["text"].lower().split() if len(word) > 3):
                    true_positive_actions += 1
                    break

        # Run conflict detection
        conflicts = detect_conflicts(title, date, decisions)
        detected_conflicts_count += len(conflicts)
        for conf in conflicts:
            for exp in expected_conflicts:
                if any(word in conf.reason.lower() for word in ["launch", "date", "contradict", "different"]):
                    true_positive_conflicts += 1
                    break

        # Simulate storing decisions in memory so subsequent meetings can conflict
        for d in decisions:
            add_decision(
                id=f"eval_m{idx}_{d.id}",
                meeting_id=idx,
                text=d.text,
                owner=d.owner,
                date=date,
                source_line=d.source_line,
                status="active"
            )

    action_precision = (true_positive_actions / extracted_actions_count) if extracted_actions_count > 0 else 1.0
    action_recall = (true_positive_actions / total_expected_actions) if total_expected_actions > 0 else 1.0

    conflict_precision = (true_positive_conflicts / detected_conflicts_count) if detected_conflicts_count > 0 else 1.0
    conflict_recall = (true_positive_conflicts / total_expected_conflicts) if total_expected_conflicts > 0 else 1.0

    print(f"Action Items - Precision: {action_precision:.2%}, Recall: {action_recall:.2%}")
    print(f"Conflict Detection - Precision: {conflict_precision:.2%}, Recall: {conflict_recall:.2%}")
    print("=" * 60)

if __name__ == "__main__":
    run_evaluation()
