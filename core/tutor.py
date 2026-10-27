"""Interactive 'Solve With Me' Deduction Tutor Engine for Cryptarithm Lab.
Generates guided pedagogical deduction steps, targeted multiple-choice prompts,
algebraic column constraints, domain elimination proofs, and instant feedback.
"""

from dataclasses import asdict, dataclass
import random
from typing import Any, Dict, List, Optional, Set, Tuple

from core.puzzle import Puzzle, check_solution, parse_puzzle, word_value
from core.solver import solution_steps, solve


@dataclass
class TutorChoice:
    digit: int
    text: str
    is_correct: bool
    explanation: str


@dataclass
class TutorStep:
    step_index: int
    total_steps: int
    stage_name: str
    target_letter: str
    target_digit: int
    column_index: Optional[int]
    column_name: str
    equation_context: str
    prompt_question: str
    choices: List[Dict[str, Any]]
    hint_text: str
    mathematical_rule: str
    cumulative_assignments: Dict[str, int]
    revealed_carries: Dict[str, int]


@dataclass
class TutorSession:
    equation: str
    letters: List[str]
    total_steps: int
    steps: List[Dict[str, Any]]
    full_solution: Dict[str, int]
    preset_title: Optional[str] = None


def _build_send_more_money_steps(puzzle: Puzzle, solution: Dict[str, int]) -> List[TutorStep]:
    """Carefully curated classical deduction steps for SEND + MORE = MONEY."""
    steps: List[TutorStep] = []
    total = 8

    # Step 1: Letter M
    steps.append(
        TutorStep(
            step_index=0,
            total_steps=total,
            stage_name="Leading Column Carry Theorem",
            target_letter="M",
            target_digit=1,
            column_index=4,
            column_name="Ten-Thousands Column (10⁴)",
            equation_context="C₄ = M",
            prompt_question=(
                "Look at the 5th column letter 'M' in the sum MONEY. The addends SEND and MORE each have "
                "4 digits. In base-10 addition, the maximum sum of two 4-digit numbers is 9,999 + 9,999 = 19,998. "
                "Since M is the leading digit of MONEY, what digit must 'M' be?"
            ),
            choices=[
                {
                    "digit": 1,
                    "text": "1",
                    "is_correct": True,
                    "explanation": (
                        "Spot on! Two 4-digit numbers sum to at most 19,998, so the carry C₄ can only be 1. "
                        "Because 'M' is a leading letter, M ≠ 0, forcing M = 1."
                    ),
                },
                {
                    "digit": 0,
                    "text": "0",
                    "is_correct": False,
                    "explanation": "Incorrect: In cryptarithms, leading letters can never be 0 (M is the first letter of MONEY).",
                },
                {
                    "digit": 2,
                    "text": "2",
                    "is_correct": False,
                    "explanation": (
                        "Incorrect: Even with the maximum possible carry C₃=1 and maximum digits 9+9, the column sum "
                        "is 9+9+1=19. The carry into the next column can never be 2 in a 2-addend sum."
                    ),
                },
                {
                    "digit": 9,
                    "text": "9",
                    "is_correct": False,
                    "explanation": "Incorrect: A single carry digit out of two addends cannot exceed 1.",
                },
            ],
            hint_text="Consider 9999 + 9999 = 19998. The highest digit is always 1.",
            mathematical_rule="Sum Carry Bound: In addition of N numbers, the maximum carry is at most N - 1.",
            cumulative_assignments={"M": 1},
            revealed_carries={"4": 1},
        )
    )

    # Step 2: Letter O
    steps.append(
        TutorStep(
            step_index=1,
            total_steps=total,
            stage_name="Thousands Column Interlocking Constraint",
            target_letter="O",
            target_digit=0,
            column_index=3,
            column_name="Thousands Column (10³)",
            equation_context="S + M(1) + C₃ = 10·C₄(1) + O  ⟹  S + 1 + C₃ = 10 + O",
            prompt_question=(
                "Now inspect the Thousands column: S + M + C₃ = 10·C₄ + O. We already know M = 1 and C₄ = 1, "
                "giving S + 1 + C₃ = 10 + O, or S + C₃ = 9 + O. Since S ≤ 9, C₃ ∈ {0, 1}, and letters must "
                "have unique values (M=1, so O ≠ 1), what must 'O' equal?"
            ),
            choices=[
                {
                    "digit": 0,
                    "text": "0",
                    "is_correct": True,
                    "explanation": (
                        "Exact deduction! If S = 9 and C₃ = 0, then 9 + 0 = 9 + O ⟹ O = 0. "
                        "If O were 1, it would conflict with M = 1 (distinctness rule). Hence O must be 0."
                    ),
                },
                {
                    "digit": 1,
                    "text": "1",
                    "is_correct": False,
                    "explanation": "Incorrect: Distinctness violation! M is already 1, so O cannot also be 1.",
                },
                {
                    "digit": 8,
                    "text": "8",
                    "is_correct": False,
                    "explanation": "Incorrect: If O = 8, then S + C₃ = 17, which is impossible since S ≤ 9 and C₃ ≤ 1 (maximum sum is 10).",
                },
                {
                    "digit": 9,
                    "text": "9",
                    "is_correct": False,
                    "explanation": "Incorrect: If O = 9, then S + C₃ = 18, requiring S = 17 or similar impossibility.",
                },
            ],
            hint_text="Because M=1, O cannot be 1. S can be at most 9, so S + C₃ can be at most 10.",
            mathematical_rule="Unique Digit Injective Mapping: Every letter must map to a distinct digit.",
            cumulative_assignments={"M": 1, "O": 0},
            revealed_carries={"4": 1},
        )
    )

    # Step 3: Letter S
    steps.append(
        TutorStep(
            step_index=2,
            total_steps=total,
            stage_name="Thousands Column Leading Variable Bound",
            target_letter="S",
            target_digit=9,
            column_index=3,
            column_name="Thousands Column (10³)",
            equation_context="S + 1 + C₃ = 10 + O(0)  ⟹  S + C₃ = 9",
            prompt_question=(
                "From S + C₃ = 9 + O(0) ⟹ S + C₃ = 9. S is the leading letter of SEND, so S ≠ 0. "
                "Furthermore, if S = 8, then C₃ must be 1 (so E + O + C₂ would need to generate a carry of 1 without O being nonzero). "
                "Evaluating the hundreds column shows C₃ = 0. What must 'S' be?"
            ),
            choices=[
                {
                    "digit": 9,
                    "text": "9",
                    "is_correct": True,
                    "explanation": (
                        "Correct! Since C₃ = 0 (carry into thousands column is 0), S + 0 = 9 ⟹ S = 9. "
                        "This also leaves 8 available for R later!"
                    ),
                },
                {
                    "digit": 8,
                    "text": "8",
                    "is_correct": False,
                    "explanation": (
                        "Incorrect: If S = 8, then C₃ must be 1. But in the hundreds column E + 0 + C₂ = N + 10·C₃, "
                        "for C₃=1 we would need E + C₂ ≥ 10, which requires E = 9 (already taken by S!) or C₂ > 1."
                    ),
                },
                {
                    "digit": 7,
                    "text": "7",
                    "is_correct": False,
                    "explanation": "Incorrect: S + C₃ = 9. Even with maximum carry C₃=1, S would need to be 8, not 7.",
                },
                {
                    "digit": 1,
                    "text": "1",
                    "is_correct": False,
                    "explanation": "Incorrect: 1 is already assigned to M.",
                },
            ],
            hint_text="S + C₃ = 9. Since C₃ = 0, S must equal 9.",
            mathematical_rule="Leading Digit Extremal Value Analysis.",
            cumulative_assignments={"M": 1, "O": 0, "S": 9},
            revealed_carries={"4": 1},
        )
    )

    # Step 4: Letter E
    steps.append(
        TutorStep(
            step_index=3,
            total_steps=total,
            stage_name="Hundreds & Tens Interlocking Carry",
            target_letter="E",
            target_digit=5,
            column_index=2,
            column_name="Hundreds Column (10²)",
            equation_context="E + O(0) + C₂ = N + 10·C₃(0)  ⟹  E + C₂ = N",
            prompt_question=(
                "In the Hundreds column: E + 0 + C₂ = N. Since E and N are distinct letters, C₂ cannot be 0, "
                "so C₂ = 1, proving N = E + 1. Moving to the Tens column: N + R + C₁ = E + 10·C₂. "
                "Substituting N = E + 1 gives (E + 1) + R + C₁ = E + 10, so R + C₁ = 9. "
                "Since S = 9 is already taken, R must be 8 and C₁ = 1! "
                "In the Units column: D + E = Y + 10. For D and Y to be distinct unused digits from {2, 3, 4, 7}, "
                "what must 'E' be?"
            ),
            choices=[
                {
                    "digit": 5,
                    "text": "5",
                    "is_correct": True,
                    "explanation": (
                        "Brilliant deduction! With E = 5, we get N = E + 1 = 6. "
                        "Then D + 5 = Y + 10 with D = 7 yields Y = 2 (all distinct and within available digits)!"
                    ),
                },
                {
                    "digit": 4,
                    "text": "4",
                    "is_correct": False,
                    "explanation": (
                        "Incorrect: If E = 4, then N = 5. In units D + 4 = Y + 10 requires D = 7 or 8. "
                        "If D = 7, Y = 1 (already used by M). If D = 8, 8 is needed for R. Contradiction!"
                    ),
                },
                {
                    "digit": 6,
                    "text": "6",
                    "is_correct": False,
                    "explanation": "Incorrect: If E = 6, N = 7. Then D + 6 = Y + 10 requires D = 5, Y = 1 (conflicts with M=1).",
                },
                {
                    "digit": 0,
                    "text": "0",
                    "is_correct": False,
                    "explanation": "Incorrect: 0 is already assigned to O.",
                },
            ],
            hint_text="Test E = 5: N becomes 6, leaving {2, 3, 4, 7, 8} for D, R, Y.",
            mathematical_rule="System of Interlocking Column Linear Equations.",
            cumulative_assignments={"M": 1, "O": 0, "S": 9, "E": 5},
            revealed_carries={"4": 1, "2": 1},
        )
    )

    # Step 5: Letter N
    steps.append(
        TutorStep(
            step_index=4,
            total_steps=total,
            stage_name="Direct Consecutive Variable Binding",
            target_letter="N",
            target_digit=6,
            column_index=2,
            column_name="Hundreds Column (10²)",
            equation_context="N = E(5) + C₂(1)",
            prompt_question=(
                "From our hundreds column deduction, we proved N = E + C₂ with C₂ = 1. "
                "Having verified E = 5, what is the value of 'N'?"
            ),
            choices=[
                {
                    "digit": 6,
                    "text": "6",
                    "is_correct": True,
                    "explanation": "Exact! N = 5 + 1 = 6. All constraints in the hundreds column are completely satisfied.",
                },
                {
                    "digit": 5,
                    "text": "5",
                    "is_correct": False,
                    "explanation": "Incorrect: N cannot equal 5 because E is already 5 (letters must represent distinct digits).",
                },
                {
                    "digit": 7,
                    "text": "7",
                    "is_correct": False,
                    "explanation": "Incorrect: N = E + 1 = 5 + 1 = 6, not 7.",
                },
                {
                    "digit": 8,
                    "text": "8",
                    "is_correct": False,
                    "explanation": "Incorrect: N = E + 1 = 6.",
                },
            ],
            hint_text="Simple addition: 5 + 1 = 6.",
            mathematical_rule="Substitution Property of Equality.",
            cumulative_assignments={"M": 1, "O": 0, "S": 9, "E": 5, "N": 6},
            revealed_carries={"4": 1, "2": 1},
        )
    )

    # Step 6: Letter R
    steps.append(
        TutorStep(
            step_index=5,
            total_steps=total,
            stage_name="Tens Column Carry Evaluation",
            target_letter="R",
            target_digit=8,
            column_index=1,
            column_name="Tens Column (10¹)",
            equation_context="N(6) + R + C₁ = E(5) + 10·C₂(1)  ⟹  6 + R + C₁ = 15",
            prompt_question=(
                "In the Tens column: 6 + R + C₁ = 15, so R + C₁ = 9. S is already assigned to 9, "
                "so R cannot equal 9 (which would happen if C₁ = 0). Therefore C₁ must be 1. "
                "What digit must 'R' equal?"
            ),
            choices=[
                {
                    "digit": 8,
                    "text": "8",
                    "is_correct": True,
                    "explanation": "Perfect! R + 1 = 9 ⟹ R = 8. Carry C₁=1 propagates from the units column.",
                },
                {
                    "digit": 9,
                    "text": "9",
                    "is_correct": False,
                    "explanation": "Incorrect: 9 is already assigned to S! Duplicate assignments are strictly forbidden.",
                },
                {
                    "digit": 7,
                    "text": "7",
                    "is_correct": False,
                    "explanation": "Incorrect: If R = 7, then 7 + C₁ = 9 requires C₁ = 2, but addition of two digits can only carry at most 1.",
                },
                {
                    "digit": 6,
                    "text": "6",
                    "is_correct": False,
                    "explanation": "Incorrect: 6 is already assigned to N.",
                },
            ],
            hint_text="R + 1 = 9. Solve for R.",
            mathematical_rule="Domain Exclusion via Injective Constraint.",
            cumulative_assignments={"M": 1, "O": 0, "S": 9, "E": 5, "N": 6, "R": 8},
            revealed_carries={"4": 1, "2": 1, "1": 1},
        )
    )

    # Step 7: Letter D
    steps.append(
        TutorStep(
            step_index=6,
            total_steps=total,
            stage_name="Units Column Addition",
            target_letter="D",
            target_digit=7,
            column_index=0,
            column_name="Units Column (10⁰)",
            equation_context="D + E(5) = Y + 10·C₁(1)  ⟹  D + 5 = Y + 10",
            prompt_question=(
                "In the Units column: D + 5 = Y + 10. The only digits still available from {0..9} are {2, 3, 4, 7}. "
                "To produce a carry of 1 (sum ≥ 10), D + 5 must be at least 10, meaning D ≥ 5. "
                "The only remaining digit greater than 5 is 7. What is 'D'?"
            ),
            choices=[
                {
                    "digit": 7,
                    "text": "7",
                    "is_correct": True,
                    "explanation": "Spot on! 7 + 5 = 12, which gives carry C₁ = 1 and leaves Y = 2.",
                },
                {
                    "digit": 4,
                    "text": "4",
                    "is_correct": False,
                    "explanation": "Incorrect: If D = 4, then 4 + 5 = 9, which cannot produce the required carry C₁ = 1.",
                },
                {
                    "digit": 3,
                    "text": "3",
                    "is_correct": False,
                    "explanation": "Incorrect: 3 + 5 = 8, no carry produced.",
                },
                {
                    "digit": 2,
                    "text": "2",
                    "is_correct": False,
                    "explanation": "Incorrect: 2 + 5 = 7, no carry produced.",
                },
            ],
            hint_text="D must be at least 5 to make D + 5 ≥ 10. Check which digit ≥ 5 is not yet used.",
            mathematical_rule="Carry Generation Inequality: D + E ≥ 10.",
            cumulative_assignments={"M": 1, "O": 0, "S": 9, "E": 5, "N": 6, "R": 8, "D": 7},
            revealed_carries={"4": 1, "2": 1, "1": 1},
        )
    )

    # Step 8: Letter Y
    steps.append(
        TutorStep(
            step_index=7,
            total_steps=total,
            stage_name="Final Variable Closure",
            target_letter="Y",
            target_digit=2,
            column_index=0,
            column_name="Units Column (10⁰)",
            equation_context="D(7) + E(5) = 12 = 10·C₁(1) + Y",
            prompt_question=(
                "With D = 7 and E = 5, the units column sum is 7 + 5 = 12. "
                "12 mod 10 leaves what digit for 'Y'?"
            ),
            choices=[
                {
                    "digit": 2,
                    "text": "2",
                    "is_correct": True,
                    "explanation": "Magnificent! Y = 2 completes the entire cryptarithm: 9567 + 1085 = 10652!",
                },
                {
                    "digit": 3,
                    "text": "3",
                    "is_correct": False,
                    "explanation": "Incorrect: 7 + 5 = 12, so the units digit is 2, not 3.",
                },
                {
                    "digit": 4,
                    "text": "4",
                    "is_correct": False,
                    "explanation": "Incorrect: 7 + 5 = 12, so the units digit is 2.",
                },
                {
                    "digit": 1,
                    "text": "1",
                    "is_correct": False,
                    "explanation": "Incorrect: 1 is the carry digit, not the units sum digit.",
                },
            ],
            hint_text="12 mod 10 = 2.",
            mathematical_rule="Modular Arithmetic Closure.",
            cumulative_assignments={"M": 1, "O": 0, "S": 9, "E": 5, "N": 6, "R": 8, "D": 7, "Y": 2},
            revealed_carries={"4": 1, "2": 1, "1": 1},
        )
    )

    return steps


