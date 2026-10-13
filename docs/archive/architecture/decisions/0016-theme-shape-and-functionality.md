# ADR-0016: Theme shape and functionality

**Status:** Proposed
**Date:** 2026-10-10
**Deciders:** Founder (technical direction)

## Context

The theme editor in `@synapcity/frontend-uiontend-ui-core` has grown control-by-control
(text scale, dark mode, accent picker) without a single statement of what a
theme is made of or how its controls are grouped. This ADR records the intended
shape of a theme and the behavior of each control, so later work builds against
one description.

It follows the three-dimension rule in `AGENTS.md` §3: it records the *concept
and behavior* of each control. Section and control labels below are UI labels
only. They are not adopted as persisted keys, type names, or package names, and
`docs/glossary.md` has not been through its naming-decision process for them.

The behavior below was prototyped in design explorations that are held outside
this repository (see "Unresolved"). Where this ADR and an exploration differ,
this ADR is the intended record.

## Decision

A theme is edited through three sections, each with a preview that shows only
what that section changes.

### Colors

Mode, primary color, harmony, and accent change together and produce one color
result.

#### Mode

- Shows as light / dark / system.
- Resolves to light or dark from the system preference when system is selected.

#### Primary color

- Shows as a color picker in the OKLCH color space with three sliders: hue,
  chroma, and lightness.
- Shows a swatch of the selected color.
- The foreground paired with the primary is chosen automatically (light or
  dark, whichever contrasts more). If neither reaches 4.5:1 (WCAG 2.2 SC 1.4.3,
  normal text), true white or true black is used instead, so this pair is at
  least 4.5:1 for every pick; a test sweeps the picker ranges to keep it so.
  The primary itself is moved only as far as needed to stand out 3:1 from the
  page in each mode. The warn-below-4.5 and block-below-3 behavior therefore
  never triggers for these pairs, and no editor UI is built for it. The sliders
  are not clamped, so any hue is reachable.
- Each mode gets its own version of the pick: the same hue and chroma, with
  lightness moved only as far as needed to keep 3:1 against that mode's page
  (WCAG 2.2 SC 1.4.11). A pale pick is darkened for light mode and left alone
  for dark; a deep pick is lightened for dark and left alone for light. This
  holds whichever mode the pick was made in.
  When a mode's version differs from the pick, the editor says so beside the
  swatch and shows the adjusted color.
- The dark theme inverts the ramp (its 50 is the darkest step, its 950 the
  lightest, and its surfaces read the low steps), so the generated ramp is
  mirrored for dark mode. Applying the light-mode ramp to dark would put light
  tints where dark surfaces belong.

#### Harmony

- Shows as a harmony selector in the OKLCH color space.
- Options, in four groups: single hue (none, monochromatic, tints, shades,
  tones), neighbouring hues (tight, standard and wide analogous, accented
  analogous, sequential), opposing hues (complementary, split-complementary,
  double split, rectangle, clash), and evenly spaced (triadic, tetradic,
  pentadic, hexadic, octadic, golden angle). A harmony produces at most eight
  colours.
- Shows a swatch of the color options the selected harmony produces.

#### Accent

- Selected by clicking one of the colors the selected harmony produces.

### Typography

Text size and font family. The preview is a panel showing text at different
scales and in the selected font families.

#### Text scale

- Shows as a stepper over 80-150% in increments of 5%.
- Shows preset cards for fast selection of a scale value.

#### Font

- Shows as a font selector over a list of available fonts.
- Three selectors: heading, body, and monospace.
- The list is a curated set that includes Google Fonts, with Geist and Geist
  Mono as the defaults. Fonts are loaded through `next/font/google`, which
  self-hosts them at build time (no request to Google at runtime, per the
  Next.js 16.3.6 bundled docs). Loaders are declared statically, so the list is
  fixed at build time. It is not the full Google Fonts catalog.

### Display

#### Radius

- Shows preset cards for fast selection of a radius value.
- Shows a slider over 0-12px in increments of 1px.
- The slider value sets the base radius, `--radius-base`. The derived radius
  scale (`--radius-sm`, `--radius-md`, `--radius-lg`) follows from it, so every component updates together. No component receives a raw
  pixel value.

#### Density

- Shows as a stepper over -3 to +3 in increments of 1.
- Shows preset cards for fast selection of a density value.
- Density scales the base `--spacing` by one factor, set in a single place. It
  changes gaps and padding. It does not change text size (Text scale) or radius
  (Radius). The per-step magnitude is tuned visually and is not fixed here.

### Structure

- Within each section, subsections (for example Mode, Primary, Accent) are
  labeled groups. A nested collapsible is used only for a subsection that is
  large enough to need one.
- State is owned per document-level concern, not per editor section. A concern
  that writes to the document root (for example mode, text scale) is owned by a
  provider. A section component is presentational: it reads and writes through
  those providers and holds no copy of the value.
- A host may instead supply a local, stateful draft. The theme sheet does: its
  previews show the draft, nothing reaches the document root until the user
  applies, and Cancel discards the draft. Dismissing with unsaved edits asks
  first. The sections are unchanged and stay controlled components.
