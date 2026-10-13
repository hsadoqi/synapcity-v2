# Harmony and accent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every accent ramp's step 500 stand out 3:1 from the page in both modes (the one measured gap), and pin the accent's behaviour with tests, a browser check and docs.

**Architecture:** In `resolveTokens`, the accent source goes through the existing `adaptToMode` before its ramp is generated, exactly as the primary does. The accent role (`--accent`, `--accent-foreground`) keeps coming from `accentSurface`, unchanged. Tests extend `color-contrast.test.tsx`; the browser check extends `theme-primary.spec.ts`.

**Tech Stack:** TypeScript, Vitest (web project, run from the repo root), Playwright, `DESIGN.md`.

**Spec:** `docs/superpowers/specs/2026-10-11-harmony-and-accent-design.md`

## Global Constraints

- Change only `resolveTokens` in `apps/web/components/theme/lib/color-math.ts`. Do not touch `accentSurface`, `accentSourceFor`, `HARMONIES`, `HUE_OFFSETS`, `tokens/colors.css`, or any saved-theme field.
- No new exports, no new variable names, no new dependency.
- Run Vitest from the repository root: `pnpm exec vitest run --project web <path>`.
- The 3:1 test is written first and must be seen failing on today's code.
- Do not commit. The owner commits; report the suggested commit messages.
- Out of scope: new harmonies, per-step ramp tweaks, the `--accent` role reading ramp steps, contrast warn/block UI, secondary/neutral/base roles.

## Review Focus

1. The "None" (derived) accent adapts by the same rule: its step 500 also stands out 3:1. Task 1.
2. The accent role colours (`--accent`, `--accent-foreground`) must not change. Task 1 pins this.
3. A saved theme still round-trips: the cookie holds inputs, so no payload change. Task 1 runs the existing persistence tests.

---

### Task 1: Adapt the accent ramp per mode

**Files:**
- Modify: `apps/web/components/theme/lib/color-contrast.test.tsx`
- Modify: `apps/web/components/theme/lib/color-math.ts` (`resolveTokens`)

**Interfaces:**
- Consumes: `adaptToMode`, `accentSourceFor`, `harmonyColors`, `HARMONIES`, `resolveTokens`, `contrastRatio`, `RAMP_STEPS` (all already exported).
- Produces: unchanged signatures. `ModeTokens.accentRamp[500]` is now the adapted accent source.

- [ ] **Step 1: Write the failing tests**

In `color-contrast.test.tsx`, add `HARMONIES`, `accentSourceFor`, `adaptToMode` and `harmonyColors` to the import from `./color-math`, then append:

```tsx
/** Every harmony and every accent index for each pick, plus the derived accent (index null). */
const accentCases = grid.flatMap((pick) =>
  HARMONIES.flatMap(({ id }) => {
    const count = id === 'none' ? 1 : harmonyColors(id, pick).length;
    return Array.from({ length: count }, (_, index) => ({
      pick,
      source: accentSourceFor(pick, id, index),
    }));
  }),
);

describe('the accent', () => {
  it.each(MODES)('keeps its text at least 4.5:1 on its surface in %s mode', (mode) => {
    const failures = accentCases.filter(({ pick, source }) => {
      const { accent, accentForeground } = resolveTokens(pick, source, mode);
      return contrastRatio(accent, accentForeground) < 4.5;
    });

    expect(failures).toEqual([]);
  });

  it.each(MODES)('puts ramp step 500 at least 3:1 from the %s page', (mode) => {
    const failures = accentCases.filter(
      ({ pick, source }) =>
        contrastRatio(
          resolveTokens(pick, source, mode).accentRamp[500],
          PAGE[mode],
        ) < 3,
    );

    expect(failures).toEqual([]);
  });

  it.each(MODES)('runs its ramp monotonically in lightness in %s mode', (mode) => {
    const sign = mode === 'light' ? -1 : 1;
    const failures = accentCases.filter(({ pick, source }) => {
      const ramp = resolveTokens(pick, source, mode).accentRamp;
      const lightness = RAMP_STEPS.map((step) => ramp[step].l);
      return lightness.some(
        (l, i) => i > 0 && sign * (l - lightness[i - 1]!) < -1e-9,
      );
    });

    expect(failures).toEqual([]);
  });

  it.each(MODES)('makes step 500 the adapted accent source in %s mode', (mode) => {
    for (const { pick, source } of accentCases.slice(0, 400)) {
      const tokens = resolveTokens(pick, source, mode);
      const derived = { ...tokens.primary, c: tokens.primary.c * 0.5 };

      expect(tokens.accentRamp[500]).toEqual(
        adaptToMode(source ?? derived, mode),
      );
    }
  });

  it.each(MODES)('leaves the accent role colours as they were in %s mode', (mode) => {
    // The role is a quiet surface at fixed lightness (chroma only varies); adapting the ramp
    // must not move it.
    const lightness = mode === 'light' ? { surface: 0.95, text: 0.3 } : { surface: 0.3, text: 0.95 };
    for (const { pick, source } of accentCases.slice(0, 400)) {
      const { accent, accentForeground } = resolveTokens(pick, source, mode);

      expect(accent.l).toBeCloseTo(lightness.surface, 6);
      expect(accentForeground.l).toBeCloseTo(lightness.text, 6);
    }
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm exec vitest run --project web apps/web/components/theme/lib/color-contrast.test.tsx`
Expected: FAIL on "puts ramp step 500 at least 3:1 from the light page" and "…dark page" (the measured 1.27:1 / 1.02:1), and on "makes step 500 the adapted accent source". The text-pair, monotonic and role tests pass already. If the 3:1 tests pass, stop: the premise is wrong.

