# Primary colour and ramp — design

**Status:** Draft for review. Not authoritative: it records a proposed design and approves nothing under `AGENTS.md` §5.
**Date:** 2026-10-10
**Source:** `docs/theme-tasks.md` ("Colors" › "Primary Colors", items 1–16), sub-project C of five (A mode provider and B store and persistence are done; D harmony and E accent follow).
**Governing records:** ADR-0016 (Proposed), ADR-0011 (Accepted), and `DESIGN.md`.
**Builds on:** the mode and persistence specs of 2026-10-10 (`theme` and `theme-prefs` cookies; the server renders the applied theme).

## Purpose

Make the primary colour and its 50–950 ramp work end to end, and prove the accessibility guarantees, without inventing what already exists. The first job is to find out what exists.

## What exists, item by item

The task file reads as if most of this were missing. It is not.

| Task item | State | Where |
| --- | --- | --- |
| 1–2 Primary in OKLCH | **Exists.** `Oklch` type, picker, presets, ranges `COLOR_RANGES` (l 0.15–0.9, c 0–0.4, h 0–360). | `apps/web/components/theme/lib/color-math.ts` |
| 3–5 Ramp 50–950 from the primary, generated client-side | **Exists.** `generateRamp` anchors step 500 to the pick; `mirrorRamp` inverts it for dark. Since sub-project B the server rebuilds it from saved inputs too. | `color-math.ts`, `persisted-theme.ts` |
| 6–7 Injected, usable as `bg-primary-500` | **Exists.** `--color-primary-50…950: var(--primary-N)` in the Tailwind theme; the editor writes `--primary-N` per mode. | `packages/ui/core/src/styles/globals.css`, `color-math.ts` `rampVariables` |
| 8 Variables for primary, foreground | **Partly exists, and is inconsistent** (see "The finding"). | below |
| 8 `primary-background` | **Does not exist.** No consumer, and no name approved. | — |
| 9 Defaults | **Exist.** An achromatic zinc ramp in CSS for both modes; `DEFAULT_TOKENS` in JS. | `tokens/colors.css`, `color-math.ts` |
| 10 Documentation | **Partly.** `DESIGN.md` describes the primary role and the default, but not the ramp's usage or the per-mode rule. | `DESIGN.md` |
| 11 Per-mode ramp use, accessibility checks | **Partly, with a measured gap.** `adaptToMode` keeps the pick at 3:1 against each mode's page; the foreground is the better of near-white (l 0.985) or near-ink (l 0.141). The preview shows ratios. No test covers the range, and a sweep of it (below) shows the foreground can fall to 4.365:1. | `color-math.ts`, `previews/color-preview.tsx` |
| 11 Allowed tweaks to ramp values | **Missing**, and would change the saved schema (see "Not in scope"). | — |
| 12–13 Used consistently | **Mostly true.** No Tailwind palette classes (`bg-blue-500`) in app or `ui-core` components. | repository search |
| 14, 16 Both directions, persisted | **Done** in sub-project B. | `applied-store.ts` |
| 15 Browsers | OKLCH and `color-mix(in oklch)` are already required by the existing styles; no new requirement. | — |

One premise to correct: the default ramp is **not** unset. `--primary-50…950` are defined in `tokens/colors.css` for light and dark (dark mirrored), and the page surfaces (`--background`, `--card`, `--border`, `--muted`…) are derived from that ramp.

## The finding

The primary role has two names, and they disagree.

- **ADR-0011 (Accepted)**, `DESIGN.md`, `ui-core`, and `Button` name the role `--shadcn-primary` and `--shadcn-primary-foreground`, mapped to Tailwind's `--color-primary` and `--color-primary-foreground`.
- **`apps/web/styles/globals.css`** redefines `--color-primary: var(--primary)` and `--color-primary-foreground: var(--primary-foreground)`, shadowing the `ui-core` mapping. This block looks like leftover shadcn output.
- **The theme editor** writes the bare `--primary` and `--primary-foreground` (`tokenVariables`), and its swatches set a local `--primary` (`paintStyle`, `strip.tsx`, `colors-section.tsx`, `accent-group.tsx`).
- **Nothing defines the bare `--primary` by default.** So until a user applies a theme, every `bg-primary` and `text-primary-foreground` in the web app resolves to an undefined variable: transparent buttons.