- Applying commits the draft to a scope: global, region, or component. A
  narrower scope overrides the broader one only inside itself. These three names
  are working labels.
- Apply is global only. It writes only the controls the user changed, because the
  editor's defaults are not the app's. Colors are written per mode (`:root.light`
  and `:root.dark`), fonts as `--font-preference-*`, radius as `--radius-base`,
  density as `--spacing` (Tailwind's spacing base, scaled by one factor), text
  size as `--text-base-size` (the 0.9375rem the type ladder derives from, scaled
  by the percentage), and mode through the existing theme provider. What was
  applied, except mode, is saved in one versioned cookie, `theme-prefs` (interim
  name, payload version 1), and the server renders the same styles into the
  first HTML. Mode keeps its own cookie, `theme`. Reopening the editor starts
  from what was applied, and the sheet can revert everything it applied; after a
  reload, revert clears the saved theme but does not change mode.
- The sheet can overlay the app with no scrim, or be pinned so the app reflows
  beside it. Whether pinned state is remembered is a per-device preference.

## Scope

This ADR governs which controls a theme has, how each is presented, their value
ranges, and how editor sections relate to state ownership. It does not govern
how any value is stored.

## What this does NOT decide

- Persistence beyond the global applied theme. The applied theme is saved in the
  `theme-prefs` cookie only: local storage cannot reach the first HTML, so it is
  not used. Named themes and their assignments in a per-user database are not
  decided and depend on storage and auth architecture that is not accepted. Keys
  beyond `theme` and `theme-prefs`, and any sync rule, need approval under
  `AGENTS.md` §5.
- Persisted identifiers and type names for any control. Section and control
  labels above are UI labels, not names.
- How scoped overrides (applying a theme to a region or component) are
  resolved and stored, identifiers for a region or component, and persisted
  custom themes. The "Theme/customization package topology" candidate in this
  directory's index remains open.
- Which package the theme state and editor live in.
- Any theme state beyond mode. The duplicate dark-mode providers in `ui-core`
  were consolidated onto `ThemeProvider`; `DarkModeProvider` is archived in
  `docs/archive/2026-10-10-dark-mode-provider.md`.

## Unresolved

- **Font list membership.** Which curated fonts are included, beyond Geist and
  Geist Mono. `AGENTS.md` now allows a curated, self-hosted selectable list.
- **Text-size shortcuts.** The web app mounts no text-scale provider, so its
  keyboard shortcuts (Ctrl/Cmd with +, -, 0) do nothing there. Text size is
  applied through the theme sheet instead. The `ui-core` type ladder is the
  documented one; the web override of it was removed and archived in
  `docs/archive/2026-10-10-web-text-ladder.md`.
- **Density in the web styles.** Apply scales `--spacing` directly. The web
  styles also read `--density-base`, which is not defined, and that chain feeds
  only the custom `--spacing-*` tokens. One path should win.
- **Mode cookie name.** Interim: the theme provider, the pre-paint script, and
  the root layout all use `theme` (one constant, `THEME_COOKIE`). The final
  persistence key scheme is still undecided and may rename it.
- **Density step magnitude.** The mechanism is decided (one factor on
  `--spacing`). Apply uses 5% per step as an untested starting value.
- **Contrast thresholds.** 4.5:1 and 3:1 are the recommended defaults, not yet
  confirmed. They are met by construction for the primary pair (see above); a
  warn or block control would only be needed for a pair that is not constructed
  to pass.
- **Named-theme storage details.** See "What this does NOT decide".
- **Terminology.** "Harmony", "Density", and "Accent" are accepted by the
  founder as working labels. So are "global", "region", and "component" for
  scopes. None has been through the `docs/glossary.md` naming-decision process,
  so none may become a persisted key, type name, or package name.

Deferred by the founder until raised: the design references that live outside
the repository.

## Governance boundary

The founder owns this decision. Adding, removing, or regrouping a control, or
changing a stated range, requires an amendment to this ADR. Persisted
identifiers, storage, and the font list each need their own approval under
`AGENTS.md` §5.

## Integration expectations

- Lives in `@synapcity/frontend-uiontend-ui-core` for now and follows ADR-0005 (dependency
  direction and exports-only public API) and ADR-0011 (Tailwind v4 CSS-first,
  tokens in `globals.css`).
- Mode, text scale, and any other value applied to the document root are applied
  through the root element or CSS variables, not by component-level classes.
- Editor sections are controlled components so the same section can be hosted
  against a global provider or a local, stateful host.
- Components import no application runtime (ADR-0008).

## Verification expectations

- Each control has unit tests for its range, step, clamping, and keyboard
  behavior, and a Storybook story that passes the accessibility checks.
- Each section has a test showing it is controlled (it renders the value it is
  given and reports changes through its callback).
- Manual check before acceptance: every control is operable by keyboard alone,
  and previews update as values change.
- `pnpm verify` passes, including `pnpm docs:check`.

## Reconsideration conditions

- A persistence or scoped-override decision that requires a different value
  model.
- Evidence that users do not need one of these controls, or need one that is
  missing.
- A change to the system typeface rule that affects the font selectors.
