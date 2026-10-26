"""Unit tests for progress tracking and analytics."""

import unittest

from core.progress import (
    clear_progress,
    get_analytics,
    load_progress,
    record_attempt,
    suggested_difficulty,
)


class TestProgress(unittest.TestCase):
    def setUp(self):
        clear_progress()

    def test_record_and_load(self):
        record_attempt("TO + GO = OUT", True, letter_count=5, difficulty="Easy")
        history = load_progress()
        self.assertEqual(len(history), 1)
        self.assertTrue(history[0]["solved"])

    def test_suggested_difficulty_easy_default(self):
        self.assertEqual(suggested_difficulty(), "Easy")

    def test_suggested_difficulty_progression(self):
        for _ in range(5):
            record_attempt("TO + GO = OUT", True, letter_count=5, difficulty="Easy")
        self.assertEqual(suggested_difficulty(), "Hard")

    def test_analytics_metrics(self):
        record_attempt("TO + GO = OUT", True, letter_count=5, difficulty="Easy")
        record_attempt("HE + ME = WE", False, letter_count=4, difficulty="Easy")
        analytics = get_analytics()
        self.assertEqual(analytics["total_attempts"], 2)
        self.assertEqual(analytics["solved_count"], 1)
        self.assertEqual(analytics["accuracy_pct"], 50.0)


if __name__ == "__main__":
    unittest.main()
