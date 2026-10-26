"""Progress tracking, session history, and learning analytics."""

from datetime import datetime
import json
from pathlib import Path
from typing import Any, Dict, List, Optional


DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "progress.json"


def load_progress() -> List[Dict[str, Any]]:
    """Load recorded attempts from persistent storage."""
    if not DATA_FILE.exists():
        return []

    try:
        data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except (json.JSONDecodeError, OSError):
        return []


def record_attempt(
    equation: str,
    solved: bool,
    letter_count: int = 0,
    difficulty: str = "Unknown",
    *,
    source: str = "practice",
    reason: str = "",
    elapsed_seconds: float = 0.0,
) -> Dict[str, Any]:
    """Record a single practice or timed challenge attempt."""
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)

    history = load_progress()
    record = {
        "id": len(history) + 1,
        "time": datetime.now().isoformat(timespec="seconds"),
        "equation": equation,
        "solved": bool(solved),
        "letter_count": letter_count,
        "difficulty": difficulty,
        "source": source,
        "reason": reason,
        "elapsed_seconds": round(elapsed_seconds, 1),
    }
    history.append(record)

    try:
        DATA_FILE.write_text(json.dumps(history, indent=2), encoding="utf-8")
    except OSError:
        pass

    return record


def clear_progress() -> None:
    """Clear all saved progress."""
    if DATA_FILE.exists():
        DATA_FILE.write_text("[]", encoding="utf-8")


def suggested_difficulty() -> str:
    """Adaptive difficulty recommendation based on recent performance."""
    history = load_progress()
    recent = history[-5:]

    if len(recent) < 3:
        return "Easy"

    success_rate = sum(bool(a.get("solved", False)) for a in recent) / len(recent)

    if success_rate >= 0.8:
        return "Hard"
    if success_rate >= 0.5:
        return "Medium"
    return "Easy"


def get_analytics() -> Dict[str, Any]:
    """Compute rich aggregate analytics for the dashboard."""
    history = load_progress()
    total = len(history)
    solved = sum(1 for a in history if a.get("solved"))
    needs_practice = total - solved
    accuracy = (solved / total * 100) if total > 0 else 0.0

    # Calculate streaks
    curr_streak = 0
    best_streak = 0
    temp_streak = 0
    for a in history:
        if a.get("solved"):
            temp_streak += 1
            if temp_streak > best_streak:
                best_streak = temp_streak
        else:
            temp_streak = 0
    # Current streak from the end
    for a in reversed(history):
        if a.get("solved"):
            curr_streak += 1
        else:
            break

    # Difficulty breakdown
    by_diff = {"Easy": {"total": 0, "solved": 0}, "Medium": {"total": 0, "solved": 0}, "Hard": {"total": 0, "solved": 0}}
    for a in history:
        d = a.get("difficulty", "Easy")
        if d in by_diff:
            by_diff[d]["total"] += 1
            if a.get("solved"):
                by_diff[d]["solved"] += 1

    # Rolling accuracy timeline (window of 5)
    timeline: List[Dict[str, Any]] = []
    for i in range(1, total + 1):
        window = history[max(0, i - 5):i]
        win_acc = sum(1 for x in window if x.get("solved")) / len(window) * 100
        timeline.append({
            "attempt": i,
            "accuracy": round(win_acc, 1),
            "equation": history[i - 1].get("equation", ""),
            "solved": history[i - 1].get("solved", False),
        })

    return {
        "total_attempts": total,
        "solved_count": solved,
        "needs_practice_count": needs_practice,
        "accuracy_pct": round(accuracy, 1),
        "current_streak": curr_streak,
        "best_streak": best_streak,
        "suggested_difficulty": suggested_difficulty(),
        "difficulty_breakdown": by_diff,
        "timeline": timeline,
        "recent_history": list(reversed(history[-15:])),
    }
