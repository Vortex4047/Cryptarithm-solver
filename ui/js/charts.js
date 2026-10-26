/**
 * Pure SVG Charts Engine for Cryptarithm Lab
 * Strictly compliant with Taste Skill v2 App Screen Rules:
 * - One chart answers one question.
 * - Flat surfaces, quiet 1px gridlines, no rainbow fills or gradients.
 * - Tabular figures, legible typography.
 */

window.Charts = {
  /**
   * Render Strategy Benchmark Comparative Horizontal Bars
   */
  renderBenchmarkBars(container, results) {
    if (!container || !results || results.length === 0) return;

    const width = container.clientWidth || 540;
    const barHeight = 28;
    const gap = 34;
    const topPad = 24;
    const bottomPad = 20;
    const labelWidth = 180;
    const totalHeight = topPad + results.length * (barHeight + gap) + bottomPad;

    const maxNodes = Math.max(...results.map(r => r.nodes), 1);

    let svg = `<svg width="100%" height="${totalHeight}" viewBox="0 0 ${width} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" style="font-family: var(--font-sans);">`;

    // Faint grid lines
    const gridCols = 4;
    const chartAreaWidth = width - labelWidth - 80;
    for (let i = 0; i <= gridCols; i++) {
      const x = labelWidth + (chartAreaWidth / gridCols) * i;
      svg += `<line x1="${x}" y1="${topPad - 8}" x2="${x}" y2="${totalHeight - bottomPad}" stroke="var(--border)" stroke-width="1" />`;
    }

    results.forEach((r, idx) => {
      const y = topPad + idx * (barHeight + gap);
      const barLen = Math.max(4, (r.nodes / maxNodes) * chartAreaWidth);
      const isFastest = r.strategy === "mrv_fc";
      const barColor = isFastest ? "var(--positive)" : (r.strategy === "mrv" ? "var(--accent)" : "var(--control)");

      // Label
      svg += `<text x="${labelWidth - 12}" y="${y + 18}" text-anchor="end" fill="var(--text)" font-size="13" font-weight="500">${r.label}</text>`;

      // Bar Background Track
      svg += `<rect x="${labelWidth}" y="${y}" width="${chartAreaWidth}" height="${barHeight}" rx="4" fill="var(--raised)" />`;

      // Bar Fill
      svg += `<rect x="${labelWidth}" y="${y}" width="${barLen}" height="${barHeight}" rx="4" fill="${barColor}" class="bar-animate">
                <animate attributeName="width" from="0" to="${barLen}" dur="450ms" fill="freeze" calcMode="spline" keySplines="0.16 1 0.3 1" />
              </rect>`;

      // Node Count & Time
      const metricText = `${r.nodes.toLocaleString()} nodes · ${r.elapsed_ms} ms`;
      svg += `<text x="${labelWidth + barLen + 10}" y="${y + 18}" fill="var(--text-secondary)" font-family="var(--font-mono)" font-size="12" font-variant-numeric="tabular-nums">${metricText}</text>`;
    });

    svg += `</svg>`;
    container.innerHTML = svg;
  },

  /**
   * Render Rolling Accuracy Timeline Line Chart
   */
  renderAccuracyTimeline(container, timeline) {
    if (!container) return;

    if (!timeline || timeline.length === 0) {
      container.innerHTML = `
        <div style="height: 180px; display: flex; align-items: center; justify-content: center; color: var(--muted); font-size: 13px;">
          No practice history recorded yet. Complete a puzzle to view learning curves.
        </div>`;
      return;
    }

    const width = container.clientWidth || 600;
    const height = 180;
    const padLeft = 46;
    const padRight = 24;
    const padTop = 18;
    const padBottom = 28;

    const plotWidth = width - padLeft - padRight;
    const plotHeight = height - padTop - padBottom;

    // Y Axis levels: 0%, 50%, 100%
    let svg = `<svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="font-family: var(--font-sans);">`;

    // Horizontal grid lines
    [0, 50, 100].forEach(level => {
      const y = padTop + plotHeight - (level / 100) * plotHeight;
      svg += `<line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" stroke="var(--border)" stroke-width="1" stroke-dasharray="${level === 50 ? '3,3' : 'none'}" />`;
      svg += `<text x="${padLeft - 8}" y="${y + 4}" text-anchor="end" fill="var(--muted)" font-size="11" font-family="var(--font-mono)">${level}%</text>`;
    });

    // Compute Points
    const n = timeline.length;
    const stepX = n > 1 ? plotWidth / (n - 1) : plotWidth;

    const points = timeline.map((d, i) => {
      const x = padLeft + (n > 1 ? i * stepX : plotWidth / 2);
      const y = padTop + plotHeight - (d.accuracy / 100) * plotHeight;
      return { x, y, ...d };
    });

    // Draw Line Path
    if (points.length > 1) {
      const dPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
      svg += `<path d="${dPath}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />`;

      // Area fill underneath
      const areaPath = `${dPath} L ${points[points.length - 1].x} ${padTop + plotHeight} L ${points[0].x} ${padTop + plotHeight} Z`;
      svg += `<path d="${areaPath}" fill="var(--accent-dim)" />`;
    }

    // Draw Circles & Tooltip points
    points.forEach((p, idx) => {
      const circleColor = p.solved ? "var(--positive)" : "var(--negative)";
      svg += `<circle cx="${p.x}" cy="${p.y}" r="4" fill="${circleColor}" stroke="var(--surface)" stroke-width="2">
                <title>Attempt #${p.attempt}: ${p.equation} (${p.accuracy}%)</title>
              </circle>`;

      // X Axis label at intervals
      if (n <= 10 || idx === 0 || idx === n - 1 || idx % Math.ceil(n / 6) === 0) {
        svg += `<text x="${p.x}" y="${height - 6}" text-anchor="middle" fill="var(--muted)" font-size="11" font-family="var(--font-mono)">#${p.attempt}</text>`;
      }
    });

    svg += `</svg>`;
    container.innerHTML = svg;
  }
};
