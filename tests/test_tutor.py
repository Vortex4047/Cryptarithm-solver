"""Unit tests for the Interactive Deduction Tutor engine."""

import unittest

from core.tutor import evaluate_tutor_answer, generate_tutor_session


class TestTutor(unittest.TestCase):
    def test_send_more_money_session(self):
        session = generate_tutor_session("SEND + MORE = MONEY")
        self.assertEqual(session.equation, "SEND + MORE = MONEY")
        self.assertEqual(session.total_steps, 8)
        self.assertEqual(len(session.steps), 8)
        self.assertEqual(session.full_solution["M"], 1)
        self.assertEqual(session.full_solution["S"], 9)
        self.assertEqual(session.full_solution["O"], 0)

        # Check step 0 (M=1)
        step0 = session.steps[0]
        self.assertEqual(step0["target_letter"], "M")
        self.assertEqual(step0["target_digit"], 1)
        self.assertTrue(any(c["digit"] == 1 and c["is_correct"] for c in step0["choices"]))

        # Evaluate correct answer
        eval_res = evaluate_tutor_answer(session.steps, 0, 1)
        self.assertTrue(eval_res["is_correct"])
        self.assertIn("M = 1", eval_res["explanation"])

        # Evaluate incorrect answer
        eval_wrong = evaluate_tutor_answer(session.steps, 0, 0)
        self.assertFalse(eval_wrong["is_correct"])

    def test_generic_puzzle_session(self):
        session = generate_tutor_session("TO + GO = OUT")
        self.assertEqual(session.equation, "TO + GO = OUT")
        self.assertTrue(session.total_steps >= 4)
        self.assertIn("O", session.letters)
        self.assertIn("T", session.letters)

        # Check every step has valid options
        for step in session.steps:
            self.assertTrue(len(step["choices"]) >= 2)
            correct_choices = [c for c in step["choices"] if c["is_correct"]]
            self.assertEqual(len(correct_choices), 1)
            self.assertEqual(correct_choices[0]["digit"], step["target_digit"])

    def test_invalid_puzzle_rejected(self):
        with self.assertRaises(ValueError):
            generate_tutor_session("CAT + DOG = ANIMAL")


if __name__ == "__main__":
    unittest.main()