- [ ] **Step 3: Write the minimal implementation**

In `resolveTokens`, change the accent ramp line from

```ts
    accentRamp: ramp(accentSource ?? { ...mine, c: mine.c * 0.5 }),
```

to

```ts
    accentRamp: ramp(
      adaptToMode(accentSource ?? { ...mine, c: mine.c * 0.5 }, mode),
    ),
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm exec vitest run --project web apps/web/components/theme`
Expected: PASS for the whole theme folder (existing ramp, persistence and colors-section tests included). If a test fails because it pinned an unadapted accent ramp value, update that expectation and note it as a ruling in the report; do not weaken the new tests.

- [ ] **Step 5: Leave uncommitted**

Suggested message: `fix: adapt the accent ramp to each mode so step 500 stands out`

---

### Task 2: Browser check for the accent

**Files:**
- Modify: `apps/web/tests/theme-primary.spec.ts`

**Interfaces:**
- Consumes: `resolveTokens`, `accentSourceFor`, `toCss`, `Oklch` from `../components/theme/lib/color-math`.

- [ ] **Step 1: Write the test**

Import `accentSourceFor` alongside the existing imports, then append:

```ts
const accentPrefs = encodeURIComponent(
  JSON.stringify({
    v: 1,
    colors: {
      primary: PICK,
      preset: 'custom',
      harmony: 'triadic',
      accentIndex: 1,
    },
  }),
);

for (const mode of ['light', 'dark'] as const) {
  test(`a saved accent is ramp step 500 in ${mode} mode`, async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({ colorScheme: mode });
    await context.addCookies([
      { name: 'theme-prefs', value: accentPrefs, url: baseURL! },
      { name: 'theme', value: mode, url: baseURL! },
    ]);
    const page = await context.newPage();
    await page.goto('/home');
    await expect(page.locator('html')).toHaveClass(new RegExp(`\\b${mode}\\b`));

    const source = accentSourceFor(PICK, 'triadic', 1);
    const expected = toCss(resolveTokens(PICK, source, mode).accentRamp[500]);
    const colours = await page.evaluate(
      ({ expected }) => {
        const resolve = (value: string) => {
          const probe = document.createElement('div');
          probe.style.backgroundColor = value;
          document.body.appendChild(probe);
          const result = getComputedStyle(probe).backgroundColor;
          probe.remove();
          return result;
        };
        return {
          expected: resolve(expected),
          step500: resolve('var(--accent-500)'),
          tailwindStep500: resolve('var(--color-accent-500)'),
        };
      },
      { expected },
    );

    expect(colours.step500).toBe(colours.expected);
    expect(colours.tailwindStep500).toBe(colours.expected);
    await context.close();
  });
}
```

- [ ] **Step 2: Check it compiles and lints**

Run: `pnpm exec tsc --noEmit -p apps/web && pnpm exec eslint apps/web/tests/theme-primary.spec.ts`
Expected: no output. Playwright itself needs a browser: if the sandbox cannot launch one, report "not run" and leave it to the owner's `pnpm test:smoke`.

- [ ] **Step 3: Leave uncommitted**

Suggested message: `test: pin the saved accent as ramp step 500 in the browser`

---

### Task 3: Document the accent

**Files:**
- Modify: `DESIGN.md` (the Accent bullet under "Themed roles")

- [ ] **Step 1: Replace the Accent bullet**

Replace

```
- **Accent** (default: same ramp): hover and selected surfaces (`sidebar-accent`). Themeable like primary.
```

with

```
- **Accent** (default: same ramp): hover and selected surfaces (`sidebar-accent`). Themeable like primary: it is chosen from the harmony of the primary, or derived quietly from the primary ("None"). The surface and its text are a quiet pair held at least 4.5:1 by construction. The accent also has a 50-950 ramp (`--accent-50` to `--accent-950`, usable as `bg-accent-500`); step 500 is the accent adapted to stand out 3:1 from each mode's page, and dark mode uses the mirrored ramp.
```

- [ ] **Step 2: Check the docs**

Run: `pnpm docs:check`
Expected: pass.

- [ ] **Step 3: Leave uncommitted**

Suggested message: `docs: describe the accent role and ramp in DESIGN.md`

---

### Task 4: Repository checks and report

- [ ] **Step 1: Run the checks that can run here**

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm deps
pnpm deps:boundaries
pnpm docs:check
```

Expected: pass. Report any pre-existing failure separately.

- [ ] **Step 2: Report**

State: what changed (one line in `resolveTokens`, tests, browser check, docs); the failing-first evidence for the 3:1 test with the observed ratios; checks run and results; checks not run (`pnpm test:storybook`, `pnpm test:smoke`/Playwright if a browser cannot launch, the manual accent check); that the accent ramp values of every non-default theme change (role colours do not); and what stays undecided (new harmonies, per-step ramp tweaks, secondary/neutral/base roles).

---

## Self-review

- **Spec coverage:** decision 1 → Task 1; decision 2 (keep quiet surface) → Task 1's role test and the Global Constraints; decision 4 (tests, browser) → Tasks 1–2; decision 5 (docs) → Task 3; the derived-accent resolution → Task 1 (cases include `none`, which yields `null`) and Review Focus 1.
- **Placeholders:** none.
- **Type consistency:** `adaptToMode`, `accentSourceFor`, `harmonyColors`, `HARMONIES`, `resolveTokens`, `RAMP_STEPS`, `contrastRatio`, `toCss` are used with the signatures in `color-math.ts`.
