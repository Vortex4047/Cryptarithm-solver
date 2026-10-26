"""Solvable cryptarithm puzzle generator and curated classics catalogue."""

import random
import string
from typing import Any, Dict, List, Optional

from core.puzzle import parse_puzzle, words_share_letters
from core.solver import solve


CLASSICS_CATALOGUE: List[Dict[str, Any]] = [
    {
        "id": "send-more-money",
        "title": "SEND + MORE = MONEY",
        "author": "H. E. Dudeney (1924)",
        "difficulty": "Medium",
        "letters_count": 8,
        "description": "The most famous cryptarithm in mathematical puzzle history.",
    },
    {
        "id": "donald-gerald-robert",
        "title": "DONALD + GERALD = ROBERT",
        "author": "Classic Alphametic",
        "difficulty": "Hard",
        "letters_count": 10,
        "description": "Legendary puzzle where D=5 is given or deduced first, using all 10 digits.",
    },
    {
        "id": "base-ball-games",
        "title": "BASE + BALL = GAMES",
        "author": "Mathematical Gazette",
        "difficulty": "Medium",
        "letters_count": 7,
        "description": "Double 'L' in the second addend creates tight units/tens carry constraints.",
    },
    {
        "id": "cross-roads-danger",
        "title": "CROSS + ROADS = DANGER",
        "author": "Classic Challenge",
        "difficulty": "Medium",
        "letters_count": 8,
        "description": "Rich interlocking letter network across six-letter result.",
    },
    {
        "id": "saturn-uranus-planets",
        "title": "SATURN + URANUS = PLANETS",
        "author": "Astronomical Alphametic",
        "difficulty": "Hard",
        "letters_count": 8,
        "description": "Astronomical puzzle with cascading carry chains.",
    },
    {
        "id": "to-go-out",
        "title": "TO + GO = OUT",
        "author": "Introductory Classic",
        "difficulty": "Easy",
        "letters_count": 5,
        "description": "Fast 2-digit addends with units carry propagation.",
    },
    {
        "id": "no-on-too",
        "title": "NO + ON = TOO",
        "author": "Palindromic Alphametic",
        "difficulty": "Easy",
        "letters_count": 4,
        "description": "Reversed addends yielding a double-letter outcome.",
    },
    {
        "id": "he-me-we",
        "title": "HE + ME = WE",
        "author": "Minimalist Classic",
        "difficulty": "Easy",
        "letters_count": 4,
        "description": "Shared letter 'E' in units column creates instant modulus deduction.",
    },
    {
        "id": "forty-ten-sixty",
        "title": "FORTY + TEN + TEN = SIXTY",
        "author": "Triple Addend Classic",
        "difficulty": "Hard",
        "letters_count": 7,
        "description": "Three addends summing to an arithmetic identity.",
    },
    {
        "id": "earth-air-fire-nature",
        "title": "EARTH + AIR + FIRE = NATURE",
        "author": "Four Elements Classic",
        "difficulty": "Hard",
        "letters_count": 8,
        "description": "Elemental four-word addition network with multi-word carries.",
    },
]

CURATED_CLASSICS = {
    "Easy": [c["title"] for c in CLASSICS_CATALOGUE if c["difficulty"] == "Easy"],
    "Medium": [c["title"] for c in CLASSICS_CATALOGUE if c["difficulty"] == "Medium"],
    "Hard": [c["title"] for c in CLASSICS_CATALOGUE if c["difficulty"] == "Hard"],
}


def get_catalogue() -> List[Dict[str, Any]]:
    """Return structured catalogue of famous cryptarithms."""
    return CLASSICS_CATALOGUE


def generate_puzzle(difficulty: str = "Easy", seed: Optional[int] = None) -> str:
    """Generate a solvable cryptarithm addition equation."""
    if difficulty not in ("Easy", "Medium", "Hard"):
        raise ValueError("Difficulty must be 'Easy', 'Medium', or 'Hard'.")

    rng = random.Random(seed)

    # 40% chance to pick a curated classic if available
    if rng.random() < 0.4 and difficulty in CURATED_CLASSICS:
        chosen = rng.choice(CURATED_CLASSICS[difficulty])
        return chosen

    widths = {"Easy": (1, 2), "Medium": (2, 3), "Hard": (3, 4)}
    min_w, max_w = widths[difficulty]

    # Try algorithmic generation with solvability check
    for _ in range(250):
        digit_to_letter = dict(
            zip(range(10), rng.sample(string.ascii_uppercase, 10))
        )

        w1 = rng.randint(min_w, max_w)
        w2 = rng.randint(min_w, max_w)

        left = rng.randint(10 ** (w1 - 1), (10 ** w1) - 1)
        right = rng.randint(10 ** (w2 - 1), (10 ** w2) - 1)
        total = left + right

        def to_word(num: int) -> str:
            return "".join(digit_to_letter[int(d)] for d in str(num))

        w_left = to_word(left)
        w_right = to_word(right)
        w_total = to_word(total)
        words = (w_left, w_right, w_total)

        if words_share_letters(words):
            candidate = f"{w_left} + {w_right} = {w_total}"
            try:
                res = solve(candidate, strategy="mrv_fc", max_solutions=1)
                if res.solutions:
                    return candidate
            except ValueError:
                continue

    return rng.choice(CURATED_CLASSICS[difficulty])
