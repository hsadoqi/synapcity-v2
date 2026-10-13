# Harmony and accent — design

**Status:** Draft for review. Not authoritative: it records a proposed design and approves nothing under `AGENTS.md` §5.
**Date:** 2026-10-11
**Source:** `docs/theme-tasks.md` ("Harmony" and "Accent Colors"), sub-projects D and E of five (A mode provider and B store are done; C primary ramp is done apart from the items its spec leaves out).
**Governing records:** ADR-0016 (Proposed), `DESIGN.md` ("Themed roles").

## Purpose

Harmony and accent already work end to end. This design closes the gaps the task list asks for that the code does not yet meet, and pins the rest with tests so they cannot regress.

## What already exists

| Task-list item | State | Where |
| --- | --- | --- |
| Harmonious palette from the primary (complementary, analogous, triadic and others) | Done: seven options, `none` default behavior, gamut-fitted | `HARMONIES`, `harmonyColors` in `color-math.ts` |
| Accent chosen from the palette; "None" derives a quiet accent | Done | `accentSourceFor`, `AccentGroup` |
| Accent ramp 50–950, generated client-side, injected as `--accent-50…950` | Done; `--color-accent-*` maps them for Tailwind | `rampVariables`, `tokens/colors.css`, `globals.css` |
| Light and dark handling | Done for the role; the ramp is mirrored in dark | `resolveTokens`, `mirrorRamp` |
| Persisted with the theme, restored without a flash | Done: harmony and accent index are in the `theme-prefs` cookie and rendered in the first HTML | `persisted-theme.ts` |
| Defaults | Done: blue, analogous, accent 1 | `ColorsProvider` |
| Guided Primary → Harmony → Accent flow | Done | `colors-section.tsx` and its plan |

## Measured

A sweep of the real code (16 lightness × 9 chroma × 12 hue primaries, every harmony and every accent index; 32,832 combinations per mode):

- **The accent's text on its surface is safe.** The lowest `accent-foreground` on `accent` contrast is **11.5:1** (light) and **11.6:1** (dark). No combination is below 4.5:1, so no fix is needed there.
- **The accent ramp is not adapted to the mode.** The primary is moved only as far as needed to stand out 3:1 from the page (`adaptToMode`); the accent ramp is generated from the raw source colour. Step 500 of the accent ramp can sit as low as **1.27:1** (light) and **1.02:1** (dark) against the page, so `bg-accent-500` can be close to invisible. This is the one real gap.
- **The accent surface itself is intentionally quiet.** `--accent` against the page is as low as 1.14:1 (light) and 1.36:1 (dark). It is a hover and selected surface, not a control boundary, so the 3:1 rule for component boundaries does not apply to it.
- **Gamut fitting costs little.** Across the presets, the other harmony colours keep a median 100% of the primary's chroma and at worst 42% (a hue shift into a part of the colour space sRGB cannot show at that chroma).

## Decisions proposed

Decisions 1 and 2 were accepted by the owner on 2026-10-11 on the recommendation given; the open item on the derived accent is resolved the same way (see below). Decisions 3 to 5 follow from them.

1. **Adapt the accent ramp per mode, like the primary.** The accent source is passed through `adaptToMode` before its ramp is generated, so step 500 is the adapted accent and stands out 3:1 from each mode's page. Saved themes are unaffected: the cookie holds inputs, and the CSS is rebuilt from them.
2. **Keep `--accent` and `--accent-foreground` as the derived quiet surface, not ramp steps.** The task list suggests making them ramp steps. Measured, the current pair is already at least 11.5:1, and mapping them to ramp steps would change the look of every hover and selected surface and need a fresh contrast check on each. Rejected for now; the ramp is for `bg-accent-N` use and is documented as such. This departs from the task list; the owner confirmed it on 2026-10-11.
3. **Harmony options were widened on the owner's request (2026-10-11): 21 instead of 7, in four groups** (single hue, neighbouring, opposing, evenly spaced). The existing seven keep their hue offsets. Each harmony returns at most eight colours, so the saved accent index goes up to 7 (it was 3). The accent sweep in §2 covers all of them, and it found that extreme tints and shades broke ramp monotonicity, so tints and shades are held to the picker's lightness range (0.15 to 0.9).
4. **Prove it with tests, not new UI.** The contrast test file gains the accent invariants below. The Playwright check gains an accent case.
5. **Document the accent** in `DESIGN.md` beside the primary.