def _generate_generic_steps(puzzle: Puzzle, solution: Dict[str, int]) -> List[TutorStep]:
    """Dynamically generate rich pedagogical deduction steps for ANY cryptarithm."""
    steps: List[TutorStep] = []
    letters_order: List[str] = []

    # Priority 1: Leading carry letter of result if result is longer than longest addend
    max_addend_len = max(len(w) for w in puzzle.addends)
    if len(puzzle.result) > max_addend_len:
        leading_res = puzzle.result[0]
        if leading_res not in letters_order:
            letters_order.append(leading_res)

    # Priority 2: Leading letters of addends
    for w in puzzle.addends:
        if w[0] not in letters_order:
            letters_order.append(w[0])

    # Priority 3: Units column letters
    for w in (*puzzle.addends, puzzle.result):
        if w[-1] not in letters_order:
            letters_order.append(w[-1])

    # Priority 4: Remaining letters in order
    for ch in puzzle.letters:
        if ch not in letters_order:
            letters_order.append(ch)

    total_steps = len(letters_order)
    current_map: Dict[str, int] = {}
    col_names = ["Units", "Tens", "Hundreds", "Thousands", "Ten-Thousands", "Hundred-Thousands"]

    for idx, ch in enumerate(letters_order):
        target_val = solution[ch]
        current_map[ch] = target_val

        # Find column where ch appears most prominently
        col_idx = None
        for c in range(len(puzzle.result)):
            chars_in_c = [w[-1 - c] for w in puzzle.addends if c < len(w)]
            if c < len(puzzle.result):
                chars_in_c.append(puzzle.result[-1 - c])
            if ch in chars_in_c:
                col_idx = c
                break

        col_name = col_names[col_idx] if col_idx is not None and col_idx < len(col_names) else f"Column {col_idx + 1}" if col_idx is not None else "General Constraint"

        # Determine stage and rule
        is_leading = ch in puzzle.leading
        is_highest_carry = (idx == 0 and len(puzzle.result) > max_addend_len and ch == puzzle.result[0])

        if is_highest_carry:
            stage_name = "High-Order Carry Bound"
            rule = "Sum Carry Bound Theorem: C_k ≤ Number of Addends - 1."
            prompt = (
                f"Look at the leading letter '{ch}' in the result '{puzzle.result}'. The result has {len(puzzle.result)} letters, "
                f"which is longer than any addend (maximum {max_addend_len} digits). "
                f"In base-10 addition of {len(puzzle.addends)} numbers, what digit must '{ch}' be?"
            )
            correct_exp = (
                f"Correct! Adding {len(puzzle.addends)} numbers can at most produce a carry of {len(puzzle.addends) - 1}. "
                f"Because '{ch}' is a leading letter, it cannot be 0, forcing '{ch}' = {target_val}."
            )
        elif is_leading:
            stage_name = f"Leading Letter Domain Restriction ('{ch}')"
            rule = "Non-Zero Leading Letter Constraint: Leading digits must be in {1..9}."
            prompt = (
                f"Letter '{ch}' is a leading digit in '{[w for w in puzzle.words if w.startswith(ch)][0]}'. "
                f"Considering column constraints and distinctness with previously assigned letters, what value must '{ch}' take?"
            )
            correct_exp = f"Correct! '{ch}' = {target_val} satisfies the non-zero leading condition and all column carry relations."
        else:
            stage_name = f"Column Deduction for Variable '{ch}'"
            rule = "Column Addition Modulo & Carry Propagation."
            prompt = (
                f"Analyze the {col_name} column involving variable '{ch}'. "
                f"Given the digits bound so far, which digit uniquely satisfies the column arithmetic?"
            )
            correct_exp = f"Correct! Binding '{ch}' = {target_val} maintains complete arithmetic consistency across all intersecting columns."

        # Distractor choices
        used_so_far = set(current_map.values()) - {target_val}
        remaining_pool = [d for d in range(10) if d not in used_so_far and d != target_val]
        random.seed(idx * 42 + ord(ch))
        distractors = random.sample(remaining_pool, min(3, len(remaining_pool)))

        choices_list = [
            TutorChoice(
                digit=target_val,
                text=str(target_val),
                is_correct=True,
                explanation=correct_exp,
            )
        ]

        for d in distractors:
            reason = f"Incorrect: Assigning '{ch}' = {d} causes an arithmetic carry contradiction in the {col_name} column."
            if d == 0 and is_leading:
                reason = f"Incorrect: '{ch}' is a leading letter and cannot be zero."
            choices_list.append(
                TutorChoice(
                    digit=d,
                    text=str(d),
                    is_correct=False,
                    explanation=reason,
                )
            )

        # Shuffle choices predictably
        random.seed(idx * 99 + 7)
        random.shuffle(choices_list)

        steps.append(
            TutorStep(
                step_index=idx,
                total_steps=total_steps,
                stage_name=stage_name,
                target_letter=ch,
                target_digit=target_val,
                column_index=col_idx,
                column_name=col_name,
                equation_context=f"Variable '{ch}' in {col_name}",
                prompt_question=prompt,
                choices=[asdict(c) for c in choices_list],
                hint_text=f"Check the arithmetic in the {col_name} column; verify that {ch} does not duplicate any assigned digit.",
                mathematical_rule=rule,
                cumulative_assignments=dict(current_map),
                revealed_carries={},
            )
        )

    return steps


