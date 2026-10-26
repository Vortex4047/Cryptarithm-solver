"""Comparative algorithm research benchmark runner for cryptarithm solving."""

from dataclasses import asdict
from typing import Any, Dict, List

from core.puzzle import parse_puzzle
from core.solver import solve


STRATEGIES = [
    ("backtracking", "Basic Backtracking"),
    ("mrv", "MRV (Minimum Remaining Values)"),
    ("mrv_fc", "MRV + Forward Checking"),
]


def compare_strategies(equation: str) -> Dict[str, Any]:
    """Execute all three search strategies on the same equation and compile metrics."""
    puzzle = parse_puzzle(equation)
    results: List[Dict[str, Any]] = []

    baseline_nodes = 1

    for key, label in STRATEGIES:
        res = solve(puzzle, strategy=key, max_solutions=2)
        if key == "backtracking" and res.nodes > 0:
            baseline_nodes = res.nodes

        reduction = 0.0
        if baseline_nodes > 0:
            reduction = max(0.0, (1 - (res.nodes / baseline_nodes)) * 100)

        results.append({
            "strategy": key,
            "label": label,
            "solutions_count": len(res.solutions),
            "nodes": res.nodes,
            "backtracks": res.backtracks,
            "elapsed_ms": round(res.elapsed_seconds * 1000, 3),
            "search_pruning_pct": round(reduction, 1),
            "first_solution": res.solutions[0] if res.solutions else {},
        })

    # Summary insight
    fastest = min(results, key=lambda x: x["elapsed_ms"])
    least_nodes = min(results, key=lambda x: x["nodes"])

    insight = (
        f"Search strategy '{least_nodes['label']}' reduced node expansions "
        f"to {least_nodes['nodes']:,} nodes ({least_nodes['search_pruning_pct']}% reduction "
        f"vs basic backtracking). Fastest execution was {fastest['elapsed_ms']} ms."
    )

    return {
        "equation": puzzle.equation,
        "letters_count": len(puzzle.letters),
        "letters": list(puzzle.letters),
        "results": results,
        "insight": insight,
    }