## Design

### 1. Adapt the accent ramp

In `resolveTokens`, build the accent ramp from `adaptToMode(accentSource ?? { ...mine, c: mine.c * 0.5 }, mode)` instead of the raw source, mirroring it in dark as now. The accent role (`--accent`, `--accent-foreground`) keeps coming from `accentSurface`, unchanged.

### 2. Tests (extend `color-contrast.test.tsx`)

Over the same grid, for every harmony and accent index, in both modes:

- `accent-foreground` on `accent`: at least 4.5:1 (guards today's 11.5:1 floor);
- accent ramp step 500 against the page: at least 3:1 (fails today, passes after §1);
- accent ramp lightness monotonic across 50→950 (reversed in dark);
- accent ramp step 500 equals the adapted accent source.

The 3:1 test is written first and seen failing on today's code.

### 3. Browser check

Extend `theme-primary.spec.ts`: save a primary with a triadic harmony and accent index 1, then in light and dark assert that `var(--accent-500)` and `var(--color-accent-500)` equal the browser-resolved colour of `resolveTokens(...).accentRamp[500]`.

### 4. Documentation

`DESIGN.md`, the Accent bullet: accent is chosen from the harmony; the quiet surface and its text pair are at least 4.5:1 by construction; the 50–950 ramp is usable as `bg-accent-500`; step 500 is the adapted accent; dark uses the mirrored ramp.

## Verification

- The new 3:1 test fails first on today's code, then passes.
- The existing theme tests, saved-theme round trips and the guided-steps tests pass.
- The Playwright accent case passes (it needs a browser).
- Manual: choose a harmony and an accent, reload, and confirm a `bg-accent-500` element is visible in light and dark.
- Repository checks per `AGENTS.md` §6.

## Not in scope

- Harmony types beyond these 21, per-step ramp tweaks (they need saved-payload version 2 and an editor control), and `--accent-background` or any other new variable name (naming goes through `docs/glossary.md`).
- Changing which ramp steps the `--accent` role reads.
- Warn and block UI for contrast (satisfied by construction; see ADR-0016).
- Secondary, neutral and base colour roles named in the task list.

## Approvals this needs

- Decision 2 (keeping the quiet-surface accent, which departs from the task list) and decision 1 (it changes the accent ramp values for every non-default theme; the role colours are unchanged): **accepted 2026-10-11.**
- A `DESIGN.md` addition (usage only; no new vocabulary): follows from the above.

## Open items for the plan

- Resolved: the derived ("None") accent's ramp is adapted by the same rule as a chosen accent, so step 500 of every accent ramp is its adapted source. One rule, no special case.

## Update: where the accent shows (2026-10-11, owner request)

The owner found the accent invisible: it was a near-white tint used by four hover states, while the page, cards, borders and sidebar all took the primary's hue. Four scopes were compared. The owner first chose B (neutral base, accent on states, plus a soft wash on muted areas and the sidebar), then found the wash made the app read as mostly accent, and then that the result still read as childish (saturated, large, round). The build settled on a quieter A: neutral base, with the accent only on hover and selected surfaces at low chroma. The default radius also dropped from 10px to the editor's own 4px. The owner also asked that accent text be very dark or very light, not tinted. This supersedes decision 2 above, which kept the accent as a quiet near-white surface.

- **Neutral keeps a large share.** The dark-mode page, cards and popovers, muted areas, the sidebar and all borders read the achromatic `base` ramp, so the primary's hue stays on actions and the accent stays on states.
- **Accent takes states only.** The accent surface is a quiet tint at fixed lightness (light 0.94, dark 0.3, chroma at most 0.05 and 0.055), and the sidebar's selected item follows it. Secondary controls, muted areas, the sidebar and the page are neutral. Fixed lightness replaced ramp steps for these, because a step's lightness moves with the source and a sweep found muted text below 4.5:1 (down to 2.96:1) for thousands of themes when muted took a ramp step.
- **Accent text is near-ink or near-white.** `--accent-foreground` (and so `--sidebar-accent-foreground`) is `bestForeground` of the accent surface.
- **Defaults are unchanged.** The default theme is achromatic, and a test checks that the accent and neutral ramps equal the primary ramp in `colors.css`.
- **Not done:** the wash on muted areas and the sidebar (option B) was built and withdrawn; it is one mapping change in `colors.css` and one in `accentSurface` if it is wanted back at a lower strength.