def generate_tutor_session(puzzle_or_eq: Puzzle | str) -> TutorSession:
    """Initialize a full guided deduction session for the specified equation."""
    puzzle = puzzle_or_eq if isinstance(puzzle_or_eq, Puzzle) else parse_puzzle(puzzle_or_eq)
    res = solve(puzzle, strategy="mrv_fc", max_solutions=1)
    if not res.solutions:
        raise ValueError(f"Cannot create tutor session: Puzzle '{puzzle.equation}' has no valid solution.")

    solution = res.solutions[0]

    # Use rich pedagogical steps if SEND + MORE = MONEY, else dynamic generic steps
    if puzzle.equation == "SEND + MORE = MONEY":
        steps = _build_send_more_money_steps(puzzle, solution)
        title = "SEND + MORE = MONEY (Dudeney 1924 Masterclass)"
    else:
        steps = _generate_generic_steps(puzzle, solution)
        title = f"{puzzle.equation} Guided Deduction"

    return TutorSession(
        equation=puzzle.equation,
        letters=list(puzzle.letters),
        total_steps=len(steps),
        steps=[asdict(s) for s in steps],
        full_solution=solution,
        preset_title=title,
    )


def evaluate_tutor_answer(session_steps: List[Dict[str, Any]], step_index: int, selected_digit: int) -> Dict[str, Any]:
    """Verify student choice for a particular tutor step and return explanatory feedback."""
    if step_index < 0 or step_index >= len(session_steps):
        return {"success": False, "error": "Invalid step index."}

    step = session_steps[step_index]
    target_digit = step["target_digit"]
    target_letter = step["target_letter"]
    is_correct = (selected_digit == target_digit)

    explanation = ""
    for choice in step["choices"]:
        if choice["digit"] == selected_digit:
            explanation = choice["explanation"]
            break

    if not explanation:
        explanation = f"Correct assignment: '{target_letter}' = {target_digit}." if is_correct else f"Incorrect: '{target_letter}' does not equal {selected_digit}."

    return {
        "success": True,
        "is_correct": is_correct,
        "target_letter": target_letter,
        "target_digit": target_digit,
        "selected_digit": selected_digit,
        "explanation": explanation,
        "mathematical_rule": step["mathematical_rule"],
        "cumulative_assignments": step["cumulative_assignments"] if is_correct else {},
    }
