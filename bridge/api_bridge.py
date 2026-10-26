"""PySide6 QWebChannel Bridge connecting Python core to JavaScript UI."""

import json
from typing import Any, Dict

from PySide6.QtCore import QObject, Signal, Slot

from core.benchmark import compare_strategies
from core.generator import generate_puzzle, get_catalogue
from core.progress import clear_progress, get_analytics, load_progress, record_attempt
from core.puzzle import check_solution, evaluate_columns, parse_puzzle, word_value
from core.solver import get_hint, solution_steps, solve


class CryptarithmBridge(QObject):
    """Bridge object exposed to the JavaScript runtime via QWebChannel."""

    puzzleSolved = Signal(str)
    benchmarkCompleted = Signal(str)
    analyticsUpdated = Signal(str)

    def __init__(self, parent=None):
        super().__init__(parent)

    @Slot(str, str, int, result=str)
    def solvePuzzle(self, equation: str, strategy: str = "mrv_fc", max_solutions: int = 1) -> str:
        """Solve puzzle and return full payload with deductive proofs and replay frames."""
        try:
            puzzle = parse_puzzle(equation)
            res = solve(puzzle, strategy=strategy, max_solutions=max_solutions)
            steps = []
            if res.solutions:
                steps = solution_steps(puzzle, res.solutions[0])

            response = {
                "success": True,
                "equation": puzzle.equation,
                "letters": list(puzzle.letters),
                "leading": list(puzzle.leading),
                "solutions": res.solutions,
                "nodes": res.nodes,
                "backtracks": res.backtracks,
                "elapsed_ms": round(res.elapsed_seconds * 1000, 2),
                "explanation": res.explanation,
                "steps": steps,
                "deductive_proof": res.deductive_proof,
                "replay_frames": res.replay_frames,
            }
        except Exception as err:
            response = {"success": False, "error": str(err)}

        return json.dumps(response)

    @Slot(str, result=str)
    def generatePuzzle(self, difficulty: str = "Easy") -> str:
        """Generate a solvable puzzle equation."""
        try:
            equation = generate_puzzle(difficulty)
            puzzle = parse_puzzle(equation)
            response = {
                "success": True,
                "equation": equation,
                "letters": list(puzzle.letters),
                "difficulty": difficulty,
            }
        except Exception as err:
            response = {"success": False, "error": str(err)}

        return json.dumps(response)

    @Slot(result=str)
    def getCatalogue(self) -> str:
        """Return the classic alphametic puzzle library."""
        try:
            items = get_catalogue()
            response = {"success": True, "catalogue": items}
        except Exception as err:
            response = {"success": False, "error": str(err)}

        return json.dumps(response)

    @Slot(str, str, result=str)
    def getHint(self, equation: str, current_map_json: str) -> str:
        """Compute the next intelligent deductive hint."""
        try:
            puzzle = parse_puzzle(equation)
            res = solve(puzzle, strategy="mrv_fc", max_solutions=1)
            if not res.solutions:
                return json.dumps({"success": False, "error": "No solution exists to provide hints for."})

            sol = res.solutions[0]
            current_map = json.loads(current_map_json) if current_map_json else {}
            current_map = {k.upper(): int(v) for k, v in current_map.items() if v is not None and str(v).isdigit()}

            hint_data = get_hint(puzzle, current_map, sol)
            if hint_data:
                response = {"success": True, "hint": hint_data}
            else:
                response = {"success": True, "hint": None, "message": "All variables are already correctly assigned."}
        except Exception as err:
            response = {"success": False, "error": str(err)}

        return json.dumps(response)

    @Slot(str, result=str)
    def compareStrategies(self, equation: str) -> str:
        """Run algorithm research benchmark across all strategies."""
        try:
            benchmark_data = compare_strategies(equation)
            response = {"success": True, "data": benchmark_data}
        except Exception as err:
            response = {"success": False, "error": str(err)}

        return json.dumps(response)

    @Slot(str, str, result=str)
    def checkAnswer(self, equation: str, assignment_json: str) -> str:
        """Verify user submitted assignment for an equation."""
        try:
            puzzle = parse_puzzle(equation)
            assignment_raw = json.loads(assignment_json)
            assignment = {k.upper(): int(v) for k, v in assignment_raw.items()}

            is_valid = check_solution(puzzle, assignment)
            steps = solution_steps(puzzle, assignment) if is_valid else []
            col_eval = [
                {
                    "col": s.col_index,
                    "letters": s.addend_letters,
                    "res_letter": s.result_letter,
                    "sum": s.column_sum,
                    "carry_in": s.carry_in,
                    "carry_out": s.carry_out,
                    "valid": s.is_valid,
                    "explanation": s.explanation,
                }
                for s in evaluate_columns(puzzle, assignment)
            ]

            response = {
                "success": True,
                "is_valid": is_valid,
                "steps": steps,
                "columns": col_eval,
                "reason": "Correct assignment! All constraints and column carries satisfied."
                if is_valid
                else "Incorrect assignment: values conflict with column sums or constraint rules.",
            }
        except Exception as err:
            response = {"success": False, "error": str(err), "is_valid": False}

        return json.dumps(response)

    @Slot(result=str)
    def getAnalytics(self) -> str:
        """Retrieve aggregated learning analytics and history."""
        try:
            data = get_analytics()
            response = {"success": True, "data": data}
        except Exception as err:
            response = {"success": False, "error": str(err)}

        return json.dumps(response)

    @Slot(str, bool, str, str, str, float, result=str)
    def recordAttempt(
        self,
        equation: str,
        solved: bool,
        difficulty: str = "Unknown",
        source: str = "practice",
        reason: str = "",
        elapsed_seconds: float = 0.0,
    ) -> str:
        """Record attempt outcome into persistent progress history."""
        try:
            letter_count = 0
            try:
                p = parse_puzzle(equation)
                letter_count = len(p.letters)
            except Exception:
                pass

            record = record_attempt(
                equation=equation,
                solved=solved,
                letter_count=letter_count,
                difficulty=difficulty,
                source=source,
                reason=reason,
                elapsed_seconds=elapsed_seconds,
            )
            response = {"success": True, "record": record}
        except Exception as err:
            response = {"success": False, "error": str(err)}

        return json.dumps(response)

    @Slot(result=str)
    def clearHistory(self) -> str:
        """Clear practice and challenge history."""
        try:
            clear_progress()
            response = {"success": True}
        except Exception as err:
            response = {"success": False, "error": str(err)}

        return json.dumps(response)
