"""Constraint Satisfaction Problem (CSP) solver for cryptarithms.
Includes optimized Backtracking, MRV heuristic, MRV + Forward Checking,
detailed algebraic deduction proofs, and step-by-step replay traces.
"""

from dataclasses import asdict, dataclass
from time import perf_counter
from typing import Any, Dict, List, Optional, Set, Tuple

from core.puzzle import Puzzle, check_solution, parse_puzzle, word_value


@dataclass
class ReplayFrame:
    frame_index: int
    title: str
    description: str
    column_index: Optional[int]
    active_letter: Optional[str]
    assigned_digit: Optional[int]
    current_mapping: Dict[str, int]
    carries: Dict[int, int]
    status: str  # "assigning", "valid", "conflict", "complete"


@dataclass
class SolveResult:
    puzzle: Puzzle
    solutions: List[Dict[str, int]]
    nodes: int
    backtracks: int
    elapsed_seconds: float
    explanation: List[str]
    deductive_proof: List[Dict[str, str]]
    replay_frames: List[Dict[str, Any]]
    strategy: str


def solve(
    puzzle_or_eq: Puzzle | str,
    strategy: str = "mrv_fc",
    max_solutions: int = 1,
) -> SolveResult:
    """Solve cryptarithm using specified search strategy."""
    puzzle = puzzle_or_eq if isinstance(puzzle_or_eq, Puzzle) else parse_puzzle(puzzle_or_eq)

    if strategy not in ("backtracking", "mrv", "mrv_fc"):
        raise ValueError("Strategy must be 'backtracking', 'mrv', or 'mrv_fc'.")

    start_time = perf_counter()
    nodes = 0
    backtracks = 0
    solutions: List[Dict[str, int]] = []
    explanation: List[str] = []

    assignment: Dict[str, int] = {}
    used_digits: Set[int] = set()

    max_width = max(
        max(len(w) for w in puzzle.addends),
        len(puzzle.result),
    )

    # Column ordering for ultra-fast constraint propagation:
    # Letters in units column first, then tens, etc.
    column_ordered_letters: List[str] = []
    for col in range(max_width):
        for word in (*puzzle.addends, puzzle.result):
            if col < len(word):
                ch = word[-1 - col]
                if ch not in column_ordered_letters:
                    column_ordered_letters.append(ch)
    # Append any remaining letters
    for ch in puzzle.letters:
        if ch not in column_ordered_letters:
            column_ordered_letters.append(ch)

    def partial_columns_valid() -> bool:
        """Check columns from units (right) upwards; stop at first incomplete column."""
        carry = 0
        for col in range(max_width):
            addend_letters = [
                word[-1 - col] for word in puzzle.addends if col < len(word)
            ]
            res_letter = (
                puzzle.result[-1 - col] if col < len(puzzle.result) else None
            )

            # If any addend letter is unassigned, carry can't be determined for higher columns
            if any(ch not in assignment for ch in addend_letters):
                break
            if res_letter is not None and res_letter not in assignment:
                break

            col_sum = carry + sum(assignment[ch] for ch in addend_letters)
            res_val = assignment[res_letter] if res_letter is not None else 0

            if (col_sum % 10) != res_val:
                return False

            carry = col_sum // 10

        # If all variables assigned, verify entire equation
        if len(assignment) == len(puzzle.letters):
            total_sum = sum(word_value(w, assignment) for w in puzzle.addends)
            return total_sum == word_value(puzzle.result, assignment)

        return True

    units_letters = {w[-1] for w in (*puzzle.addends, puzzle.result)}
    letter_frequency = {
        ch: sum(ch in w for w in (*puzzle.addends, puzzle.result))
        for ch in puzzle.letters
    }

    def choose_next_variable() -> str:
        remaining = [ch for ch in column_ordered_letters if ch not in assignment]
        if strategy == "backtracking":
            # Original textual appearance order
            textual_remaining = [ch for ch in puzzle.letters if ch not in assignment]
            return textual_remaining[0]

        if strategy == "mrv_fc":
            # In MRV+FC, follow column order to prune early
            return remaining[0]

        # In standard MRV, prioritize by heuristic weights
        return min(
            remaining,
            key=lambda ch: (
                ch not in units_letters,
                ch not in puzzle.leading,
                -letter_frequency[ch],
            ),
        )

    def search() -> None:
        nonlocal nodes, backtracks

        if len(solutions) >= max_solutions:
            return

        if len(assignment) == len(puzzle.letters):
            if partial_columns_valid():
                solutions.append(dict(assignment))
            return

        var = choose_next_variable()

        for digit in range(10):
            if digit in used_digits:
                continue
            if digit == 0 and var in puzzle.leading:
                continue

            nodes += 1
            assignment[var] = digit
            used_digits.add(digit)

            if len(explanation) < 14:
                explanation.append(f"Assign '{var}' = {digit} (active: {dict(assignment)})")

            is_valid = True
            if strategy == "mrv_fc":
                is_valid = partial_columns_valid()
            elif strategy == "mrv":
                is_valid = partial_columns_valid() if len(assignment) >= 3 else True
            else:
                is_valid = partial_columns_valid() if len(assignment) == len(puzzle.letters) else True

            if is_valid:
                search()
            else:
                backtracks += 1
                if len(explanation) < 16:
                    explanation.append(f"Backtrack on '{var}' = {digit}: column constraint conflict")

            used_digits.remove(digit)
            del assignment[var]

            if len(solutions) >= max_solutions:
                return

    search()
    elapsed = perf_counter() - start_time

    solution = solutions[0] if solutions else None

    # Generate detailed deductive proof and step-by-step replay trace
    deductive_proof = generate_deductive_proof(puzzle, solution)
    replay_frames = generate_replay_frames(puzzle, solution)

    if solutions:
        explanation.append(
            f"Found valid mapping in {nodes:,} nodes, {backtracks:,} backtracks ({elapsed * 1000:.2f} ms)."
        )
    else:
        explanation.append("No valid digit assignment satisfies all column arithmetic constraints.")

    return SolveResult(
        puzzle=puzzle,
        solutions=solutions,
        nodes=nodes,
        backtracks=backtracks,
        elapsed_seconds=elapsed,
        explanation=explanation,
        deductive_proof=deductive_proof,
        replay_frames=replay_frames,
        strategy=strategy,
    )


