
# RobuxCalc Agent Guidelines :brain:

### Primary Objective
This project is a **sleek, modern, single-page application** for Roblox developers to calculate earnings (DevEx) and tax.
Stack: **Vanilla HTML5, CSS3, JavaScript (ES6+)**. No build steps. No frameworks.

---

## Workflow Orchestration

### 1. Plan Mode Default
* **Strict Vanilla**: Avoid suggesting React/Next.js/TS unless explicitly requested. Respect the `script.js` + `style.css` architecture.
* **Math Logic**: Before ANY logic change, verify the constants in `script.js`:
  * `TAX_RATE = 0.30` (Seller gets 70%)
  * `OLD_RATE_PER_100K = 350` (Legacy rate)
  * `NEW_RATE_PER_100K = 380` (Standard rate)
* **API Dependencies**: Ensure `fetchEurRate` handles network failures gracefully (fallback to `FALLBACK_EUR_RATE`).

### 2. Subagent Strategy
* **Browser Testing**: Use `browser_subagent` to verify UI responsiveness, especially the particle background and "pop" animations.
* **Complex Refactors**: If refactoring `script.js`, verify `devexState` and `taxState` management remains atomic.

### 3. Self-Improvement Loop
* **API Rate Limiting**: If `api.exchangerate-api.com` fails, verify if it's rate-limited or down. Document findings in `lessons.md`.
* **Visual Regression**: If a CSS change breaks mobile view, fix it immediately and note the responsive breakpoint (`@media (max-width: 480px)`).

### 4. Verification Before Done
* **Console Check**: Ensure zero console errors on load.
* **Math Check**: Verify 100k Robux -> $350/$380. Verify 100 R$ Tax -> Seller gets 70 R$.
* **Visual Check**: Ensure the particle canvas covers the full viewport (`resizeCanvas()`).

### 5. Demand Elegance (Pixel Perfect)
* **Aesthetic**: Maintain the "sleek, modern" look. Use `var(--bg-primary)`, `var(--text-secondary)`, `var(--accent-color)` from `style.css`.
* **No Default Styles**: Do not introduce unstyled elements. Every button needs hover states and transitions.
* **Performance**: Keep `animateParticles()` optimized (e.g., limit particle count based on screen size).

### 6. Autonomous Bug Fixing
* **Fix Forward**: If a calculation is wrong, fix the formula in `calculateDevex()` or `calculateTax()` directly.
* **Input Validation**: Ensure `numbersOnly()` prevents invalid characters in input fields.
* **Context**: Use `console.log` sparingly for debugging, remove before final commit.

---

## Task Management

1. **Plan First**: Use `task.md` (Artifact) to outline changes.
2. **Verify Plan**: Check feasibility with vanilla JS constraints.
3. **Track Progress**: Update task status granularly.
4. **Explain Changes**: Summarize logic updates clearly in messages.
5. **Document Results**: Update `walkthrough.md` with screenshots for UI changes.

---

## Core Principles

* **Simplicity First**: Pure JS. Clean DOM manipulation. No jQuery.
* **Client-Side Only**: All logic runs in the browser. Respect user privacy.
* **Responsive Design**: Mobile-first approach. Flexbox layouts must wrap gracefully.
