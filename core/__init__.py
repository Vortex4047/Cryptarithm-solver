"""Cryptarithm Lab core module."""

from core.benchmark import compare_strategies
from core.generator import generate_puzzle
from core.progress import (
    clear_progress,
    get_analytics,
    load_progress,
    record_attempt,
    suggested_difficulty,
)
from core.puzzle import (
    ColumnStep,
    Puzzle,
    check_solution,
    evaluate_columns,
    parse_puzzle,
    word_value,
    words_share_letters,
)
from core.solver import SolveResult, solve

__all__ = [
    "Puzzle",
    "ColumnStep",
    "parse_puzzle",
    "check_solution",
    "word_value",
    "words_share_letters",
    "evaluate_columns",
    "SolveResult",
    "solve",
    "generate_puzzle",
    "compare_strategies",
    "record_attempt",
    "load_progress",
    "clear_progress",
    "suggested_difficulty",
    "get_analytics",
]
