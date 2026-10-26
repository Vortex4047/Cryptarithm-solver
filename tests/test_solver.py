"""Unit tests for puzzle solver and constraints validation."""

import unittest

from core.puzzle import check_solution, parse_puzzle
from core.solver import solution_steps, solve


class TestSolver(unittest.TestCase):
    def test_send_more_money(self):
        result = solve("SEND + MORE = MONEY")
        self.assertTrue(result.solutions)

        mapping = result.solutions[0]
        send = int("".join(str(mapping[ch]) for ch in "SEND"))
        more = int("".join(str(mapping[ch]) for ch in "MORE"))
        money = int("".join(str(mapping[ch]) for ch in "MONEY"))

        self.assertEqual(send + more, money)
        self.assertEqual(len(set(mapping.values())), len(mapping))
        self.assertTrue(check_solution(result.puzzle, mapping))
        self.assertEqual(len(solution_steps(result.puzzle, mapping)), len("MONEY"))

    def test_rejects_puzzles_that_break_generation_rules(self):
        cases = [
            ("ABCDEFGHIJK + A = B", "at most 10 distinct letters"),
            ("CAT + DOG = ANIMAL", "at most 4 digits"),
            ("ABC + DEF = GHIJ", "do not share any letters"),
        ]
        for eq, reason in cases:
            with self.subTest(equation=eq):
                with self.assertRaises(ValueError):
                    parse_puzzle(eq)

    def test_check_solution_rejects_invalid_digit_assignments(self):
        puzzle = parse_puzzle("SEND + MORE = MONEY")
        self.assertFalse(check_solution(puzzle, {"S": 9}))


if __name__ == "__main__":
    unittest.main()