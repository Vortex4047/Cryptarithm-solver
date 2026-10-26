"""Unit tests for cryptarithm generator."""

import unittest

from core.generator import generate_puzzle
from core.puzzle import parse_puzzle


class TestGenerator(unittest.TestCase):
    def test_generate_easy_puzzle(self):
        eq = generate_puzzle("Easy", seed=42)
        p = parse_puzzle(eq)
        self.assertGreaterEqual(len(p.letters), 2)
        self.assertLessEqual(len(p.letters), 10)

    def test_generate_medium_puzzle(self):
        eq = generate_puzzle("Medium", seed=100)
        p = parse_puzzle(eq)
        self.assertTrue(p)

    def test_generate_hard_puzzle(self):
        eq = generate_puzzle("Hard", seed=200)
        p = parse_puzzle(eq)
        self.assertTrue(p)

    def test_invalid_difficulty(self):
        with self.assertRaises(ValueError):
            generate_puzzle("Impossible")


if __name__ == "__main__":
    unittest.main()