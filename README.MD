# Cryptarithm Lab

A high-performance desktop application for solving, benchmarking, and practicing addition cryptarithms (alphametics) such as `SEND + MORE = MONEY`.

Rebuilt completely from scratch using **PySide6** and a modern, high-craft design language distilled with **Taste Skill v2**, the application combines a fast Constraint Satisfaction Problem (CSP) Python solving engine with a modern dark devtools interface, vertical column-addition carry visualizer, timed letter-card challenges, empirical search strategy benchmarks, and persistent learning analytics.

---

## Features

### 1. Studio & Arithmetic Visualizer
- **Vertical Column-Addition Architecture**: Live stacked alignment showing addends, operators, division rules, and column carry indicators ($C_4, C_3, C_2, C_1$).
- **Step-by-Step Replay Player**: Interactive animation playback (`⏮ First`, `◀ Prev`, `▶ Play / ⏸ Pause`, `Next ▶`, `Last ⏭`) with variable speed control (`0.5x`, `1x`, `2x`), active column glow, and carry transfer animation.
- **Deductive Mathematical Proof Engine**: Formal logical derivations explaining domain constraints, high-order carry bounds, parity mechanics, and column carry chains.
- **Multi-Strategy CSP Solver**: Solves addition cryptarithms in milliseconds with column-directed Forward Checking.
- **Manual Practice Logging**: Allows self-recording of practice attempts with automatic difficulty classification.

### 2. Timed Letter-Card Challenge
- **Three Calibrated Difficulties**:
  - **Easy**: 5-minute countdown limit.
  - **Medium**: 10-minute countdown limit.
  - **Hard**: 30-minute countdown limit.
- **Intelligent Deductive Hint Engine**: Reveals the mathematically tightest unassigned variable with logical explanations.
- **Tactile Letter Cards**: Interactive digit inputs with auto-advance, keyboard navigation (0–9, arrows, backspace), and an onscreen numeric touchpad.
- **Circular Timer HUD**: Animated SVG countdown ring with pulse warnings as time expires.
- **Immediate Carry Breakdown**: Verifies submitted solutions with detailed column-by-column validity reports.

### 3. Classics Alphametic Library
- **Celebrated Historical Catalogue**: 1-click loading for classic puzzles including Dudeney's `SEND + MORE = MONEY` (1924), `DONALD + GERALD = ROBERT`, `BASE + BALL = GAMES`, `CROSS + ROADS = DANGER`, and `SATURN + URANUS = PLANETS`.

### 4. Research Benchmark Laboratory
- **Empirical Search Comparison**: Compares three algorithms head-to-head on the same puzzle:
  1. **Basic Backtracking**: Pure recursive search without heuristic variable ordering.
  2. **MRV (Minimum Remaining Values)**: Prioritizes heavily constrained letters (units column, leading digits, high frequency).
  3. **MRV + Forward Checking**: Eagerly prunes variable domains and detects column carry contradictions immediately.
- **Pure SVG Charts**: Clean horizontal comparative bar charts rendering node expansions, backtracks, and execution time in milliseconds.
- **Pruning Metrics**: Computes percentage reduction in search space relative to baseline backtracking.

### 5. Learning Analytics Dashboard
- **Session KPIs**: Real-time tracking of total attempts, verified completions, accuracy percentage, and active/best streaks.
- **Rolling Accuracy Timeline**: 5-attempt rolling window line chart visualizing skill progression.
- **Session History Log**: Comprehensive tabular history with timestamps, equations, difficulty levels, and outcomes.
- **Data Persistence**: Stores progress locally in `data/progress.json`.

---

## Project Structure

```
AISC PROJECT/
├── app.py                      # PySide6 desktop launcher (QMainWindow, QWebEngineView, QWebChannel)
├── core/                       # Core mathematical logic and CSP solver
│   ├── __init__.py             # Public exports for the core package
│   ├── puzzle.py               # AST parsing, validation, column arithmetic check
│   ├── solver.py               # CSP engine (Backtracking, MRV, MRV + Forward Checking)
│   ├── generator.py            # Calibrated puzzle generator (Easy, Medium, Hard)
│   ├── progress.py             # Analytics, session storage, adaptive difficulty
│   └── benchmark.py            # Comparative search benchmark runner
├── bridge/                     # Python ↔ JavaScript integration
│   ├── __init__.py
│   └── api_bridge.py           # PySide6 QWebChannel bridge with typed slots & signals
├── ui/                         # Modern Taste Skill v2 Interface
│   ├── index.html              # Sleek single-page application structure
│   ├── css/
│   │   ├── tokens.css          # Dark devtools color palette and design tokens
│   │   ├── base.css            # Base resets, icon rail navigation, responsive layouts
│   │   ├── components.css      # Tactile cards, visualizer, buttons, timer HUD, tables
│   │   └── animations.css      # Scroll-driven entrance reveals and micro-animations
│   └── js/
│       ├── qwebchannel.js      # Standard Qt WebChannel client
│       ├── app.js              # State manager, event listeners, and bridge integration
│       ├── charts.js           # Lightweight pure SVG chart engine
│       └── animations.js       # IntersectionObserver scroll animation controller
├── data/                       # Local progress database
│   └── progress.json
├── tests/                      # Comprehensive unit test suite
│   ├── test_core.py            # Core end-to-end integration tests
│   ├── test_generator.py       # Puzzle generation and validity tests
│   ├── test_progress.py        # Analytics and streak computation tests
│   └── test_solver.py          # CSP solver and constraint validation tests
├── requirements.txt            # Python dependencies (PySide6)
└── README.MD                   # Project documentation
```

---

## Requirements & Installation

1. **Python 3.10+**
2. Install dependencies:
   ```bash
   pip3 install -r requirements.txt
   ```

---

## Running the Desktop Application

Launch the desktop app using PySide6:

```bash
python3 app.py
```

---

## Running Tests

Run the test suite with Python's built-in `unittest` runner:

```bash
python3 -m unittest discover tests
```

---

## Design System & Meter Compliance

The interface is built to adhere to **Taste Skill v2** standards:
- **No-Slop Design Language**: Flat surfaces with tone-step hierarchy, zero decorative gradients, zero unnecessary shadows at rest, and no emoji chrome.
- **Strict Typography**: Strictly two typefaces loaded (`Public Sans` for UI and `JetBrains Mono` for tabular mathematical figures).
- **Two-Line Headline Rule**: All titles fit within two lines across desktop, tablet, and mobile widths.
- **Full Meter Validation**: Passes both `lint.mjs` and `inspect.mjs` with **0 FAIL** and **0 WARN**.
