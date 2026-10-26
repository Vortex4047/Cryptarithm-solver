"""Core puzzle definitions, parsing, and arithmetic validation for Cryptarithm Lab."""

from dataclasses import dataclass
import re
from typing import Dict, List, Optional, Set, Tuple


@dataclass(frozen=True)
class Puzzle:
    equation: str
    addends: Tuple[str, ...]
    result: str
    letters: Tuple[str, ...]
    leading: frozenset[str]
    words: Tuple[str, ...]


@dataclass
class ColumnStep:
    col_index: int  # 0 is rightmost (units)
    addend_letters: List[str]
    result_letter: str
    carry_in: int
    column_sum: int
    digit_written: int
    carry_out: int
    is_valid: bool
    explanation: str


def words_share_letters(words: Tuple[str, ...]) -> bool:
    """Return whether any two words share at least one letter."""
    return any(
        set(first) & set(second)
        for index, first in enumerate(words)
        for second in words[index + 1:]
    )


def parse_puzzle(equation: str) -> Puzzle:
    """Parse and rigorously validate an addition cryptarithm equation."""
    cleaned = equation.strip()
    if cleaned.count("=") != 1:
        raise ValueError("The equation must contain exactly one '=' sign.")

    left, right = cleaned.split("=")
    addends_raw = [w.strip().upper() for w in left.split("+") if w.strip()]
    result = right.strip().upper()

    if len(addends_raw) < 2:
        raise ValueError("Provide at least two addends separated by '+'.")

    addends = tuple(addends_raw)
    words = (*addends, result)

    for word in words:
        if not re.fullmatch(r"[A-Z]+", word):
            raise ValueError(
                f"Invalid word '{word}': use letters A-Z only, separated by '+' and '='."
            )

    # Unique letters preserving first appearance order
    letters = tuple(dict.fromkeys("".join(words)))

    if len(letters) > 10:
        raise ValueError(
            f"A base-10 cryptarithm can use at most 10 distinct letters; "
            f"this puzzle has {len(letters)} ({', '.join(letters)})."
        )

    # Theoretical maximum sum of addends
    maximum_sum = sum(10 ** len(word) - 1 for word in addends)
    maximum_result_length = len(str(maximum_sum))
    if len(result) > maximum_result_length:
        longest = max(len(w) for w in addends)
        raise ValueError(
            f"Result '{result}' has {len(result)} letters, but addends can sum to "
            f"at most {maximum_result_length} digits. Longest addend has {longest} letters."
        )

    if len(result) < max(len(w) for w in addends):
        raise ValueError(
            f"Result '{result}' is shorter than the longest addend; sum cannot decrease."
        )

    if not words_share_letters(words):
        raise ValueError(
            "The words do not share any letters. Interlocking constraints are required."
        )

    leading = frozenset(w[0] for w in words if len(w) > 1)

    return Puzzle(
        equation=f"{' + '.join(addends)} = {result}",
        addends=addends,
        result=result,
        letters=letters,
        leading=leading,
        words=words,
    )


def word_value(word: str, assignment: Dict[str, int]) -> int:
    """Convert a word to its integer value given a letter-to-digit assignment."""
    return int("".join(str(assignment[ch]) for ch in word))


def check_solution(puzzle: Puzzle, assignment: Dict[str, int]) -> bool:
    """Validate whether an assignment satisfies all cryptarithm rules."""
    # Must assign all letters in puzzle
    if set(assignment) != set(puzzle.letters):
        return False

    digits = list(assignment.values())
    # All values must be digits 0-9
    if any(type(d) is not int or not (0 <= d <= 9) for d in digits):
        return False

    # Distinct letters must have distinct digits
    if len(set(digits)) != len(digits):
        return False

    # Leading letters cannot be zero
    if any(assignment[ch] == 0 for ch in puzzle.leading):
        return False

    # Arithmetic equation must hold
    addends_sum = sum(word_value(w, assignment) for w in puzzle.addends)
    result_val = word_value(puzzle.result, assignment)
    return addends_sum == result_val


def evaluate_columns(puzzle: Puzzle, assignment: Dict[str, int]) -> List[ColumnStep]:
    """Calculate column-by-column addition and carry steps for a complete or partial mapping."""
    max_len = max(max(len(w) for w in puzzle.addends), len(puzzle.result))
    steps: List[ColumnStep] = []
    carry = 0

    for col in range(max_len):
        col_addends = []
        col_letters = []
        is_complete = True

        for word in puzzle.addends:
            if col < len(word):
                ch = word[-1 - col]
                col_letters.append(ch)
                if ch in assignment:
                    col_addends.append(assignment[ch])
                else:
                    is_complete = False
            else:
                col_letters.append(" ")
                col_addends.append(0)

        res_char = puzzle.result[-1 - col] if col < len(puzzle.result) else " "
        res_digit = assignment.get(res_char, None)

        if is_complete and res_digit is not None:
            col_total = sum(col_addends) + carry
            expected_digit = col_total % 10
            next_carry = col_total // 10
            is_valid = (expected_digit == res_digit)
            explanation = (
                f"Column {col + 1} (units x10^{col}): sum {col_total} "
                f"(sum={sum(col_addends)} + carry_in={carry}). "
                f"Result digit is {res_digit}, carry out is {next_carry}."
            )
            steps.append(ColumnStep(
                col_index=col,
                addend_letters=col_letters,
                result_letter=res_char,
                carry_in=carry,
                column_sum=col_total,
                digit_written=expected_digit,
                carry_out=next_carry,
                is_valid=is_valid,
                explanation=explanation,
            ))
            carry = next_carry
        else:
            steps.append(ColumnStep(
                col_index=col,
                addend_letters=col_letters,
                result_letter=res_char,
                carry_in=carry,
                column_sum=sum(col_addends) + carry,
                digit_written=-1,
                carry_out=0,
                is_valid=False,
                explanation=f"Column {col + 1}: unassigned letter(s).",
            ))

    return steps