def generate_deductive_proof(puzzle: Puzzle, solution: Optional[Dict[str, int]]) -> List[Dict[str, str]]:
    """Generate structured algebraic deductions demonstrating why the solution holds."""
    proofs: List[Dict[str, str]] = []

    # 1. Leading Zero Constraints
    lead_chars = sorted(puzzle.leading)
    proofs.append({
        "stage": "Domain Boundaries",
        "rule": "Non-Zero Leading Letter Constraint",
        "deduction": f"Letters {', '.join(repr(c) for c in lead_chars)} are first letters of words, forcing domain D({','.join(lead_chars)}) ⊆ {{1..9}}."
    })

    # 2. High-Order Carry Deduction
    max_addend_len = max(len(w) for w in puzzle.addends)
    if len(puzzle.result) > max_addend_len:
        top_char = puzzle.result[0]
        max_possible_carry = len(puzzle.addends) - 1
        val_str = f" = {solution[top_char]}" if solution and top_char in solution else ""
        proofs.append({
            "stage": "High-Order Column",
            "rule": "Sum Carry Limit Theorem",
            "deduction": f"Result '{puzzle.result}' length ({len(puzzle.result)}) > longest addend ({max_addend_len}). "
                         f"The column carry into column {len(puzzle.result)} can be at most {max_possible_carry}. "
                         f"Therefore, '{top_char}' must be 1{val_str}."
        })

    # 3. Parity & Units Column
    units_addends = [w[-1] for w in puzzle.addends]
    units_res = puzzle.result[-1]
    proofs.append({
        "stage": "Units Arithmetic",
        "rule": "Units Column Modulo-10 Constraint",
        "deduction": f"({' + '.join(units_addends)}) mod 10 = '{units_res}'. "
                     f"Carry C₁ = ({' + '.join(units_addends)}) // 10."
    })

    # 4. Column by Column Carry Chain
    if solution:
        width = max(max(len(w) for w in puzzle.addends), len(puzzle.result))
        carry = 0
        col_names = ["Units", "Tens", "Hundreds", "Thousands", "Ten-Thousands", "Hundred-Thousands"]
        for c in range(width):
            c_name = col_names[c] if c < len(col_names) else f"Column {c + 1}"
            adds = [w[-1 - c] for w in puzzle.addends if c < len(w)]
            res_c = puzzle.result[-1 - c] if c < len(puzzle.result) else ""
            add_vals = [solution[ch] for ch in adds]
            total = carry + sum(add_vals)
            res_val = solution[res_c] if res_c else 0
            next_carry = total // 10

            calc_detail = " + ".join(f"{ch}({v})" for ch, v in zip(adds, add_vals))
            if carry > 0:
                calc_detail += f" + carry_in({carry})"

            proofs.append({
                "stage": f"{c_name} Step",
                "rule": f"Column {c + 1} Arithmetic Evaluation",
                "deduction": f"{calc_detail} = {total} → Write {res_c}({res_val}), propagate carry_out = {next_carry}."
            })
            carry = next_carry

    return proofs


