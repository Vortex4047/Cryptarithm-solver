/**
 * Scroll and Micro-Animations Controller
 * Adheres to Taste Skill motion principles:
 * - Transform and opacity only.
 * - Staggered reveals (60-90ms).
 * - Full prefers-reduced-motion fallback.
 */

window.AppMotion = {
  observer: null,

  init() {
    // Check reduced motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll(".animate-in").forEach(el => el.classList.add("visible"));
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          // Optionally unobserve after entry
          this.observer.unobserve(entry.target);
        }
      });
    }, {
      root: document.getElementById("main-view"),
      threshold: 0.1,
      rootMargin: "0px 0px -40px 0px"
    });

    this.observeAll();
  },

  observeAll() {
    if (!this.observer) return;
    document.querySelectorAll(".animate-in:not(.visible)").forEach(el => {
      this.observer.observe(el);
    });
  },

  staggerIn(container, selector = ".card, .letter-card, .kpi-tile") {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const items = container.querySelectorAll(selector);
    items.forEach((item, i) => {
      item.classList.add("animate-in");
      item.style.transitionDelay = `${i * 50}ms`;
      requestAnimationFrame(() => item.classList.add("visible"));
    });
  },

  animateValue(element, start, end, duration = 400) {
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.textContent = end;
      return;
    }

    const range = end - start;
    let current = start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / (range || 1)));
    const startTime = performance.now();

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const val = Math.round(start + range * progress);
      element.textContent = val;
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    requestAnimationFrame(update);
  }
};