That is the cause of the failing smoke test (`smoke.spec.ts:13`: button background `rgba(0,0,0,0)` instead of the token colour). It is a real defect in the default app, not a test problem. It also means the editor works only because it writes the name that the override reads.

## Measured: how low the foreground contrast goes

A sweep of the real `color-math.ts` over lightness 0.15–0.9, chroma 0–0.4 and hue 0–350°, in both modes (114,912 colours, each adapted to its mode first):

- The worst foreground contrast is **4.365:1**, at oklch(0.56 0.04 180), a muted mid-tone teal.
- **2,288 of 114,912** (about 2%) fall below 4.5:1.
- All seven presets pass in both modes. The tightest are rose at 4.56 and lagoon at 4.64.
- The cause is arithmetic: the better of two near-extremes meets at about √(1.01 / 0.053) ≈ 4.4. Only true white and black reach √21 ≈ 4.58.
- The pick against the page stays at or above 3:1 for every preset (the lowest is 3.05, ink in dark mode). The sweep did not measure that pair; the new test does.

So ADR-0016's "warn below 4.5" can trigger. The "block below 3" cannot: the foreground never goes below 4.36.

## Decisions taken

All are recommendations, accepted by the owner's blanket acceptance; none was individually confirmed.

1. **Align to the accepted ADR: `--shadcn-primary` and `--shadcn-primary-foreground` are the role names.** Remove the two shadowing lines from the web `globals.css`; make the editor write the ADR's names (`tokenVariables`, `paintStyle`, the three swatch styles). This fixes the default app, needs no ADR amendment, and keeps `Button` and the smoke test as they are. Rejected: renaming the role to bare `--primary` everywhere (larger, needs an ADR-0011 amendment, buys nothing: the task file's own vocabulary, `--color-primary` and `--color-primary-N`, is unaffected), and defining a `--primary` alias (two names for one thing, and the stale override stays).
2. **The role is a colour, not a ramp step.** The default (achromatic) maps it to step 900 (light) or 800 (dark); a themed primary is the adapted pick, which is also step 500 of its ramp. `DESIGN.md` already says a theme may replace the role. This is documented, not changed.
3. **The foreground is the better of near-white or near-ink, with a fallback to pure white or black when that is below 4.5:1.** ADR-0016 asks for the better of light and dark; this keeps the common look unchanged and closes the measured gap for the roughly 2% of picks in the muted mid-tone band, giving at least 4.58:1 by construction. The task file's idea of making the foreground a ramp step is not adopted: a ramp end is not guaranteed to reach 4.5:1 for every hue.
4. **No `--primary-background` now.** It has no consumer, and a new variable name needs the naming process in `docs/glossary.md` (`AGENTS.md` §3). Surfaces keep reading ramp steps directly, as `--card`, `--muted` and `--border` do today.
5. **Guarantee by construction and prove it with tests, not new UI.** With the fallback in decision 3 the primary's foreground is at least 4.5:1 for every pick, and `adaptToMode` keeps the pick at 3:1 against the page. ADR-0016's "warn below 4.5, block below 3" then never triggers for this pair, so a warning or blocking control would be dead UI. The preview's AA indicator stays. A test sweep guards the guarantee against regressions.
6. **Docs go in `DESIGN.md`**, which already holds the colour rules, not in a new document.

## Design

### 1. Fix the naming split

- `apps/web/styles/globals.css`: delete `--color-primary-foreground: var(--primary-foreground);` and `--color-primary: var(--primary);`. The `ui-core` mapping then applies.
- `color-math.ts`: `tokenVariables` writes `--shadcn-primary` and `--shadcn-primary-foreground`; `paintStyle` likewise.
- `colors-section.tsx`, `strip.tsx`, `accent-group.tsx`: the local style sets `--shadcn-primary`.
- `apply.test.tsx`: the three assertions that name `--primary` follow.
- Saved themes are unaffected: the cookie holds inputs, and the CSS is rebuilt from them.
- Out of scope but noted: the rest of the web `@theme inline` block repeats `ui-core`'s mappings; cleaning it is a separate change.

### 2. Foreground rule (`bestForeground`)

