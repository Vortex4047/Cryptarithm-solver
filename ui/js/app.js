/**
 * Cryptarithm Lab — Main Application Logic
 * Integrates with PySide6 QWebChannel Bridge, Step-by-Step Replay Engine,
 * Deductive Proofs, Classics Catalogue, and Timed Challenge Mode.
 */

(function () {
  "use strict";

  // Application State
  const state = {
    currentTab: "studio",
    currentEquation: "SEND + MORE = MONEY",
    currentSolution: null,
    currentLetterMap: {},
    replay: {
      frames: [],
      currentIndex: 0,
      isPlaying: false,
      timerId: null,
      speedMs: 900,
    },
    challenge: {
      active: false,
      equation: "SEND + MORE = MONEY",
      difficulty: "Easy",
      durationSeconds: 300,
      remainingSeconds: 300,
      timerId: null,
      deadline: 0,
      userMap: {},
      hintsUsed: 0,
    },
    tutor: {
      equation: "SEND + MORE = MONEY",
      session: null,
      stepIndex: 0,
      score: 100,
      correctCount: 0,
      attemptsCount: 0,
      hintsUsed: 0,
      cumulativeMap: {},
      carries: {},
      stepAnswered: false,
    },
    analytics: null,
    bridgeReady: false,
  };

  // Mock Bridge fallback for browser preview / testing
  const mockBridge = {
    async solvePuzzle(eq, strategy = "mrv_fc", maxSol = 1) {
      const isSendMore = eq.includes("SEND") && eq.includes("MORE");
      const sol = isSendMore
        ? { S: 9, E: 5, N: 6, D: 7, M: 1, O: 0, R: 8, Y: 2 }
        : { T: 2, O: 1, G: 8, U: 9 };
      const letters = Object.keys(sol);
      const leading = isSendMore ? ["S", "M"] : ["T", "G", "O"];

      const replay_frames = isSendMore ? [
        { frame_index: 0, title: "Initial State", description: `Constraint Satisfaction Problem initialized for: ${eq}`, column_index: null, active_letter: null, assigned_digit: null, current_mapping: {}, carries: {}, status: "assigning" },
        { frame_index: 1, title: "Assign Variable 'D'", description: "Assigned 'D' = 7 to satisfy column and distinctness constraints.", column_index: 0, active_letter: "D", assigned_digit: 7, current_mapping: { D: 7 }, carries: {}, status: "assigning" },
        { frame_index: 2, title: "Assign Variable 'E'", description: "Assigned 'E' = 5 to satisfy column and distinctness constraints.", column_index: 0, active_letter: "E", assigned_digit: 5, current_mapping: { D: 7, E: 5 }, carries: {}, status: "assigning" },
        { frame_index: 3, title: "Assign Variable 'Y'", description: "Assigned 'Y' = 2 to satisfy column and distinctness constraints.", column_index: 0, active_letter: "Y", assigned_digit: 2, current_mapping: { D: 7, E: 5, Y: 2 }, carries: {}, status: "assigning" },
        { frame_index: 4, title: "Verify Units Column", description: "Sum: 12 + carry_in(0) = 12. Validates Y = 2, carry_out = 1.", column_index: 0, active_letter: "Y", assigned_digit: 2, current_mapping: { D: 7, E: 5, Y: 2 }, carries: { 0: 0, 1: 1 }, status: "valid" },
        { frame_index: 5, title: "Assign Variable 'N'", description: "Assigned 'N' = 6 to satisfy column and distinctness constraints.", column_index: 1, active_letter: "N", assigned_digit: 6, current_mapping: { D: 7, E: 5, Y: 2, N: 6 }, carries: { 0: 0, 1: 1 }, status: "assigning" },
        { frame_index: 6, title: "Assign Variable 'R'", description: "Assigned 'R' = 8 to satisfy column and distinctness constraints.", column_index: 1, active_letter: "R", assigned_digit: 8, current_mapping: { D: 7, E: 5, Y: 2, N: 6, R: 8 }, carries: { 0: 0, 1: 1 }, status: "assigning" },
        { frame_index: 7, title: "Verify Tens Column", description: "Sum: 14 + carry_in(1) = 15. Validates E = 5, carry_out = 1.", column_index: 1, active_letter: "E", assigned_digit: 5, current_mapping: { D: 7, E: 5, Y: 2, N: 6, R: 8 }, carries: { 0: 0, 1: 1, 2: 1 }, status: "valid" },
        { frame_index: 8, title: "Assign Variable 'O'", description: "Assigned 'O' = 0 to satisfy column and distinctness constraints.", column_index: 2, active_letter: "O", assigned_digit: 0, current_mapping: { D: 7, E: 5, Y: 2, N: 6, R: 8, O: 0 }, carries: { 0: 0, 1: 1, 2: 1 }, status: "assigning" },
        { frame_index: 9, title: "Verify Hundreds Column", description: "Sum: 5 + carry_in(1) = 6. Validates N = 6, carry_out = 0.", column_index: 2, active_letter: "N", assigned_digit: 6, current_mapping: { D: 7, E: 5, Y: 2, N: 6, R: 8, O: 0 }, carries: { 0: 0, 1: 1, 2: 1 }, status: "valid" },
        { frame_index: 10, title: "Assign Variable 'S'", description: "Assigned 'S' = 9 to satisfy column and distinctness constraints.", column_index: 3, active_letter: "S", assigned_digit: 9, current_mapping: { D: 7, E: 5, Y: 2, N: 6, R: 8, O: 0, S: 9 }, carries: { 0: 0, 1: 1, 2: 1 }, status: "assigning" },
        { frame_index: 11, title: "Assign Variable 'M'", description: "Assigned 'M' = 1 to satisfy column and distinctness constraints.", column_index: 3, active_letter: "M", assigned_digit: 1, current_mapping: { D: 7, E: 5, Y: 2, N: 6, R: 8, O: 0, S: 9, M: 1 }, carries: { 0: 0, 1: 1, 2: 1 }, status: "assigning" },
        { frame_index: 12, title: "Verify Thousands Column", description: "Sum: 10 + carry_in(0) = 10. Validates O = 0, carry_out = 1.", column_index: 3, active_letter: "O", assigned_digit: 0, current_mapping: { D: 7, E: 5, Y: 2, N: 6, R: 8, O: 0, S: 9, M: 1 }, carries: { 0: 0, 1: 1, 2: 1, 4: 1 }, status: "valid" },
        { frame_index: 13, title: "Verify Ten-Thousands Column", description: "Sum: 0 + carry_in(1) = 1. Validates M = 1, carry_out = 0.", column_index: 4, active_letter: "M", assigned_digit: 1, current_mapping: { D: 7, E: 5, Y: 2, N: 6, R: 8, O: 0, S: 9, M: 1 }, carries: { 0: 0, 1: 1, 2: 1, 4: 1 }, status: "valid" },
        { frame_index: 14, title: "Complete Verified Solution", description: "All 8 variables bound. Arithmetic holds: 9567 + 1085 = 10652.", column_index: null, active_letter: null, assigned_digit: null, current_mapping: sol, carries: { 0: 0, 1: 1, 2: 1, 4: 1 }, status: "complete" }
      ] : [
        { frame_index: 0, title: "Initial State", description: `Initialized constraint network for: ${eq}`, column_index: null, active_letter: null, assigned_digit: null, current_mapping: {}, carries: {}, status: "assigning" },
        { frame_index: 1, title: "Units Column Assignment", description: "Evaluating units column letters with modulo-10 arithmetic.", column_index: 0, active_letter: "O", assigned_digit: 1, current_mapping: { O: 1 }, carries: {}, status: "assigning" },
        { frame_index: 2, title: "Units Column Carry Propagation", description: "Sum: O(1) + O(1) = 2 -> write T(2), carry_out = 0.", column_index: 0, active_letter: "T", assigned_digit: 2, current_mapping: { O: 1, T: 2 }, carries: {}, status: "valid" },
        { frame_index: 3, title: "Complete Verified Solution", description: "All constraint satisfaction variables bound with valid column sums.", column_index: null, active_letter: null, assigned_digit: null, current_mapping: sol, carries: {}, status: "complete" }
      ];

      const deductive_proof = [
        {
          stage: "Domain Boundaries",
          rule: "Non-Zero Leading Letter Constraint",
          deduction: `Letters ${leading.map(c => `'${c}'`).join(", ")} cannot equal 0.`
        },
        {
          stage: "High-Order Column",
          rule: "Sum Carry Limit Theorem",
          deduction: isSendMore
            ? "Result 'MONEY' length (5) > longest addend (4). Highest carry is at most 1, forcing 'M' = 1."
            : "Two addends sum to three-digit result. Leading result carry is 1."
        },
        {
          stage: "Units Arithmetic",
          rule: "Units Modulo-10 Equation",
          deduction: isSendMore
            ? "(D + E) mod 10 = Y with carry C₁ = (D + E) // 10."
            : "(O + O) mod 10 = T."
        }
      ];

      return JSON.stringify({
        success: true,
        equation: eq,
        letters: letters,
        leading: leading,
        solutions: [sol],
        nodes: isSendMore ? 7956 : 14,
        backtracks: isSendMore ? 6184 : 4,
        elapsed_ms: isSendMore ? 12.4 : 0.8,
        explanation: ["Solved via optimized column-directed forward checking."],
        steps: isSendMore
          ? [
              "Units column: D(7) + E(5) = 12 → write Y(2), carry 1",
              "Tens column: N(6) + R(8) + carry(1) = 15 → write E(5), carry 1",
              "Hundreds column: E(5) + O(0) + carry(1) = 6 → write N(6), carry 0",
              "Thousands column: S(9) + M(1) = 10 → write O(0), carry 1",
              "Ten-thousands column: carry(1) = 1 → write M(1), carry 0"
            ]
          : ["Units column: O(1) + O(1) = 2 → write T(2)", "Tens column: T(2) + G(8) = 10 → write U(0), carry 1"],
        deductive_proof: deductive_proof,
        replay_frames: replay_frames,
      });
    },

    async generatePuzzle(diff) {
      const p = {
        Easy: "TO + GO = OUT",
        Medium: "SEND + MORE = MONEY",
        Hard: "DONALD + GERALD = ROBERT"
      }[diff] || "SEND + MORE = MONEY";
      return JSON.stringify({ success: true, equation: p, difficulty: diff });
    },

    async getCatalogue() {
      return JSON.stringify({
        success: true,
        catalogue: [
          { id: "send-more-money", title: "SEND + MORE = MONEY", author: "H. E. Dudeney (1924)", difficulty: "Medium", letters_count: 8, description: "The most famous cryptarithm in mathematical puzzle history." },
          { id: "donald-gerald-robert", title: "DONALD + GERALD = ROBERT", author: "Classic Alphametic", difficulty: "Hard", letters_count: 10, description: "Legendary puzzle where D=5 is given or deduced first, using all 10 digits." },
          { id: "base-ball-games", title: "BASE + BALL = GAMES", author: "Mathematical Gazette", difficulty: "Medium", letters_count: 7, description: "Double 'L' in the second addend creates tight units/tens carry constraints." },
          { id: "cross-roads-danger", title: "CROSS + ROADS = DANGER", author: "Classic Challenge", difficulty: "Medium", letters_count: 8, description: "Rich interlocking letter network across six-letter result." },
          { id: "to-go-out", title: "TO + GO = OUT", author: "Introductory Classic", difficulty: "Easy", letters_count: 5, description: "Fast 2-digit addends with units carry propagation." },
          { id: "he-me-we", title: "HE + ME = WE", author: "Minimalist Classic", difficulty: "Easy", letters_count: 4, description: "Shared letter 'E' in units column creates instant modulus deduction." },
          { id: "saturn-uranus-planets", title: "SATURN + URANUS = PLANETS", author: "Astronomical Alphametic", difficulty: "Hard", letters_count: 8, description: "Astronomical puzzle with cascading carry chains." }
        ]
      });
    },

    async getHint(eq, mapJson) {
      return JSON.stringify({
        success: true,
        hint: {
          letter: "M",
          digit: 1,
          reason: "High-order carry: Result word length exceeds addend length by 1, forcing leading letter to 1."
        }
      });
    },

    async compareStrategies(eq) {
      return JSON.stringify({
        success: true,
        data: {
          equation: eq,
          letters_count: 8,
          results: [
            { strategy: "backtracking", label: "Basic Backtracking", nodes: 2085786, backtracks: 1451519, elapsed_ms: 3232.5, search_pruning_pct: 0 },
            { strategy: "mrv", label: "MRV (Minimum Remaining Values)", nodes: 195276, backtracks: 136007, elapsed_ms: 573.2, search_pruning_pct: 90.6 },
            { strategy: "mrv_fc", label: "MRV + Forward Checking", nodes: 7956, backtracks: 6184, elapsed_ms: 12.8, search_pruning_pct: 99.6 }
          ],
          insight: "Search strategy 'MRV + Forward Checking' reduced node expansions by 99.6% vs basic backtracking."
        }
      });
    },

    async checkAnswer(eq, mapJson) {
      const map = JSON.parse(mapJson);
      const isCorrect = map["S"] == 9 && map["M"] == 1 && map["O"] == 0;
      return JSON.stringify({
        success: true,
        is_valid: isCorrect,
        reason: isCorrect ? "Correct! All column carries satisfied." : "Incorrect digit assignments.",
        steps: []
      });
    },

    async getAnalytics() {
      return JSON.stringify({
        success: true,
        data: {
          total_attempts: 14,
          solved_count: 11,
          needs_practice_count: 3,
          accuracy_pct: 78.6,
          current_streak: 4,
          best_streak: 6,
          suggested_difficulty: "Medium",
          timeline: [
            { attempt: 1, accuracy: 100, equation: "TO + GO = OUT", solved: true },
            { attempt: 2, accuracy: 100, equation: "NO + ON = TOO", solved: true },
            { attempt: 3, accuracy: 66.7, equation: "BASE + BALL = GAMES", solved: false },
            { attempt: 4, accuracy: 75, equation: "SEND + MORE = MONEY", solved: true },
            { attempt: 5, accuracy: 80, equation: "HE + ME = WE", solved: true },
            { attempt: 6, accuracy: 83.3, equation: "CROSS + ROADS = DANGER", solved: true }
          ],
          recent_history: [
            { id: 6, time: "2026-10-26T10:30:00", equation: "CROSS + ROADS = DANGER", solved: true, difficulty: "Medium", source: "challenge", reason: "Correct assignment." },
            { id: 5, time: "2026-10-26T10:22:00", equation: "HE + ME = WE", solved: true, difficulty: "Easy", source: "practice", reason: "Manual practice" },
            { id: 4, time: "2026-10-26T10:14:00", equation: "SEND + MORE = MONEY", solved: true, difficulty: "Medium", source: "challenge", reason: "Correct assignment." },
            { id: 3, time: "2026-10-26T10:05:00", equation: "BASE + BALL = GAMES", solved: false, difficulty: "Medium", source: "challenge", reason: "Time expired." }
          ]
        }
      });
    },

    async recordAttempt(eq, solved, diff, source, reason, elapsed) {
      return JSON.stringify({ success: true });
    },

    async clearHistory() {
      return JSON.stringify({ success: true });
    },

    async getTutorSession(eq) {
      const isSendMore = eq.includes("SEND") && eq.includes("MORE");
      return JSON.stringify({
        success: true,
        equation: isSendMore ? "SEND + MORE = MONEY" : eq,
        letters: isSendMore ? ["S", "E", "N", "D", "M", "O", "R", "Y"] : ["T", "O", "G", "U"],
        total_steps: 8,
        preset_title: isSendMore ? "SEND + MORE = MONEY (Masterclass)" : `${eq} Guided Deduction`,
        full_solution: isSendMore ? { S: 9, E: 5, N: 6, D: 7, M: 1, O: 0, R: 8, Y: 2 } : { T: 2, O: 1, G: 8, U: 9 },
        steps: [
          {
            step_index: 0,
            total_steps: 8,
            stage_name: "Leading Column Carry Theorem",
            target_letter: "M",
            target_digit: 1,
            column_index: 4,
            column_name: "Ten-Thousands Column (10⁴)",
            equation_context: "C₄ = M",
            prompt_question: "Look at the 5th column letter 'M' in the sum MONEY. The addends SEND and MORE each have 4 digits. In base-10 addition, the maximum sum of two 4-digit numbers is 9,999 + 9,999 = 19,998. Since M is the leading digit of MONEY, what digit must 'M' be?",
            choices: [
              { digit: 1, text: "1", is_correct: true, explanation: "Spot on! Two 4-digit numbers sum to at most 19,998, so the carry C₄ can only be 1. Because 'M' is a leading letter, M ≠ 0, forcing M = 1." },
              { digit: 0, text: "0", is_correct: false, explanation: "Incorrect: In cryptarithms, leading letters can never be 0." },
              { digit: 2, text: "2", is_correct: false, explanation: "Incorrect: In 2-addend sums, column carry cannot exceed 1." },
              { digit: 9, text: "9", is_correct: false, explanation: "Incorrect: A single column carry cannot be 9." }
            ],
            hint_text: "Consider 9999 + 9999 = 19998. The highest digit is always 1.",
            mathematical_rule: "Sum Carry Bound Theorem (C_k ≤ N - 1)",
            cumulative_assignments: { M: 1 },
            revealed_carries: { "4": 1 }
          }
        ]
      });
    },

    async evaluateTutorAnswer(eq, stepIdx, digit) {
      const isCorrect = (digit === 1);
      return JSON.stringify({
        success: true,
        is_correct: isCorrect,
        target_letter: "M",
        target_digit: 1,
        selected_digit: digit,
        explanation: isCorrect ? "Spot on! Two 4-digit numbers sum to at most 19,998, forcing M = 1." : "Incorrect value for M.",
        mathematical_rule: "Sum Carry Bound",
        cumulative_assignments: isCorrect ? { M: 1 } : {}
      });
    }
  };

  let bridge = mockBridge;

  // Initialize PySide6 QWebChannel Connection
  function initBridge() {
    if (typeof qt !== "undefined" && qt.webChannelTransport) {
      new QWebChannel(qt.webChannelTransport, function (channel) {
        bridge = channel.objects.pyBridge;
        state.bridgeReady = true;
        console.log("[PySide6] Connected to native Python QWebChannel bridge.");
        showToast("Connected to PySide6 Engine", "success");
        refreshDashboard();
        solveCurrentPuzzle(true);
      });
    } else {
      console.log("[Browser] Running with simulated bridge.");
      state.bridgeReady = true;
      refreshDashboard();
      solveCurrentPuzzle(true);
    }
  }

  // Toast Notification System
  function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("show"));

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // Navigation Switching
  function setupNavigation() {
    const navItems = document.querySelectorAll(".nav-item[data-tab]");
    navItems.forEach(item => {
      item.addEventListener("click", () => {
        const targetTab = item.getAttribute("data-tab");
        switchTab(targetTab);
      });
    });
  }

  function switchTab(tabId) {
    if (state.replay.isPlaying) pauseReplay();
    state.currentTab = tabId;

    document.querySelectorAll(".nav-item").forEach(item => {
      item.classList.toggle("active", item.getAttribute("data-tab") === tabId);
    });

    document.querySelectorAll(".tab-pane").forEach(pane => {
      pane.classList.toggle("active", pane.id === `tab-${tabId}`);
    });

    if (tabId === "benchmark") {
      runBenchmark();
    } else if (tabId === "dashboard") {
      refreshDashboard();
    } else if (tabId === "challenge") {
      if (!state.challenge.active) {
        setupChallengeCards(state.challenge.equation);
      }
    } else if (tabId === "library") {
      loadCatalogue();
    } else if (tabId === "tutor") {
      initTutorSession();
    }

    if (window.AppMotion) window.AppMotion.observeAll();
  }

  // ---------------------------------------------------------
  // Studio & Solver Methods
  // ---------------------------------------------------------
  async function solveCurrentPuzzle(silent = false) {
    const input = document.getElementById("puzzle-input");
    const equation = (input ? input.value : state.currentEquation).trim();
    if (!equation) {
      if (!silent) showToast("Please enter an equation", "error");
      return;
    }

    state.currentEquation = equation;
    if (!silent) showToast("Solving cryptarithm...", "info");

    try {
      const resJson = await bridge.solvePuzzle(equation, "mrv_fc", 2);
      const res = JSON.parse(resJson);

      if (!res.success) {
        if (!silent) showToast(res.error || "Failed to solve puzzle", "error");
        renderNoSolution(res.error);
        return;
      }

      state.currentSolution = res.solutions && res.solutions[0] ? res.solutions[0] : null;
      renderStudioSolution(res);
      renderVisualizer(equation, state.currentSolution);

      // Setup Replay Engine with Frames
      if (res.replay_frames && res.replay_frames.length > 0) {
        setupReplay(res.replay_frames);
      }

      // Render Deductive Mathematical Proof
      if (res.deductive_proof && res.deductive_proof.length > 0) {
        renderDeductiveProof(res.deductive_proof);
      }

      if (!silent) {
        showToast(
          state.currentSolution
            ? `Solved in ${res.elapsed_ms} ms (${res.nodes.toLocaleString()} nodes)`
            : "No solution exists for this equation",
          state.currentSolution ? "success" : "error"
        );
      }
    } catch (err) {
      console.error(err);
      if (!silent) showToast("Error executing solver", "error");
    }
  }

  function renderVisualizer(equation, solution, highlightCol = null, activeLetter = null, carriesMap = {}) {
    const container = document.getElementById("visualizer-container");
    if (!container) return;

    if (!equation.includes("=") || !equation.includes("+")) {
      container.innerHTML = `<div style="color: var(--muted); font-size: 13px;">Enter a valid equation to visualize.</div>`;
      return;
    }

    const [left, right] = equation.split("=");
    const addends = left.split("+").map(w => w.trim().toUpperCase());
    const result = right.trim().toUpperCase();

    const maxLen = Math.max(...addends.map(w => w.length), result.length);

    let html = `<div class="arithmetic-board animate-in visible">`;

    // Carry Row
    html += `<div class="carry-row">`;
    html += `<div class="operator-cell">&nbsp;</div>`;
    for (let col = maxLen - 1; col >= 0; col--) {
      const carryVal = carriesMap[col] || "";
      const isCarryCol = highlightCol === col;
      html += `<div class="carry-cell ${carryVal ? 'carry-bubble' : ''}" style="${isCarryCol ? 'font-weight: 700; color: var(--accent);' : ''}">
                 ${carryVal !== "" ? `C=${carryVal}` : "&nbsp;"}
               </div>`;
    }
    html += `</div>`;

    // Addend Rows
    addends.forEach((word, idx) => {
      html += `<div class="word-row">`;
      html += `<div class="operator-cell">${idx === addends.length - 1 ? "+" : "&nbsp;"}</div>`;

      for (let i = 0; i < maxLen - word.length; i++) {
        html += `<div class="char-cell">&nbsp;</div>`;
      }

      for (let i = 0; i < word.length; i++) {
        const colIndex = word.length - 1 - i;
        const ch = word[i];
        const digit = solution && solution[ch] !== undefined ? solution[ch] : "";
        const isColActive = highlightCol === colIndex;
        const isLetterActive = activeLetter === ch;

        html += `
          <div class="char-cell interactive ${isColActive ? 'active-col' : ''}"
               data-letter="${ch}"
               data-col="${colIndex}"
               title="Click to inspect letter '${ch}'">
            <span style="${isLetterActive ? 'color: var(--accent); font-weight: 700;' : ''}">${ch}</span>
            <span class="char-digit ${digit !== '' ? 'digit-updated' : ''}">${digit !== "" ? digit : "·"}</span>
          </div>`;
      }
      html += `</div>`;
    });

    // Divider
    html += `<div class="arithmetic-divider"></div>`;

    // Result Row
    html += `<div class="result-row">`;
    html += `<div class="operator-cell">=</div>`;
    for (let i = 0; i < maxLen - result.length; i++) {
      html += `<div class="char-cell">&nbsp;</div>`;
    }
    for (let i = 0; i < result.length; i++) {
      const colIndex = result.length - 1 - i;
      const ch = result[i];
      const digit = solution && solution[ch] !== undefined ? solution[ch] : "";
      const isColActive = highlightCol === colIndex;
      const isLetterActive = activeLetter === ch;

      html += `
        <div class="char-cell interactive ${isColActive ? 'active-col' : ''}"
             data-letter="${ch}"
             data-col="${colIndex}">
          <span style="${isLetterActive ? 'color: var(--positive); font-weight: 700;' : ''}">${ch}</span>
          <span class="char-digit ${digit !== '' ? 'digit-updated' : ''}">${digit !== "" ? digit : "·"}</span>
        </div>`;
    }
    html += `</div>`;

    html += `</div>`;
    container.innerHTML = html;

    // Attach click inspection to letters
    container.querySelectorAll(".char-cell.interactive").forEach(cell => {
      cell.addEventListener("click", () => {
        const l = cell.getAttribute("data-letter");
        showToast(`Inspecting letter '${l}': ${solution && solution[l] !== undefined ? `Assigned digit ${solution[l]}` : 'Unassigned'}`, 'info');
      });
    });
  }

  function renderStudioSolution(res) {
    const output = document.getElementById("solver-output");
    if (!output) return;

    if (!res.solutions || res.solutions.length === 0) {
      output.innerHTML = `
        <div class="card card-raised animate-in visible" style="border-left: 4px solid var(--negative);">
          <div style="font-weight: 600; color: var(--negative); font-size: 15px;">No Solution Exists</div>
          <p style="margin-top: 6px; font-size: 13px;">No single-digit assignment (0–9) satisfies all distinct-letter and column-carry addition constraints for this equation.</p>
        </div>`;
      return;
    }

    const sol = res.solutions[0];
    let mappingHtml = `<div class="letter-cards-grid" style="margin-bottom: 20px;">`;
    Object.keys(sol).sort().forEach(ch => {
      mappingHtml += `
        <div class="letter-card assigned animate-in visible">
          <div class="letter-card-name">${ch}</div>
          <div style="font-family: var(--font-mono); font-size: 22px; font-weight: 700; color: var(--accent);">${sol[ch]}</div>
          <div class="letter-card-tag">${res.leading.includes(ch) ? "Leading ≠ 0" : "Free"}</div>
        </div>`;
    });
    mappingHtml += `</div>`;

    let stepsHtml = ``;
    if (res.steps && res.steps.length > 0) {
      stepsHtml += `
        <div class="card card-raised" style="margin-top: 16px;">
          <div class="card-title">Column-by-Column Carry Steps</div>
          <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
            ${res.steps.map(s => `<div style="font-family: var(--font-mono); font-size: 13px; color: var(--text-secondary);"><span style="color: #4ade80;">Step:</span> ${s}</div>`).join("")}
          </div>
        </div>`;
    }

    output.innerHTML = `
      <div class="card animate-in visible">
        <div class="card-header">
          <div>
            <div class="card-title">Found Solution</div>
            <div class="card-description">Explored ${res.nodes.toLocaleString()} nodes in ${res.elapsed_ms} ms</div>
          </div>
          <div class="pill pill-positive">Verified Valid</div>
        </div>
        ${mappingHtml}
        ${stepsHtml}
      </div>`;
  }

  function renderDeductiveProof(proofs) {
    const section = document.getElementById("proof-section");
    const container = document.getElementById("proof-container");
    if (!section || !container) return;

    section.style.display = "flex";
    container.innerHTML = proofs.map(p => `
      <div class="proof-card animate-in visible">
        <div class="proof-header">
          <span class="proof-stage">${p.stage}</span>
          <span class="proof-rule">${p.rule}</span>
        </div>
        <div class="proof-deduction">${p.deduction}</div>
      </div>
    `).join("");
  }

  function renderNoSolution(msg) {
    const output = document.getElementById("solver-output");
    if (!output) return;
    output.innerHTML = `
      <div class="card card-raised" style="border-left: 4px solid var(--negative);">
        <div style="font-weight: 600; color: var(--negative);">Invalid Equation</div>
        <p style="margin-top: 6px; font-size: 13px;">${msg || "Please check puzzle format."}</p>
      </div>`;
  }

  // ---------------------------------------------------------
  // Replay Controller Engine
  // ---------------------------------------------------------
  function setupReplay(frames) {
    const box = document.getElementById("replay-controller-box");
    if (!box) return;

    state.replay.frames = Array.isArray(frames) ? frames : [];
    state.replay.currentIndex = 0;
    pauseReplay();

    box.style.display = "flex";
    updateReplayUI();
  }

  function updateReplayUI() {
    if (!state.replay.frames || state.replay.frames.length === 0) return;
    const curIdx = state.replay.currentIndex;
    const totalFrames = state.replay.frames.length;
    const f = state.replay.frames[curIdx];
    if (!f) return;

    const stepText = document.getElementById("replay-step-text");
    const descText = document.getElementById("replay-description-text");
    const fill = document.getElementById("replay-progress-fill");

    if (stepText) {
      stepText.textContent = `Step ${curIdx + 1} of ${totalFrames}`;
    }

    if (descText) {
      descText.innerHTML = `<strong>${f.title}</strong>: ${f.description}`;
    }

    if (fill) {
      const pct = totalFrames > 1
        ? (curIdx / (totalFrames - 1)) * 100
        : 100;
      fill.style.width = `${pct}%`;
    }

    // Refresh visualizer with active frame state
    renderVisualizer(
      state.currentEquation,
      f.current_mapping,
      f.column_index,
      f.active_letter,
      f.carries || {}
    );
  }

  async function playReplay() {
    if (!state.replay.frames || state.replay.frames.length === 0) {
      await solveCurrentPuzzle(true);
      if (!state.replay.frames || state.replay.frames.length === 0) {
        showToast("No replay steps found for this puzzle", "error");
        return;
      }
    }

    // If at the end, restart from step 0
    if (state.replay.currentIndex >= state.replay.frames.length - 1) {
      state.replay.currentIndex = 0;
      updateReplayUI();
    }

    state.replay.isPlaying = true;
    const btn = document.getElementById("btn-replay-play");
    if (btn) {
      btn.textContent = "⏸ Pause";
      btn.classList.add("active");
    }

    if (state.replay.timerId) clearInterval(state.replay.timerId);
    state.replay.timerId = setInterval(() => {
      if (state.replay.currentIndex < state.replay.frames.length - 1) {
        state.replay.currentIndex++;
        updateReplayUI();
      } else {
        pauseReplay();
      }
    }, state.replay.speedMs);
  }

  function pauseReplay() {
    state.replay.isPlaying = false;
    const btn = document.getElementById("btn-replay-play");
    if (btn) {
      btn.textContent = "▶ Play";
      btn.classList.remove("active");
    }
    if (state.replay.timerId) {
      clearInterval(state.replay.timerId);
      state.replay.timerId = null;
    }
  }

  async function stepReplay(delta) {
    if (!state.replay.frames || state.replay.frames.length === 0) {
      await solveCurrentPuzzle(true);
      if (!state.replay.frames || state.replay.frames.length === 0) return;
    }
    pauseReplay();
    const newIdx = state.replay.currentIndex + delta;
    if (newIdx >= 0 && newIdx < state.replay.frames.length) {
      state.replay.currentIndex = newIdx;
      updateReplayUI();
    }
  }

  // ---------------------------------------------------------
  // Solve With Me: Interactive Deduction Tutor
  // ---------------------------------------------------------
  async function initTutorSession(equation = null, forceReload = false) {
    if (equation) {
      state.tutor.equation = equation;
    } else {
      const presetSelect = document.getElementById("tutor-preset-select");
      if (presetSelect && presetSelect.value) {
        state.tutor.equation = presetSelect.value;
      }
    }

    if (!forceReload && state.tutor.session && state.tutor.session.equation === state.tutor.equation) {
      renderTutorCurrentStep();
      return;
    }

    try {
      showToast("Loading Deduction Tutor...", "info");
      const resJson = await bridge.getTutorSession(state.tutor.equation);
      const res = JSON.parse(resJson);

      if (!res.success) {
        showToast(`Tutor Error: ${res.error}`, "error");
        return;
      }

      state.tutor.session = res;
      state.tutor.stepIndex = 0;
      state.tutor.score = 100;
      state.tutor.correctCount = 0;
      state.tutor.attemptsCount = 0;
      state.tutor.hintsUsed = 0;
      state.tutor.cumulativeMap = {};
      state.tutor.carries = {};
      state.tutor.stepAnswered = false;

      // Reset dialogue & completion panels
      const completionPanel = document.getElementById("tutor-completion-panel");
      if (completionPanel) completionPanel.style.display = "none";

      const dialogueActions = document.querySelector(".tutor-dialogue-actions");
      if (dialogueActions) dialogueActions.style.display = "flex";

      renderTutorCurrentStep();
    } catch (err) {
      console.error("Failed to load tutor session:", err);
      showToast("Failed to initialize Tutor", "error");
    }
  }

  function renderTutorCurrentStep() {
    const session = state.tutor.session;
    if (!session || !session.steps || session.steps.length === 0) return;

    if (state.tutor.stepIndex >= session.total_steps) {
      renderTutorCompletion();
      return;
    }

    const step = session.steps[state.tutor.stepIndex];
    state.tutor.stepAnswered = false;

    // Update Progress Bar & KPIs
    const stagePill = document.getElementById("tutor-stage-pill");
    if (stagePill) stagePill.textContent = `Step ${step.step_index + 1} of ${step.total_steps}`;

    const progressFill = document.getElementById("tutor-progress-fill");
    if (progressFill) {
      const pct = Math.round((step.step_index / step.total_steps) * 100);
      progressFill.style.width = `${pct}%`;
    }

    updateTutorChips();

    // Right Dialogue Card
    const stageTitle = document.getElementById("tutor-stage-title");
    if (stageTitle) stageTitle.textContent = step.stage_name;

    const targetVar = document.getElementById("tutor-target-var");
    if (targetVar) targetVar.innerHTML = `Deducing Variable <strong>'${step.target_letter}'</strong>`;

    const ruleTag = document.getElementById("tutor-rule-tag");
    if (ruleTag) ruleTag.textContent = step.column_name || "Rule";

    const eqContext = document.getElementById("tutor-eq-context");
    if (eqContext) eqContext.innerHTML = `<code>${step.equation_context}</code>`;

    const promptText = document.getElementById("tutor-prompt-text");
    if (promptText) promptText.textContent = step.prompt_question;

    // Reset feedback & hint boxes
    const feedbackBanner = document.getElementById("tutor-feedback");
    if (feedbackBanner) feedbackBanner.style.display = "none";

    const hintBox = document.getElementById("tutor-hint-box");
    if (hintBox) hintBox.style.display = "none";

    const nextBtn = document.getElementById("btn-tutor-next");
    if (nextBtn) nextBtn.disabled = true;

    // Render Choices Grid
    const choicesGrid = document.getElementById("tutor-choices-grid");
    if (choicesGrid) {
      choicesGrid.innerHTML = "";
      step.choices.forEach((choice, idx) => {
        const btn = document.createElement("button");
        btn.className = "tutor-choice-btn";
        btn.setAttribute("data-digit", choice.digit);
        btn.innerHTML = `
          <span class="choice-key">${idx + 1}</span>
          <span class="choice-digit-badge">${choice.text}</span>
        `;
        btn.addEventListener("click", () => handleTutorChoice(choice.digit, btn));
        choicesGrid.appendChild(btn);
      });
    }

    // Left Board: Live Arithmetic Table & Digits Bank
    renderTutorBoard(step);
    renderTutorDigitsBank();
  }

  function updateTutorChips() {
    const scoreChip = document.getElementById("tutor-score-chip");
    if (scoreChip) scoreChip.innerHTML = `Score: <strong>${state.tutor.score}</strong>`;

    const accuracyChip = document.getElementById("tutor-accuracy-chip");
    if (accuracyChip) {
      const acc = state.tutor.attemptsCount > 0
        ? Math.round((state.tutor.correctCount / state.tutor.attemptsCount) * 100)
        : 100;
      accuracyChip.innerHTML = `Accuracy: <strong>${acc}%</strong>`;
    }

    const hintsChip = document.getElementById("tutor-hints-chip");
    if (hintsChip) hintsChip.innerHTML = `Hints Used: <strong>${state.tutor.hintsUsed}</strong>`;
  }

  function renderTutorBoard(step) {
    const container = document.getElementById("tutor-visualizer");
    if (!container) return;

    const parts = state.tutor.equation.split("=");
    if (parts.length !== 2) return;
    const addends = parts[0].split("+").map(s => s.trim().toUpperCase());
    const result = parts[1].trim().toUpperCase();

    const width = Math.max(...addends.map(a => a.length), result.length);

    let html = `<table class="tutor-arithmetic-table">`;

    // Carry row
    html += `<tr class="tutor-carry-row"><td></td>`;
    for (let c = width - 1; c >= 0; c--) {
      const carryVal = step.revealed_carries && step.revealed_carries[String(c + 1)] !== undefined
        ? step.revealed_carries[String(c + 1)]
        : "";
      html += `<td>${carryVal ? `<span class="pill pill-primary" style="font-size:11px; padding:2px 6px;">C${c + 1}=${carryVal}</span>` : ""}</td>`;
    }
    html += `</tr>`;

    // Addend rows
    addends.forEach((addend, rowIdx) => {
      const pad = width - addend.length;
      html += `<tr>`;
      html += `<td style="color: var(--muted);">${rowIdx === addends.length - 1 ? "+" : ""}</td>`;
      for (let i = 0; i < pad; i++) {
        html += `<td></td>`;
      }
      for (let i = 0; i < addend.length; i++) {
        const letter = addend[i];
        const colIdx = addend.length - 1 - i;
        const isAssigned = state.tutor.cumulativeMap[letter] !== undefined;
        const isTarget = letter === step.target_letter;
        const isCol = step.column_index === colIdx;

        let classes = "tutor-cell-letter";
        if (isAssigned) classes += " assigned";
        if (isTarget) classes += " active-target";
        if (isCol) classes += " highlight-col";

        const displayVal = isAssigned ? `${letter}<sub>${state.tutor.cumulativeMap[letter]}</sub>` : letter;
        html += `<td><span class="${classes}">${displayVal}</span></td>`;
      }
      html += `</tr>`;
    });

    // Divider
    html += `<tr class="tutor-sum-divider"><td colspan="${width + 1}"></td></tr>`;

    // Result row
    const resPad = width - result.length;
    html += `<tr><td></td>`;
    for (let i = 0; i < resPad; i++) {
      html += `<td></td>`;
    }
    for (let i = 0; i < result.length; i++) {
      const letter = result[i];
      const colIdx = result.length - 1 - i;
      const isAssigned = state.tutor.cumulativeMap[letter] !== undefined;
      const isTarget = letter === step.target_letter;
      const isCol = step.column_index === colIdx;

      let classes = "tutor-cell-letter";
      if (isAssigned) classes += " assigned";
      if (isTarget) classes += " active-target";
      if (isCol) classes += " highlight-col";

      const displayVal = isAssigned ? `${letter}<sub>${state.tutor.cumulativeMap[letter]}</sub>` : letter;
      html += `<td><span class="${classes}">${displayVal}</span></td>`;
    }
    html += `</tr></table>`;

    container.innerHTML = html;

    const activeColPill = document.getElementById("tutor-active-col-pill");
    if (activeColPill) {
      activeColPill.textContent = step.column_name || "Live Columns";
    }
  }

  function renderTutorDigitsBank() {
    const bank = document.getElementById("tutor-digits-bank");
    if (!bank) return;

    bank.innerHTML = "";
    const assignedMap = state.tutor.cumulativeMap || {};
    const digitToLetter = {};
    for (const [ltr, dig] of Object.entries(assignedMap)) {
      digitToLetter[dig] = ltr;
    }

    for (let d = 0; d <= 9; d++) {
      const chip = document.createElement("div");
      const isUsed = digitToLetter[d] !== undefined;
      chip.className = `digit-chip ${isUsed ? "used" : ""}`;
      chip.innerHTML = `
        <span>${d}</span>
        ${isUsed ? `<span class="bound-letter">${digitToLetter[d]}</span>` : ""}
      `;
      bank.appendChild(chip);
    }
  }

  async function handleTutorChoice(digit, clickedBtn) {
    if (state.tutor.stepAnswered) return;

    state.tutor.attemptsCount++;
    const step = state.tutor.session.steps[state.tutor.stepIndex];

    try {
      const resJson = await bridge.evaluateTutorAnswer(state.tutor.equation, state.tutor.stepIndex, digit);
      const res = JSON.parse(resJson);

      const feedbackBanner = document.getElementById("tutor-feedback");
      const feedbackIcon = document.getElementById("tutor-feedback-icon");
      const feedbackTitle = document.getElementById("tutor-feedback-title");
      const feedbackBody = document.getElementById("tutor-feedback-body");
      const nextBtn = document.getElementById("btn-tutor-next");

      if (res.is_correct) {
        state.tutor.correctCount++;
        state.tutor.stepAnswered = true;
        state.tutor.score += 25;

        clickedBtn.classList.add("correct");

        // Disable other choices
        document.querySelectorAll(".tutor-choice-btn").forEach(btn => {
          if (btn !== clickedBtn) btn.disabled = true;
        });

        // Update cumulative map
        state.tutor.cumulativeMap[step.target_letter] = step.target_digit;

        if (feedbackBanner) {
          feedbackBanner.className = "tutor-feedback-banner feedback-success";
          feedbackBanner.style.display = "flex";
          if (feedbackIcon) feedbackIcon.textContent = "✓";
          if (feedbackTitle) feedbackTitle.textContent = "Brilliant Deduction!";
          if (feedbackBody) feedbackBody.textContent = res.explanation;
        }

        if (nextBtn) nextBtn.disabled = false;

        renderTutorBoard(step);
        renderTutorDigitsBank();
        updateTutorChips();
        showToast(`Correct: ${step.target_letter} = ${step.target_digit}`, "success");
      } else {
        clickedBtn.classList.add("incorrect");
        state.tutor.score = Math.max(0, state.tutor.score - 10);

        if (feedbackBanner) {
          feedbackBanner.className = "tutor-feedback-banner feedback-error";
          feedbackBanner.style.display = "flex";
          if (feedbackIcon) feedbackIcon.textContent = "✕";
          if (feedbackTitle) feedbackTitle.textContent = "Constraint Contradiction";
          if (feedbackBody) feedbackBody.textContent = res.explanation;
        }

        updateTutorChips();
        showToast("Incorrect deduction. Read feedback and try again.", "error");
      }
    } catch (err) {
      console.error("Error evaluating tutor step:", err);
      showToast("Evaluation failed", "error");
    }
  }

  function revealTutorHint() {
    const session = state.tutor.session;
    if (!session || state.tutor.stepIndex >= session.total_steps) return;

    const step = session.steps[state.tutor.stepIndex];
    state.tutor.hintsUsed++;
    state.tutor.score = Math.max(0, state.tutor.score - 5);
    updateTutorChips();

    const hintBox = document.getElementById("tutor-hint-box");
    const hintText = document.getElementById("tutor-hint-text");
    if (hintBox && hintText) {
      hintText.textContent = step.hint_text;
      hintBox.style.display = "flex";
    }

    showToast("Hint revealed (-5 pts)", "info");
  }

  function nextTutorStep() {
    state.tutor.stepIndex++;
    state.tutor.stepAnswered = false;
    renderTutorCurrentStep();
  }

  function renderTutorCompletion() {
    const progressFill = document.getElementById("tutor-progress-fill");
    if (progressFill) progressFill.style.width = "100%";

    const stagePill = document.getElementById("tutor-stage-pill");
    if (stagePill) stagePill.textContent = "Completed 100%";

    const promptText = document.getElementById("tutor-prompt-text");
    if (promptText) promptText.textContent = "You have proven every single letter assignment using formal constraint propagation.";

    const choicesGrid = document.getElementById("tutor-choices-grid");
    if (choicesGrid) choicesGrid.innerHTML = "";

    const feedbackBanner = document.getElementById("tutor-feedback");
    if (feedbackBanner) feedbackBanner.style.display = "none";

    const hintBox = document.getElementById("tutor-hint-box");
    if (hintBox) hintBox.style.display = "none";

    const dialogueActions = document.querySelector(".tutor-dialogue-actions");
    if (dialogueActions) dialogueActions.style.display = "none";

    const completionPanel = document.getElementById("tutor-completion-panel");
    if (completionPanel) {
      completionPanel.style.display = "block";
      const metricsContainer = document.getElementById("tutor-completion-metrics");
      if (metricsContainer) {
        const acc = state.tutor.attemptsCount > 0
          ? Math.round((state.tutor.correctCount / state.tutor.attemptsCount) * 100)
          : 100;
        metricsContainer.innerHTML = `
          <div class="metric-pill">Final Score: <strong>${state.tutor.score}</strong></div>
          <div class="metric-pill">Deduction Accuracy: <strong>${acc}%</strong></div>
          <div class="metric-pill">Hints Used: <strong>${state.tutor.hintsUsed}</strong></div>
        `;
      }
    }

    try {
      bridge.recordAttempt(
        state.tutor.equation,
        true,
        "Tutorial",
        "tutor",
        "Completed guided deduction tutorial with full proofs.",
        0
      );
    } catch (e) {
      console.warn("Failed recording tutor completion:", e);
    }

    showToast("🎉 Cryptarithm Mastered! All letters proven.", "success");
  }

  // ---------------------------------------------------------
  // Timed Letter-Card Challenge Mode
  // ---------------------------------------------------------
  function setupChallengeCards(equation) {
    const container = document.getElementById("challenge-cards-container");
    if (!container) return;

    const letters = Array.from(new Set(equation.replace(/[^A-Z]/g, "")));
    state.challenge.userMap = {};
    state.challenge.hintsUsed = 0;

    let html = ``;
    letters.forEach((ch, idx) => {
      html += `
        <div class="letter-card animate-in visible" id="card-${ch}">
          <div class="letter-card-name">${ch}</div>
          <input type="text"
                 maxlength="1"
                 pattern="[0-9]"
                 class="letter-card-input"
                 id="input-${ch}"
                 data-letter="${ch}"
                 tabindex="${idx + 1}"
                 placeholder="·" />
          <div class="letter-card-tag">Digit (0–9)</div>
        </div>`;
    });

    container.innerHTML = html;

    const inputs = container.querySelectorAll(".letter-card-input");
    inputs.forEach((input, index) => {
      input.addEventListener("input", (e) => {
        const val = e.target.value.replace(/[^0-9]/g, "");
        e.target.value = val;
        const letter = e.target.getAttribute("data-letter");
        state.challenge.userMap[letter] = val ? parseInt(val, 10) : undefined;

        if (val && index < inputs.length - 1) {
          inputs[index + 1].focus();
          inputs[index + 1].select();
        }
      });

      input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !e.target.value && index > 0) {
          inputs[index - 1].focus();
        } else if (e.key === "ArrowRight" && index < inputs.length - 1) {
          inputs[index + 1].focus();
        } else if (e.key === "ArrowLeft" && index > 0) {
          inputs[index - 1].focus();
        }
      });

      input.addEventListener("focus", () => {
        document.querySelectorAll(".letter-card").forEach(c => c.classList.remove("focused"));
        const parent = input.closest(".letter-card");
        if (parent) parent.classList.add("focused");
      });
    });
  }

  function startChallenge() {
    const diffSelect = document.getElementById("challenge-difficulty");
    const diff = diffSelect ? diffSelect.value : "Easy";
    state.challenge.difficulty = diff;

    const seconds = { Easy: 300, Medium: 600, Hard: 1800 }[diff] || 300;
    state.challenge.durationSeconds = seconds;
    state.challenge.remainingSeconds = seconds;
    state.challenge.active = true;
    state.challenge.deadline = Date.now() + seconds * 1000;
    state.challenge.hintsUsed = 0;

    const eqInput = document.getElementById("challenge-equation");
    const equation = (eqInput ? eqInput.value : state.challenge.equation).trim();
    state.challenge.equation = equation;

    setupChallengeCards(equation);

    const btnStart = document.getElementById("btn-start-challenge");
    const btnSubmit = document.getElementById("btn-submit-challenge");
    const btnHint = document.getElementById("btn-get-hint");
    if (btnStart) btnStart.disabled = true;
    if (btnSubmit) btnSubmit.disabled = false;
    if (btnHint) btnHint.disabled = false;

    const firstInput = document.querySelector(".letter-card-input");
    if (firstInput) {
      firstInput.focus();
      firstInput.select();
    }

    if (state.challenge.timerId) clearInterval(state.challenge.timerId);
    state.challenge.timerId = setInterval(updateTimerHUD, 1000);
    updateTimerHUD();

    showToast(`${diff} challenge started! Clock is ticking.`, "info");
  }

  function updateTimerHUD() {
    const timerVal = document.getElementById("timer-value");
    const circle = document.getElementById("timer-progress");
    const hud = document.getElementById("timer-hud");

    const remaining = Math.max(0, Math.ceil((state.challenge.deadline - Date.now()) / 1000));
    state.challenge.remainingSeconds = remaining;

    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const timeStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

    if (timerVal) timerVal.textContent = timeStr;

    if (circle) {
      const frac = remaining / state.challenge.durationSeconds;
      const offset = 201 * (1 - frac);
      circle.style.strokeDashoffset = offset;

      circle.classList.toggle("warning", remaining <= 60 && remaining > 20);
      circle.classList.toggle("danger", remaining <= 20);
    }

    if (hud) {
      hud.classList.toggle("timer-pulsing", remaining <= 30 && remaining > 0);
    }

    if (remaining === 0 && state.challenge.active) {
      finishChallenge(false, "Time expired!");
    }
  }

  async function getChallengeHint() {
    if (!state.challenge.active) return;

    try {
      const resJson = await bridge.getHint(state.challenge.equation, JSON.stringify(state.challenge.userMap));
      const res = JSON.parse(resJson);

      if (!res.success || !res.hint) {
        showToast(res.message || "No hint available.", "info");
        return;
      }

      const h = res.hint;
      state.challenge.hintsUsed++;

      // Fill in hinted digit
      const input = document.getElementById(`input-${h.letter}`);
      const card = document.getElementById(`card-${h.letter}`);

      if (input && card) {
        input.value = h.digit;
        state.challenge.userMap[h.letter] = h.digit;
        card.classList.add("hint-active");
        setTimeout(() => card.classList.remove("hint-active"), 2800);
      }

      const hintPill = document.getElementById("challenge-hints-used");
      if (hintPill) {
        hintPill.style.display = "inline-flex";
        hintPill.textContent = `${state.challenge.hintsUsed} Hint${state.challenge.hintsUsed > 1 ? 's' : ''} Used`;
      }

      showToast(`Hint: '${h.letter}' = ${h.digit} (${h.reason})`, "info");
    } catch (e) {
      console.error(e);
    }
  }

  async function submitChallenge() {
    if (!state.challenge.active) {
      showToast("Start the challenge first", "error");
      return;
    }

    const map = state.challenge.userMap;
    const missing = Object.values(map).some(v => v === undefined || v === null || isNaN(v));

    if (missing) {
      showToast("Please enter a digit on every letter card", "error");
      const grid = document.getElementById("challenge-cards-container");
      if (grid) {
        grid.classList.add("shake");
        setTimeout(() => grid.classList.remove("shake"), 400);
      }
      return;
    }

    try {
      const resJson = await bridge.checkAnswer(state.challenge.equation, JSON.stringify(map));
      const res = JSON.parse(resJson);

      finishChallenge(res.is_valid, res.reason, res);
    } catch (e) {
      console.error(e);
      showToast("Error checking answer", "error");
    }
  }

  async function finishChallenge(solved, reason, checkResult) {
    state.challenge.active = false;
    if (state.challenge.timerId) {
      clearInterval(state.challenge.timerId);
      state.challenge.timerId = null;
    }

    const btnStart = document.getElementById("btn-start-challenge");
    const btnSubmit = document.getElementById("btn-submit-challenge");
    const btnHint = document.getElementById("btn-get-hint");
    if (btnStart) btnStart.disabled = false;
    if (btnSubmit) btnSubmit.disabled = true;
    if (btnHint) btnHint.disabled = true;

    const elapsed = state.challenge.durationSeconds - state.challenge.remainingSeconds;

    await bridge.recordAttempt(
      state.challenge.equation,
      solved,
      state.challenge.difficulty,
      "challenge",
      reason,
      elapsed
    );

    const resultBox = document.getElementById("challenge-result-box");
    if (resultBox) {
      resultBox.innerHTML = `
        <div class="card ${solved ? 'celebration-banner' : ''} animate-in visible" style="border-left: 4px solid ${solved ? "var(--positive)" : "var(--negative)"};">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="font-size: 18px; font-weight: 700; color: ${solved ? "var(--positive)" : "var(--negative)"};">
              ${solved ? "Challenge Completed" : "Incorrect Assignment"}
            </div>
            <div class="pill ${solved ? "pill-positive" : "pill-negative"}">${elapsed}s elapsed</div>
          </div>
          <p style="margin-top: 8px;">${reason}</p>
        </div>`;
    }

    showToast(solved ? "Congratulations! Solved successfully!" : "Challenge attempt finished.", solved ? "success" : "error");
    refreshDashboard();
  }

  // ---------------------------------------------------------
  // Classics Library Catalogue
  // ---------------------------------------------------------
  async function loadCatalogue() {
    const container = document.getElementById("catalogue-container");
    if (!container) return;

    try {
      const resJson = await bridge.getCatalogue();
      const res = JSON.parse(resJson);

      if (!res.success || !res.catalogue) return;

      container.innerHTML = res.catalogue.map(item => `
        <div class="catalogue-card animate-in visible">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div class="catalogue-card-title">${item.title}</div>
            <span class="pill pill-${item.difficulty.toLowerCase()}">${item.difficulty}</span>
          </div>
          <div class="catalogue-card-author">${item.author} · ${item.letters_count} letters</div>
          <div class="catalogue-card-desc">${item.description}</div>
          <div class="catalogue-card-footer">
            <button class="btn btn-secondary btn-sm" onclick="window.loadClassic('${item.title}', 'studio')">Load in Studio</button>
            <button class="btn btn-primary btn-sm" onclick="window.loadClassic('${item.title}', 'challenge')">Play Challenge</button>
          </div>
        </div>
      `).join("");
    } catch (e) {
      console.error(e);
    }
  }

  window.loadClassic = function(equation, target) {
    if (target === "studio") {
      const input = document.getElementById("puzzle-input");
      if (input) input.value = equation;
      state.currentEquation = equation;
      switchTab("studio");
      solveCurrentPuzzle();
    } else {
      const input = document.getElementById("challenge-equation");
      if (input) input.value = equation;
      state.challenge.equation = equation;
      switchTab("challenge");
      startChallenge();
    }
  };

  // ---------------------------------------------------------
  // Research Benchmark Laboratory
  // ---------------------------------------------------------
  async function runBenchmark() {
    const input = document.getElementById("benchmark-equation");
    const equation = (input ? input.value : state.currentEquation).trim();
    if (!equation) return;

    const chartContainer = document.getElementById("benchmark-chart");
    const cardsContainer = document.getElementById("benchmark-cards");
    const insightBox = document.getElementById("benchmark-insight");

    if (chartContainer) {
      chartContainer.innerHTML = `<div style="padding: 24px; color: var(--muted);" class="loading-shimmer">Running comparative benchmark algorithms...</div>`;
    }

    try {
      const resJson = await bridge.compareStrategies(equation);
      const res = JSON.parse(resJson);

      if (!res.success) {
        showToast(res.error || "Benchmark failed", "error");
        return;
      }

      const data = res.data;

      if (chartContainer && window.Charts) {
        window.Charts.renderBenchmarkBars(chartContainer, data.results);
      }

      if (cardsContainer) {
        cardsContainer.innerHTML = data.results.map((r, i) => `
          <div class="strategy-card ${r.strategy === 'mrv_fc' ? 'highlight' : ''} animate-in visible">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="font-weight: 600; font-size: 15px;">${r.label}</div>
              ${r.search_pruning_pct > 0 ? `<div class="pill pill-positive">-${r.search_pruning_pct}% Nodes</div>` : `<div class="pill pill-neutral">Baseline</div>`}
            </div>
            <div class="metric-row" style="margin-top: 6px;">
              <span class="metric-name">Node Expansions</span>
              <span class="metric-val">${r.nodes.toLocaleString()}</span>
            </div>
            <div class="metric-row">
              <span class="metric-name">Backtracks</span>
              <span class="metric-val">${r.backtracks.toLocaleString()}</span>
            </div>
            <div class="metric-row">
              <span class="metric-name">Execution Time</span>
              <span class="metric-val" style="color: ${r.elapsed_ms < 100 ? 'var(--positive)' : 'var(--text)'};">${r.elapsed_ms} ms</span>
            </div>
          </div>
        `).join("");
      }

      if (insightBox) {
        insightBox.innerHTML = `
          <div class="card card-raised animate-in visible" style="border-left: 4px solid var(--accent);">
            <div style="font-weight: 600; color: var(--accent);">Research Analysis</div>
            <p style="margin-top: 6px; font-size: 13px;">${data.insight}</p>
          </div>`;
      }
    } catch (e) {
      console.error(e);
      showToast("Error running benchmark", "error");
    }
  }

  // ---------------------------------------------------------
  // Learning & Progress Dashboard
  // ---------------------------------------------------------
  async function refreshDashboard() {
    try {
      const resJson = await bridge.getAnalytics();
      const res = JSON.parse(resJson);

      if (!res.success) return;
      const d = res.data;
      state.analytics = d;

      const elAttempts = document.getElementById("kpi-attempts");
      const elSolved = document.getElementById("kpi-solved");
      const elAccuracy = document.getElementById("kpi-accuracy");
      const elStreak = document.getElementById("kpi-streak");
      const elLevel = document.getElementById("kpi-level");

      if (elAttempts) elAttempts.textContent = d.total_attempts;
      if (elSolved) elSolved.textContent = d.solved_count;
      if (elAccuracy) elAccuracy.textContent = `${d.accuracy_pct}%`;
      if (elStreak) elStreak.textContent = `${d.current_streak} (Best: ${d.best_streak})`;
      if (elLevel) elLevel.textContent = d.suggested_difficulty;

      const timelineChart = document.getElementById("dashboard-timeline-chart");
      if (timelineChart && window.Charts) {
        window.Charts.renderAccuracyTimeline(timelineChart, d.timeline);
      }

      const historyBody = document.getElementById("history-table-body");
      if (historyBody) {
        if (!d.recent_history || d.recent_history.length === 0) {
          historyBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--muted); padding: 24px;">No session history yet. Complete practice puzzles to populate.</td></tr>`;
        } else {
          historyBody.innerHTML = d.recent_history.map(row => `
            <tr>
              <td class="mono" style="color: var(--muted);">${row.time.replace("T", " ")}</td>
              <td class="mono" style="font-weight: 600; color: var(--text);">${row.equation}</td>
              <td><span class="pill pill-${row.difficulty.toLowerCase()}">${row.difficulty}</span></td>
              <td>
                <span class="pill ${row.solved ? 'pill-positive' : 'pill-negative'}">
                  ${row.solved ? 'Solved' : 'Incomplete'}
                </span>
              </td>
              <td style="font-size: 13px;">${row.reason || row.source}</td>
            </tr>
          `).join("");
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function clearAllHistory() {
    if (!confirm("Are you sure you want to clear your learning history?")) return;
    await bridge.clearHistory();
    showToast("Learning history reset", "info");
    refreshDashboard();
  }

  // Bind All Event Handlers
  function bindEvents() {
    setupNavigation();

    // Studio Events
    const btnSolve = document.getElementById("btn-solve");
    if (btnSolve) btnSolve.addEventListener("click", solveCurrentPuzzle);

    const btnGenEasy = document.getElementById("btn-gen-easy");
    if (btnGenEasy) btnGenEasy.addEventListener("click", () => generateStudioPuzzle("Easy"));

    const btnGenMed = document.getElementById("btn-gen-med");
    if (btnGenMed) btnGenMed.addEventListener("click", () => generateStudioPuzzle("Medium"));

    const btnGenHard = document.getElementById("btn-gen-hard");
    if (btnGenHard) btnGenHard.addEventListener("click", () => generateStudioPuzzle("Hard"));

    const btnRecordSolved = document.getElementById("btn-record-solved");
    if (btnRecordSolved) btnRecordSolved.addEventListener("click", () => recordSelfPractice(true));

    const btnRecordNeedsWork = document.getElementById("btn-record-needswork");
    if (btnRecordNeedsWork) btnRecordNeedsWork.addEventListener("click", () => recordSelfPractice(false));

    // Replay Player Controls
    const btnReplayPlay = document.getElementById("btn-replay-play");
    if (btnReplayPlay) {
      btnReplayPlay.addEventListener("click", () => {
        if (state.replay.isPlaying) pauseReplay();
        else playReplay();
      });
    }

    const btnReplayPrev = document.getElementById("btn-replay-prev");
    if (btnReplayPrev) btnReplayPrev.addEventListener("click", () => stepReplay(-1));

    const btnReplayNext = document.getElementById("btn-replay-next");
    if (btnReplayNext) btnReplayNext.addEventListener("click", () => stepReplay(1));

    const btnReplayFirst = document.getElementById("btn-replay-first");
    if (btnReplayFirst) {
      btnReplayFirst.addEventListener("click", async () => {
        if (!state.replay.frames || state.replay.frames.length === 0) {
          await solveCurrentPuzzle(true);
        }
        pauseReplay();
        state.replay.currentIndex = 0;
        updateReplayUI();
      });
    }

    const btnReplayLast = document.getElementById("btn-replay-last");
    if (btnReplayLast) {
      btnReplayLast.addEventListener("click", async () => {
        if (!state.replay.frames || state.replay.frames.length === 0) {
          await solveCurrentPuzzle(true);
        }
        pauseReplay();
        state.replay.currentIndex = Math.max(0, state.replay.frames.length - 1);
        updateReplayUI();
      });
    }

    const progressBar = document.getElementById("replay-progress-bar");
    if (progressBar) {
      progressBar.addEventListener("click", async (e) => {
        if (!state.replay.frames || state.replay.frames.length === 0) {
          await solveCurrentPuzzle(true);
        }
        if (!state.replay.frames || state.replay.frames.length === 0) return;
        const rect = progressBar.getBoundingClientRect();
        const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const targetIdx = Math.round(frac * (state.replay.frames.length - 1));
        pauseReplay();
        state.replay.currentIndex = targetIdx;
        updateReplayUI();
      });
    }

    // Speed Controls
    const btnSpeedSlow = document.getElementById("btn-speed-slow");
    const btnSpeedNorm = document.getElementById("btn-speed-normal");
    const btnSpeedFast = document.getElementById("btn-speed-fast");
    if (btnSpeedSlow && btnSpeedNorm && btnSpeedFast) {
      btnSpeedSlow.addEventListener("click", () => {
        state.replay.speedMs = 1500;
        btnSpeedSlow.classList.add("active");
        btnSpeedNorm.classList.remove("active");
        btnSpeedFast.classList.remove("active");
        if (state.replay.isPlaying) { pauseReplay(); playReplay(); }
      });
      btnSpeedNorm.addEventListener("click", () => {
        state.replay.speedMs = 900;
        btnSpeedNorm.classList.add("active");
        btnSpeedSlow.classList.remove("active");
        btnSpeedFast.classList.remove("active");
        if (state.replay.isPlaying) { pauseReplay(); playReplay(); }
      });
      btnSpeedFast.addEventListener("click", () => {
        state.replay.speedMs = 450;
        btnSpeedFast.classList.add("active");
        btnSpeedSlow.classList.remove("active");
        btnSpeedNorm.classList.remove("active");
        if (state.replay.isPlaying) { pauseReplay(); playReplay(); }
      });
    }

    // Challenge Events
    const btnStartChallenge = document.getElementById("btn-start-challenge");
    if (btnStartChallenge) btnStartChallenge.addEventListener("click", startChallenge);

    const btnSubmitChallenge = document.getElementById("btn-submit-challenge");
    if (btnSubmitChallenge) btnSubmitChallenge.addEventListener("click", submitChallenge);

    const btnGetHint = document.getElementById("btn-get-hint");
    if (btnGetHint) btnGetHint.addEventListener("click", getChallengeHint);

    const btnGenChallenge = document.getElementById("btn-gen-challenge");
    if (btnGenChallenge) {
      btnGenChallenge.addEventListener("click", async () => {
        const diff = document.getElementById("challenge-difficulty").value;
        const resJson = await bridge.generatePuzzle(diff);
        const res = JSON.parse(resJson);
        if (res.success) {
          const input = document.getElementById("challenge-equation");
          if (input) input.value = res.equation;
          state.challenge.equation = res.equation;
          setupChallengeCards(res.equation);
          showToast(`Generated ${diff} challenge`, "info");
        }
      });
    }

    // Benchmark Events
    const btnRunBenchmark = document.getElementById("btn-run-benchmark");
    if (btnRunBenchmark) btnRunBenchmark.addEventListener("click", runBenchmark);

    // Tutor Events
    const presetSelect = document.getElementById("tutor-preset-select");
    if (presetSelect) {
      presetSelect.addEventListener("change", () => {
        initTutorSession(presetSelect.value, true);
      });
    }

    const btnTutorRestart = document.getElementById("btn-tutor-restart");
    if (btnTutorRestart) {
      btnTutorRestart.addEventListener("click", () => {
        initTutorSession(state.tutor.equation, true);
      });
    }

    const btnTutorHint = document.getElementById("btn-tutor-hint");
    if (btnTutorHint) {
      btnTutorHint.addEventListener("click", revealTutorHint);
    }

    const btnTutorNext = document.getElementById("btn-tutor-next");
    if (btnTutorNext) {
      btnTutorNext.addEventListener("click", nextTutorStep);
    }

    const btnTutorAgain = document.getElementById("btn-tutor-again");
    if (btnTutorAgain) {
      btnTutorAgain.addEventListener("click", () => {
        initTutorSession(state.tutor.equation, true);
      });
    }

    const btnTutorToChallenge = document.getElementById("btn-tutor-to-challenge");
    if (btnTutorToChallenge) {
      btnTutorToChallenge.addEventListener("click", () => {
        switchTab("challenge");
      });
    }

    // Dashboard Events
    const btnClearHistory = document.getElementById("btn-clear-history");
    if (btnClearHistory) btnClearHistory.addEventListener("click", clearAllHistory);

    // Numeric keypad
    document.querySelectorAll(".keypad-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const focused = document.querySelector(".letter-card.focused .letter-card-input");
        if (!focused) return;
        const val = btn.getAttribute("data-key");
        focused.value = val;
        focused.dispatchEvent(new Event("input"));
      });
    });

    // Keyboard Navigation for Replay Player and Tutor
    document.addEventListener("keydown", (e) => {
      const tag = document.activeElement ? document.activeElement.tagName : "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (state.currentTab === "studio") {
        if (e.code === "Space") {
          e.preventDefault();
          if (state.replay.isPlaying) pauseReplay();
          else playReplay();
        } else if (e.code === "ArrowRight") {
          e.preventDefault();
          stepReplay(1);
        } else if (e.code === "ArrowLeft") {
          e.preventDefault();
          stepReplay(-1);
        }
      } else if (state.currentTab === "tutor") {
        if (["1", "2", "3", "4"].includes(e.key)) {
          const idx = parseInt(e.key, 10) - 1;
          const choiceBtns = document.querySelectorAll(".tutor-choice-btn");
          if (choiceBtns[idx] && !choiceBtns[idx].disabled) {
            e.preventDefault();
            choiceBtns[idx].click();
          }
        } else if (e.code === "Enter" || e.code === "Space") {
          const nextBtn = document.getElementById("btn-tutor-next");
          if (nextBtn && !nextBtn.disabled) {
            e.preventDefault();
            nextBtn.click();
          }
        }
      }
    });

    // Initial load
    renderVisualizer(state.currentEquation, null);
    setupChallengeCards(state.challenge.equation);
  }

  document.addEventListener("DOMContentLoaded", () => {
    initBridge();
    bindEvents();
    if (window.AppMotion) window.AppMotion.init();
  });
})();
