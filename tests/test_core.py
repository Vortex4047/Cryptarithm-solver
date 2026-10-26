"""Comprehensive unit tests for the core cryptarithm modules."""

import unittest

from core.benchmark import compare_strategies
from core.generator import generate_puzzle, get_catalogue
from core.progress import clear_progress, get_analytics, load_progress, record_attempt, suggested_difficulty
from core.puzzle import check_solution, evaluate_columns, parse_puzzle, word_value
from core.solver import get_hint, solution_steps, solve


class TestPuzzle(unittest.TestCase):
    def test_parse_valid(self):
        p = parse_puzzle("SEND + MORE = MONEY")
        self.assertEqual(p.addends, ("SEND", "MORE"))
        self.assertEqual(p.result, "MONEY")
        self.assertIn("S", p.leading)
        self.assertIn("M", p.leading)
        self.assertEqual(len(p.letters), 8)

    def test_multi_addends(self):
        p = parse_puzzle("FORTY + TEN + TEN = SIXTY")
        self.assertEqual(len(p.addends), 3)
        self.assertEqual(p.result, "SIXTY")

    def test_reject_more_than_10_letters(self):
        with self.assertRaises(ValueError):
            parse_puzzle("ABCDEFGHIJK + A = B")

    def test_reject_invalid_result_length(self):
        with self.assertRaises(ValueError):
            parse_puzzle("CAT + DOG = ANIMAL")

    def test_reject_no_shared_letters(self):
        with self.assertRaises(ValueError):
            parse_puzzle("ABC + DEF = GHIJ")

    def test_reject_non_letters(self):
        with self.assertRaises(ValueError):
            parse_puzzle("123 + 456 = 789")

    def test_check_solution_valid(self):
        p = parse_puzzle("SEND + MORE = MONEY")
        valid_map = {"S": 9, "E": 5, "N": 6, "D": 7, "M": 1, "O": 0, "R": 8, "Y": 2}
        self.assertTrue(check_solution(p, valid_map))

    def test_check_solution_invalid(self):
        p = parse_puzzle("SEND + MORE = MONEY")
        invalid_map = {"S": 9, "E": 5, "N": 6, "D": 7, "M": 0, "O": 1, "R": 8, "Y": 2}
        self.assertFalse(check_solution(p, invalid_map))


class TestSolver(unittest.TestCase):
    def test_solve_send_more_money(self):
        result = solve("SEND + MORE = MONEY", strategy="mrv_fc")
        self.assertTrue(result.solutions)
        sol = result.solutions[0]
        self.assertEqual(sol["S"], 9)
        self.assertEqual(sol["M"], 1)
        self.assertEqual(sol["O"], 0)
        self.assertTrue(len(result.deductive_proof) >= 4)
        self.assertTrue(len(result.replay_frames) >= 5)

    def test_solution_steps(self):
        p = parse_puzzle("SEND + MORE = MONEY")
        sol = {"S": 9, "E": 5, "N": 6, "D": 7, "M": 1, "O": 0, "R": 8, "Y": 2}
        steps = solution_steps(p, sol)
        self.assertEqual(len(steps), 5)
        self.assertIn("Units column", steps[0])

    def test_hint_engine(self):
        p = parse_puzzle("SEND + MORE = MONEY")
        sol = {"S": 9, "E": 5, "N": 6, "D": 7, "M": 1, "O": 0, "R": 8, "Y": 2}
        hint = get_hint(p, {}, sol)
        self.assertIsNotNone(hint)
        self.assertIn(hint["letter"], p.letters)


class TestGeneratorAndCatalogue(unittest.TestCase):
    def test_generate_easy(self):
        eq = generate_puzzle("Easy", seed=10)
        p = parse_puzzle(eq)
        self.assertTrue(p)

    def test_catalogue_contains_classics(self):
        catalogue = get_catalogue()
        self.assertTrue(len(catalogue) >= 5)
        titles = [c["title"] for c in catalogue]
        self.assertIn("SEND + MORE = MONEY", titles)


class TestProgressAndAnalytics(unittest.TestCase):
    def test_progress_lifecycle(self):
        clear_progress()
        self.assertEqual(len(load_progress()), 0)

        record_attempt("SEND + MORE = MONEY", True, letter_count=8, difficulty="Medium")
        record_attempt("TO + GO = OUT", True, letter_count=5, difficulty="Easy")
        record_attempt("CRACK + HACK = ERROR", False, letter_count=6, difficulty="Hard")

        analytics = get_analytics()
        self.assertEqual(analytics["total_attempts"], 3)
        self.assertEqual(analytics["solved_count"], 2)
        self.assertEqual(analytics["needs_practice_count"], 1)
        self.assertAlmostEqual(analytics["accuracy_pct"], 66.7, places=1)


class TestBenchmark(unittest.TestCase):
    def test_compare_strategies(self):
        res = compare_strategies("TO + GO = OUT")
        self.assertEqual(len(res["results"]), 3)
        self.assertIn("insight", res)


if __name__ == "__main__":
    unittest.main()
