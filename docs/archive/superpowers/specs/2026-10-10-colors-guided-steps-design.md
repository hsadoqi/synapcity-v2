# Colors section: guided steps and swatch cards

Status: draft for review. Approach A, approved in conversation on 2026-10-10.

## Purpose

Make the `/theme` Colors section look and work like the reference
`theme-color-picker-design-v2` (a guided Primary, Harmony, Accent flow with
labelled swatch cards), while keeping this repo's accordion shell, preview,
providers, and the Typography and Display sections unchanged.

Reference files: `components/theme-picker/{variant-stacked,primary-step,harmony-step,accent-step,shared}.tsx`,
`hooks/use-roving-focus.ts`.

## Scope

In scope (all under `apps/web/components/theme/`):

- `components/sections/colors-section.tsx`: render three numbered, collapsible steps.
- `components/controls/collapsible-step.tsx` (new): step header and panel.
- `components/controls/preset-group.tsx`: add optional `hint` and `dashed` to `Choice`.
- `components/sections/color-groups/{primary,harmony,accent}-group.tsx`: use the step component and card options. Mode is rendered as a compact row above the steps.

Canonical editor (per the owner, 2026-10-10): `apps/web/components/theme/` is the
canonical theme editor for now. The `ThemeEditor` in
`packages/ui/core/src/components/theme/theme-editor/` is not touched by this work and
is not used as the base for it.

Out of scope: `ColorsProvider` defaults (stay blue / analogous / accent 1), the split
layout, Typography and Display, the preview components, and unrelated uncommitted
work (including existing design-system findings in `globals.css`).

## Behaviour

- Steps: `01 Primary`, `02 Harmony`, `03 Accent`. Header is a button with
  `aria-expanded` / `aria-controls`; number in mono, title, and a one-line
  description while open.
- Collapsed summaries: chip (Primary), colour strip (Harmony), hue name (Accent).
- Open-step state is local to `ColorsSection` (not in the provider). Initial: step 1 open.
  Choosing a primary opens Harmony; choosing a harmony opens Accent only. Each step is
  also toggleable by hand.
- Accent "Change harmony" / "Change primary" re-open the target step and focus its
  header (replaces the `jump()` DOM lookup).
- "Reset colours" collapses to step 1.
- Step-enter animation is `motion-safe:` only.

## Swatch cards

`PresetGroup` is extended, not duplicated. `Choice` gains optional `hint` (second text
line, truncated) and `dashed` (dashed border for "None"-type tiles). Existing roving
focus and `radiogroup` semantics are kept. Harmony tiles: strip + name + hint.
Accent tiles: chip + name + hue hint.

## DECIDED (owner, 2026-10-10: option 1): "None" accent tile

The reference offers "None, derive a soft accent from the primary" under every harmony.
Here, `accentSourceFor` returns `null` (derived accent) only when `harmony === 'none'`;
otherwise an out-of-range index falls back to `colors[1]`. Supporting a "None" tile under
any harmony requires a new accent value in `ColorsProvider` (e.g. a `null` accent index)
and a change to `accentSourceFor`. Options:

1. Add `accentIndex: number | null`; `null` means derived. Touches provider state shape and `accentSourceFor`.
2. Omit the tile; derived accent stays reachable only via the "none" harmony.

Nothing below depends on this until it is decided. Recommendation: option 1, as
the reference does, but it is the user's call.

Addenda found while planning: `Choice` also gains an optional `ariaLabel` (so the None
tile can read "None, derive a soft accent from the primary" while showing "None"), and
`ColorsProvider` exposes a `resetCount` so `ColorsSection` can collapse to step 1 on reset.

## Styling rules

Theme tokens and Tailwind scale steps only; no bracket values or hardcoded colours;
`className` for layout only. Swatch colours keep the existing `paintStyle` / `variables`
mechanism (values are dynamic).

## Verification

- Component tests: open-on-choose, summaries, Change buttons, Reset, keyboard nav in each radiogroup, and the None accent (if approved).
- Storybook accessibility gate (`pnpm test:storybook`).
- `pnpm format:check`, `lint`, `typecheck`, `test`, `docs:check`.
- Manual check at `/theme` in light and dark.
- Anything not run will be reported as not run.