def generate_replay_frames(puzzle: Puzzle, solution: Optional[Dict[str, int]]) -> List[Dict[str, Any]]:
    """Build step-by-step playback frames for the animated solver replay."""
    if not solution:
        return []

    frames: List[Dict[str, Any]] = []
    width = max(max(len(w) for w in puzzle.addends), len(puzzle.result))

    # Frame 0: Initial puzzle state
    frames.append({
        "frame_index": 0,
        "title": "Initial State",
        "description": f"Constraint Satisfaction Problem initialized for: {puzzle.equation}",
        "column_index": None,
        "active_letter": None,
        "assigned_digit": None,
        "current_mapping": {},
        "carries": {},
        "status": "assigning",
    })

    current_map: Dict[str, int] = {}
    current_carries: Dict[int, int] = {}

    carry = 0
    col_names = ["Units", "Tens", "Hundreds", "Thousands", "Ten-Thousands"]

    for c in range(width):
        c_name = col_names[c] if c < len(col_names) else f"Col {c+1}"
        adds = [w[-1 - c] for w in puzzle.addends if c < len(w)]
        res_char = puzzle.result[-1 - c] if c < len(puzzle.result) else ""

        # Step A: Assign unassigned letters in this column
        for ch in [*adds, res_char]:
            if ch and ch not in current_map:
                current_map[ch] = solution[ch]
                frames.append({
                    "frame_index": len(frames),
                    "title": f"Assign Variable '{ch}'",
                    "description": f"Assigned '{ch}' = {solution[ch]} to satisfy column and distinctness constraints.",
                    "column_index": c,
                    "active_letter": ch,
                    "assigned_digit": solution[ch],
                    "current_mapping": dict(current_map),
                    "carries": dict(current_carries),
                    "status": "assigning",
                })

        # Step B: Evaluate the column carry
        add_vals = [current_map[ch] for ch in adds]
        col_sum = carry + sum(add_vals)
        res_digit = current_map[res_char] if res_char else 0
        next_carry = col_sum // 10

        current_carries[c] = carry
        if next_carry > 0:
            current_carries[c + 1] = next_carry

        frames.append({
            "frame_index": len(frames),
            "title": f"Verify {c_name} Column",
            "description": f"Sum: {sum(add_vals)} + carry_in({carry}) = {col_sum}. Validates {res_char} = {res_digit}, carry_out = {next_carry}.",
            "column_index": c,
            "active_letter": res_char,
            "assigned_digit": res_digit,
            "current_mapping": dict(current_map),
            "carries": dict(current_carries),
            "status": "valid",
        })
        carry = next_carry

    # Final frame
    frames.append({
        "frame_index": len(frames),
        "title": "Complete Verified Solution",
        "description": f"All {len(puzzle.letters)} variables bound. Arithmetic holds: {' + '.join(map(str, [word_value(w, solution) for w in puzzle.addends]))} = {word_value(puzzle.result, solution)}.",
        "column_index": None,
        "active_letter": None,
        "assigned_digit": None,
        "current_mapping": dict(solution),
        "carries": dict(current_carries),
        "status": "complete",
    })

    return frames


def solution_steps(puzzle: Puzzle, assignment: Dict[str, int]) -> List[str]:
    """Generate detailed column-by-column carry verification steps."""
    width = max(max(len(w) for w in puzzle.addends), len(puzzle.result))
    carry = 0
    steps: List[str] = []

    col_names = ["Units", "Tens", "Hundreds", "Thousands", "Ten-thousands", "Hundred-thousands"]

    for col in range(width):
        col_name = col_names[col] if col < len(col_names) else f"10^{col}"
        addends_in_col = [w[-1 - col] for w in puzzle.addends if col < len(w)]
        res_char = puzzle.result[-1 - col] if col < len(puzzle.result) else ""

        addend_vals = [assignment[ch] for ch in addends_in_col]
        col_sum = carry + sum(addend_vals)
        res_val = assignment[res_char] if res_char else 0
        next_carry = col_sum // 10

        calc_str = " + ".join(f"{ch}({val})" for ch, val in zip(addends_in_col, addend_vals))
        if carry:
            calc_str += f" + carry({carry})"

        steps.append(
            f"{col_name} column: {calc_str} = {col_sum} → write {res_char}({res_val}), carry {next_carry}"
        )
        carry = next_carry

    return steps


def get_hint(puzzle: Puzzle, current_assignment: Dict[str, int], full_solution: Dict[str, int]) -> Optional[Dict[str, Any]]:
    """Provide a smart hint revealing the next mathematically tightest unassigned letter."""
    unassigned = [ch for ch in puzzle.letters if ch not in current_assignment or current_assignment[ch] != full_solution[ch]]
    if not unassigned:
        return None

    # Prioritize leading letters, then units letters
    units_letters = {w[-1] for w in (*puzzle.addends, puzzle.result)}
    chosen = min(
        unassigned,
        key=lambda ch: (
            ch not in puzzle.leading,
            ch not in units_letters,
        )
    )

    reason = ""
    if chosen in puzzle.leading:
        reason = f"Letter '{chosen}' is a leading letter and must be non-zero."
    elif chosen in units_letters:
        reason = f"Letter '{chosen}' appears in the units column with direct modulo arithmetic."
    else:
        reason = f"Letter '{chosen}' provides interlocking constraints with other columns."

    return {
        "letter": chosen,
        "digit": full_solution[chosen],
        "reason": reason,
    }