- Candidates in order: the current near-white and near-ink. If the better of the two is at least 4.5:1 against the surface, use it, so almost every pick looks exactly as it does today.
- Otherwise use true white (l 1) or true black (l 0), whichever is better. Their crossover is √21 ≈ 4.58:1, so the result is never below 4.5.
- This covers the primary, and any other role that reuses the function. The page text colour (`foreground`) keeps its current constants; only the on-primary pair gains the fallback.
- The same function feeds the swatch `paintStyle`, so the editor's swatches and the applied theme agree.

### 3. Contrast matrix (drift-proof)

One test file reads the role-to-step table from the real `tokens/colors.css` (the `theme-light` and `theme-dark` blocks), builds each mode's ramp with `generateRamp` / `mirrorRamp` / `resolveTokens`, and checks, for every preset and for a grid over `COLOR_RANGES`:

- primary foreground against primary: at least 4.5:1, both modes. The test must fail on today's code (the measured 4.365:1 case is a fixed example) and pass after the rule in §2;
- the adapted primary against the mode's page: at least 3:1, both modes;
- every text role against its surface, using the mapping read from the CSS (`--foreground` / `--background`, `--card-foreground` / `--card`, `--popover-foreground` / `--popover`, `--secondary-foreground` / `--secondary`, `--sidebar-foreground` / `--sidebar`): at least 4.5:1;
- the ramp: lightness is monotonic across 50→950 (reversed in dark), every step is in sRGB gamut, and step 500 equals the adapted pick;
- the JS defaults match the CSS defaults within 0.01 lightness (`DEFAULT_TOKENS` primary against `--primary-900` and `--primary-800`), so the two copies cannot drift apart unnoticed.

If a pair fails, that is a finding. The test comes first, so failures are known before any fix. A change to the role-to-step table in `colors.css` is a visible design change and goes back to the owner; it is not made silently.

### 4. Browser check

A Playwright test applies a theme through the saved cookie (sub-project B) and reads the computed colours: `bg-primary` equals `var(--shadcn-primary)`, and `bg-primary-500` equals the saved pick's step 500, in light and dark. This pins "usable as `bg-primary-500`" and "injected into the DOM" in a real browser.

### 5. Documentation

`DESIGN.md`, in the Primary paragraph: the role names; the ramp and `bg-primary-500`; step 500 is the pick; dark is the mirrored ramp; how a pick is adapted per mode; why the foreground is chosen by contrast. No new variable names are introduced.

## Verification

- The smoke test `smoke.spec.ts:13` passes (the button background equals the token).
- The contrast matrix and the ramp invariants pass, or their failures are reported as findings. The foreground test is seen failing first, on the 4.365:1 colour.
- Existing theme tests pass after the rename; saved themes still round-trip (B's tests).
- The Playwright check in §3 passes.
- Manual: with no theme applied, buttons are filled; apply a theme, reload, still correct in light and dark.
- Repository checks per `AGENTS.md` §6. Failing stages that predate this work are reported, not fixed.

## Not in scope

- Per-step tweaks to ramp values. They need new saved fields (payload version 2) and an editor control; both need approval.
- `--primary-background` or any other new variable name.
- Harmony and accent (D, E), including accent contrast pairs.
- ADR-0016's warn and block UI (it never triggers once decision 3 holds; see decision 5).
- Removing the rest of the duplicated web `@theme` block.
- The mode control in the sidebar, which causes three other smoke failures.

## Approvals this needs

- The editor writes `--shadcn-primary` / `--shadcn-primary-foreground` instead of the bare names, and the web override is removed. This follows ADR-0011, but it changes the CSS variables the editor produces.
- The foreground fallback to true white or black for the roughly 2% of picks below 4.5:1. It changes the on-primary colour for those picks only; the owner may prefer to warn instead (ADR-0016's wording), which would keep today's colours and add editor UI.
- Amending ADR-0016 to say the warn and block behaviour is satisfied by construction and covered by tests, not by editor UI.
- A `DESIGN.md` addition (usage only; no new vocabulary).

## Open items for the plan

- Confirm no other consumer reads the editor's bare `--primary` (the search found only the files above; the plan re-runs it before and after).
- Decide the grid density for the colour sweep so the test stays fast.
- If the matrix finds a failing role pair, stop and report; do not change `colors.css` mappings without approval.
