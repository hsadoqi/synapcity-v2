---
name: Synapcity
description: A quiet, compact working environment. The default theme is achromatic so the user's content carries the colour; primary and accent are themeable.
colors:
  background: 'oklch(100% 0 0)'
  foreground: 'oklch(14.5% 0 0)'
  muted: 'oklch(97% 0 0)'
  sidebar: 'oklch(98.5% 0 0)'
  muted-foreground: 'oklch(52% 0 0)'
  border: 'oklch(92.2% 0 0)'
  input: 'oklch(60% 0 0)'
  primary: 'oklch(20.5% 0 0)'
  primary-foreground: 'oklch(98.5% 0 0)'
  destructive: 'oklch(45% 0.245 27.325)'
  success: 'oklch(46% 0.15 145)'
  warning: 'oklch(82% 0.16 85)'
  info: 'oklch(48% 0.16 250)'
typography:
  feature:
    fontFamily: 'var(--font-ui)'
    fontSize: '1.875rem'
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: '-0.02em'
  display:
    fontFamily: 'var(--font-ui)'
    fontSize: '1.5rem'
    fontWeight: 600
    lineHeight: 1.333
    letterSpacing: '-0.02em'
  headline:
    fontFamily: 'var(--font-ui)'
    fontSize: '1.1875rem'
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: '-0.01em'
  title:
    fontFamily: 'var(--font-ui)'
    fontSize: '1.0625rem'
    fontWeight: 600
    lineHeight: 1.556
  body:
    fontFamily: 'var(--font-body)'
    fontSize: '0.9375rem'
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: 'var(--font-ui)'
    fontSize: '0.875rem'
    fontWeight: 500
    lineHeight: 1.429
  caption:
    fontFamily: 'var(--font-body)'
    fontSize: '0.8125rem'
    fontWeight: 400
    lineHeight: 1.333
rounded:
  xs: '2px'
  sm: '2.4px'
  md: '3.2px'
  lg: '4px'
  xl: '5.6px'
spacing:
  hairline: '1px'
  xs: '4px'
  sm: '8px'
  md: '16px'
  header: '56px'
  sidebar: '256px'
  sidebar-icon: '48px'
---

# Design System: Synapcity

## 1. Overview

**Creative North Star: "The Quiet Workbench"**: A minimalist, functional interface that prioritizes the user's work over visual flair.

Synapcity is a configurable personal working environment (PRODUCT.md), and the interface behaves like a well-kept workbench: a neutral surface, tools where the hand expects them, nothing competing with the work lying on it.

**The default theme is achromatic.** Every surface, border, fill and text colour is a step on one graphite ramp, so the user's own content is the only thing that introduces colour by default. This is a property of the _default theme_, not of the system: `primary` and `accent` are theme-owned roles and may take any hue from the user's theme. The rules below say where a hue may appear, not that none may.

Structure, density and rules stay fixed; colour, radius and type are theme values. Product code never hardcodes a colour, radius or shadow.

Density is high on a mouse (20 to 32px controls, 15px base text). Touch behaviour is chosen by input method (`pointer-coarse:`), not window width. Only the 24px control sizes are verified to grow a 44px hit area; wider touch claims are Proposed (§9).

This system rejects the **generic SaaS dashboard**: identical card grids, hero-metric tiles, gradient accents, decorative colour, and chrome that performs instead of disappearing into the task.

**Key Characteristics:**

- Achromatic default ramp; hue arrives through state colours, the user's content, and a themed `primary`/`accent`.
- Flat and tonal: hairlines and tonal steps; shadow only on a button's pressed edge and the floating inset panel.
- Light and dark are one inverted ramp, following the OS unless `.light` or `.dark` forces it.
- Regions scroll, the page never does.

## 2. Colors

One graphite ramp (`base`, `primary`, `accent` are currently identical achromatic ramps in `tokens/colors.css`), inverted for dark, plus four state colours.

### Themed roles

- **Primary** (`--shadcn-primary`, default `oklch(20.5% 0 0)`): default buttons, default badges, selected and active indicators, the brand tile. In dark the ramp inverts (`primary-800`, `oklch(92.2% 0 0)`) so the fill still moves away from its label. A theme may replace it with any hue. The pick is generated into a 50-950 ramp (`--primary-50` to `--primary-950`, usable as `bg-primary-500`), and step 500 is the pick itself. Each mode adapts the pick to stand out 3:1 from its page, and dark mode uses the mirrored ramp. The foreground (`--shadcn-primary-foreground`) is the better of near-white and near-ink; if neither reaches 4.5:1 it is true white or true black, so the pair is at least 4.5:1 for every pick.
- **Accent** (default: same ramp): hover and focus surfaces (`accent`, `sidebar-accent`). Selected rows and pressed toggles are not accent: they take a solid mix of the surface and the primary (`bg-selected`, `bg-sidebar-selected`), so the primary marks what is active. Themeable like primary: it is chosen from the harmony of the primary, or derived quietly from the primary ("None"). These accent surfaces sit at fixed lightness, so neutral text always reads on them; secondary controls, muted areas, the sidebar and the page stay neutral, and the text on a hovered accent surface is near-ink or near-white, never tinted. The accent also has a 50-950 ramp (`--accent-50` to `--accent-950`, usable as `bg-accent-500`); step 500 is the accent adapted to stand out 3:1 from each mode's page, and dark mode uses the mirrored ramp.
- **Neutral** (`--base-50` to `--base-950`, achromatic): the page, cards, popovers, borders and most text. Muted areas and the sidebar carry a whisper of the primary's hue at the neutral's own lightness, with chroma capped, so text contrast on them is the same for every pick. Colour is a share of the screen, not the ground it sits on: primary marks what you can do next, accent marks hover, selection and secondary emphasis, and the neutral scale carries everything else.
- **Ring** (default `oklch(60% 0 0)`): focus ring and active-field border.

Interactive fills are **solid** mixes of existing tokens (hover and pressed shift toward `background`), so contrast is deterministic and guarded by `tests/theme-contrast.test.ts` (**Verified**: the test exists). Alpha overlays are for the ghost variant only.

### State

- **Destructive** `oklch(45% 0.245 27.325)`: destructive actions and invalid fields only.
- **Success** `oklch(46% 0.15 145)`, **Warning** `oklch(82% 0.16 85)` (dark foreground), **Info** `oklch(48% 0.16 250)`.
- Dark values come from `theme-dark`: destructive `0.76 0.191 22.216`, success `0.72 0.14 145`, warning `0.82 0.14 85`, info `0.7 0.14 250`.

### Neutral

- **Background** `oklch(100% 0 0)`: page, card, popover.
- **Sidebar** `oklch(98.5% 0 0)`: a half-step off the content surface.
- **Muted** `oklch(97% 0 0)`: secondary and muted fills, row tint.
- **Border** `oklch(92.2% 0 0)`: card and control edges; `oklch(100% 0 0 / 35%)` in dark, held at 3:1 against cards.
- **Divider** `oklch(92.2% 0 0)`: structural seams between regions (sidebar edge, panel seam, rail); a solid `oklch(26.9% 0 0)` in dark, about 1.3:1, so the shell reads as tone, not outlines.
- **Input** `oklch(60% 0 0)`: input borders (`oklch(100% 0 0 / 40%)` in dark).
- **Muted foreground** `oklch(52% 0 0)`: secondary text.
- **Foreground** `oklch(14.5% 0 0)`: body text and headings.

### Measured contrast (WCAG ratio, computed from the token values; NOT a substitute for the test file)

| Pair                                     | Light                     | Dark                 |
| ---------------------------------------- | ------------------------- | -------------------- |
| foreground / background                  | 19.79                     | 18.96                |
| muted-foreground / background            | 5.51                      | 7.63                 |
| muted-foreground / muted                 | 5.05                      | 5.83                 |
| primary-foreground / primary             | 17.16                     | 14.22                |
| destructive-foreground / destructive     | 6.63                      | 7.66                 |
| success-foreground / success             | 6.37                      | 8.41                 |
| warning-foreground / warning             | 10.15                     | 11.25                |
| info-foreground / info                   | 6.18                      | 7.44                 |
| input / background (needs 3:1, non-text) | 3.95                      | not measured (alpha) |
| border / background                      | 1.26 (decorative divider) | not measured (alpha) |

Caveat: `destructive`, `success` and `info` (both modes) are outside the sRGB gamut, so browsers clip them on sRGB displays. The ratios above clip the same way and are approximate for those three. Whether to bring them in gamut is an open question for the token review, not decided here.

### Named Rules

**The Theme-Owned Rule.** Colour is applied only through semantic tokens (`bg-background`, `text-muted-foreground`, `border-border`). Never hex, never a palette class such as `bg-blue-500`, never a hand-written `dark:` colour.

**The One Voice Rule.** Whatever hue `primary` carries, it is for the thing you can do next, the focus ring and the active state, and should cover a small share of any screen.

**The Solid Mix Rule.** Hover and pressed fills are solid mixes, not alpha, except the ghost variant.

## 3. Typography

**Roles, not font names.** `--font-ui` (chrome, headings; `--font-heading` aliases it), `--font-body`, `--font-code`. Geist and Geist Mono are the shipped defaults; users choose from a curated list that includes Google Fonts (ADR-0016), loaded through `next/font/google` and applied through `--font-preference-*`. Components reference roles only; no component re-declares a font stack.

The scale is a fixed ladder off `--text-base-size: 0.9375rem` (15px), never fluid, because the interface sits in a sidebar as often as it fills a page. Multipliers are chosen so every step lands on a whole pixel at the default, and each step above body is at least 1.2x the one below. **Verified** against `globals.css` `@theme inline` (`--text-*` multipliers) and `tokens/typography.css`.

### Hierarchy (**Verified** values; supersedes the previous 12 / 13 / 14px ladder off 0.875rem)

| Role     | Utility     | Multiplier | Size (px) | Line height | Used for                                                                                       |
| -------- | ----------- | ---------- | --------- | ----------- | ---------------------------------------------------------------------------------------------- |
| Feature  | `text-3xl`  | 2          | 30        | 1.2         | the one lead heading of a full-page surface (e.g. the theme editor host); never inside a panel |
| Display  | `text-2xl`  | 1.6        | 24        | 1.333       | page and panel titles (`h1`)                                                                   |
| Headline | `text-xl`   | 1.2667     | 19        | 1.4         | section headings (`h2`)                                                                        |
| Title    | `text-lg`   | 1.1333     | 17        | 1.556       | sub-section and card titles                                                                    |
| Body     | `text-base` | 1          | 15        | 1.5         | default text, inputs                                                                           |
| Label    | `text-sm`   | 0.9333     | 14        | 1.429       | buttons, form labels                                                                           |
| Caption  | `text-xs`   | 0.8667     | 13        | 1.333       | sidebar items, badges, metadata                                                                |

`text-4xl` (36px) and `text-5xl` (45px) stay in the ladder for display moments; product chrome does not use them. Weights: 600 for display to title, 500 for label and feature, 400 otherwise (**Proposed**; not re-verified per component).

### Named Rules

**The Fixed Ladder Rule.** Sizes come only from the `--text-*` ladder, all multiples of `--text-base-size`. No `clamp()`, no pixel one-offs. Changing `--text-base-size` rescales the system.

**The Real-16 Rule (Proposed).** `text-base` here is 15px, not 16px. Anything that must be a literal 16px (touch fields, so iOS Safari does not zoom on focus) would use `1rem` with a comment saying why. No such field is verified in this repo yet.

**The Balance Rule.** `h1` to `h3` use `text-wrap: balance`, paragraphs `text-wrap: pretty`, tables tabular numerals (**Verified** in `globals.css`).

## 4. Layout

The shell is a left sidebar, a header and a main area. Each region (sidebar, content, Global panel) owns exactly one `ScrollArea`; the page itself never scrolls, and every flex ancestor stays bounded with `min-h-0`.

The **Global panel** is a collapsible, resizable panel under the header. It starts collapsed, can be locked open, reflows the work instead of covering it, and exposes its lock state accessibly. Dismissal: outside click and Escape close an unlocked panel; the resize handle and open menus never dismiss it. (A 20%-60% height range and remembered size are **Not re-verified**.)

The **global sidebar** is hidden until opened (the toggle in the header, or Cmd/Ctrl+B) and pushes the content instead of covering it. On nested routes a **space sidebar** rail sits beside the content; `/home` has none. Only one sidebar is open at a time. An unlocked sidebar closes on an outside click or Escape and a lock keeps it open; that dismissal is still a trial (two-layer navigation shell brief). **Verified** in `root-shell.tsx` and `root-routes.ts`.

Spacing is a 4-based rhythm; related things sit tight, groups are separated by space and a hairline, not boxes. Container-query breakpoints (`@sm`, `@md`) are **Proposed**, not re-verified.

### Auto-hiding header (home routes)

**Currently switched off** (`HEADER_AUTO_HIDE_ENABLED` is `false` in `header-auto-hide.ts`): the reveal did not behave reliably, so the header is always shown on every route. The component and its tests are kept, and what follows is what it does when the switch is on.

On `/home` and every route under it, the header hides for fine pointers and returns on demand. On touch (`pointer-coarse`) it is always shown. Hiding slides the header up by its own height, so `--header-height` does not change and the content moves up with it, reflowing the work as the Global panel does. **Verified** in `root-header.tsx` and `use-root-header-reveal.ts`, and in a browser at 1440px and 390px.

- **Cue:** a 16px brand-mark handle in the top-left corner (48 × 16px target, `muted-foreground` measuring 5.49:1 on the page, **Verified** by computed style) and a 6px strip along the top edge. Both are pointer-only and `aria-hidden`; the handle stays shorter than half the Global panel toolbar so it never overlaps it.
- **Reveal:** hovering the header, handle or strip for 500ms; pressing the handle or strip reveals at once; keyboard focus entering the header reveals it. It stays revealed while the global sidebar is open, because that sidebar's toggle lives in the header.
- **Hide:** 400ms after the pointer or focus leaves, skipped while focus is inside the header or a menu is open. The slide is 200ms ease-out, and none under reduced motion.
- The 500ms dwell is set to avoid accidental reveals when the pointer passes through; it is **Not re-verified** by user testing, and whether hide-by-default stays the default is the owner's call.

### First-run hint (`/home`)

A short line under the empty-state action tells a first-time pointer user how to bring back the sidebar (and the header, while auto-hide is on), with a "Got it" button that dismisses it for good. It is hidden on touch, where there is nothing to bring back. Copy and where dismissal is remembered are provisional (§9).

## 5. Elevation

Flat by default. Depth comes from tonal layering and 1px hairlines; a 1px border is never paired with a wide soft shadow.

- **Button edge** (`--shadow-button`: `inset 0 1px 0 0 oklch(1 0 0 / 12%), 0 1px 2px 0 oklch(0 0 0 / 16%)`; dark `--shadow-button-dark`): default button resting depth. **Verified** in `tokens/misc.css`.
- **Overlay** (`shadow-md` plus `ring-1 ring-foreground/10`): popovers, menus, sheets (**Proposed**; not re-verified per component).
- **Inset panel** (`shadow-sm`): the content panel floating beside the sidebar.
- **Focus ring**: `focus-visible` only, `outline-2 outline-offset-2 outline-ring`, `Highlight` outline in forced-colors (**Verified** in `globals.css`).

**The Flat-By-Default Rule.** If it looks like a card floating on a glow, the blur is too wide. Never nest a bordered card inside a card.

## 6. Shapes

Radius derives from `--radius-base` (0.25rem, the editor's own default of 4px): `xs` 2px, `sm` 2.4px, `md` 3.2px, `lg` 4px, `xl` 5.6px. The default was 0.625rem (10px) and read as soft; small, squared corners suit a compact tool, and the user can still raise it in the editor. **Verified** against `@theme inline`. Never hard-code a radius or write a bracket value.

## 7. Components

Compact and exact: small controls, strict focus, state-only motion.

### Buttons (**Verified** against `base/button/button.tsx`)

- **Heights:** `xs` 20px, `sm` 24px, `default` 28px, `lg` 32px; icon-only 24 / 28 / 32 / 36px.
- **Touch:** `xs`, `sm`, `icon-xs` and `icon-sm` extend a 44px hit area on `pointer-coarse` via an `::after` (24px + 2 x 10px, and 28px + 2 x 8px for `icon-sm`). Class presence is unit-tested; the rendered 44px is not yet checked on a touch device. `default`, `lg`, `icon` and `icon-lg` have no coarse-pointer rule, so the claim "text buttons are 44px on touch" is **Proposed**, not shipped.
- **Motion:** 150ms transition on colour, border, shadow and opacity, with `motion-reduce:transition-none`.
- Variant fills (hover 12%/20% mix, ghost 6%/11%, destructive tint 10/17/24%) are carried over from the previous `DESIGN.md`; **Not re-verified** in this pass.

### Inputs, badges, navigation

Input 32px / `lg` radius, badge 20px / `sm` radius, sidebar 16rem / 18rem sheet / 3rem collapsed, header 56px: carried over from the previous `DESIGN.md`, **Not re-verified**. Input border contrast: the light `input` token measures 3.95:1 against `background` (above), clearing the 3:1 non-text minimum; the dark token is alpha-based and not yet measured.

## 8. Do's and Don'ts

### Do

- Use semantic tokens only; let variables carry light and dark.
- Use a variant or size before adding classes to a shadcn component; `className` there is for layout only.
- Keep every interactive component's full state set: default, hover, focus, active, disabled, loading, error.
- Hold body and label text at 4.5:1 or better on every surface it can land on, in both themes, **including after a theme changes primary/accent**.
- Size touch targets by input method (`pointer-coarse:`), not window width.
- Give each scroll region one `ScrollArea`.
- Separate with hairlines and spacing; reserve shadows for the button edge and the inset panel.
- Keep transitions to 150 to 250ms with a `motion-reduce` fallback.

### Don't

- Don't build a generic SaaS dashboard.
- Don't hardcode hex, palette classes, `!important`, or a hand-written `dark:` colour.
- Don't pair a 1px border with a wide soft shadow, or nest a bordered card inside a card.
- Don't put a hue in chrome by default; a hue belongs to state colours, the user's content, or a deliberately themed `primary`/`accent`.
- Don't use `border-left`/`border-right` wider than 1px as a coloured stripe.
- Don't use gradient text, decorative glassmorphism or `backdrop-filter` as chrome.
- Don't write bracket values; use a scale step or add a theme variable once. Don't change `--spacing` outside the Density control (ADR-0016).
- Don't re-declare a font stack in a component; add fonts only to the curated list.
- Don't rely on hover for anything needed; keyboard focus and touch must reach it.
- Don't assume `text-base` is 16px. Don't use Unicode glyphs (a "×") as icons.
- Don't reach for a modal first; try an inline or non-modal surface, as the Global panel does.

## 9. Implementation status

| Item                                               | Document says                                        | Code today                                                                                                                                                                   | Status                                                                                        |
| -------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Default theme achromatic                           | graphite primary/accent                              | `tokens/colors.css`: `base`, `primary`, `accent` all achromatic OKLCH                                                                                                        | **Aligned** (Verified)                                                                        |
| Colour values in §2                                | as listed                                            | match `theme-light` / `theme-dark`                                                                                                                                           | **Aligned** (Verified)                                                                        |
| Text ladder                                        | 13 / 14 / 15px, then 17 / 19 / 24 / 30               | `--text-*` multipliers of 0.9375rem in `globals.css`                                                                                                                         | **Aligned** by source read; **not yet re-checked in a browser** after the 14px to 15px change |
| `--text-base-size`, fixed ladder                   | required                                             | present in `typography.css`, `globals.css`                                                                                                                                   | **Aligned**                                                                                   |
| `--font-preference-*` overrides                    | documented                                           | referenced for code in `globals.css` (`--font-code`); body/heading overrides not re-checked                                                                                  | Open Question                                                                                 |
| Radius derivation                                  | `--radius-base` 0.25rem                              | present                                                                                                                                                                      | **Aligned**                                                                                   |
| Button sizes and 150ms motion                      | 20/24/28/32px, 150ms                                 | match `button.tsx`                                                                                                                                                           | **Aligned**                                                                                   |
| Button/icon-button 44px on touch                   | text buttons 44px                                    | `xs`, `sm`, `icon-xs`, `icon-sm` extend a 44px hit area (class-tested); `default`, `lg`, `icon`, `icon-lg` do not                                                            | **Proposed** for the unextended sizes; code lags                                              |
| Inputs, badges, sidebar, header specifics          | as listed                                            | not re-checked                                                                                                                                                               | Open Question                                                                                 |
| Out-of-gamut state colours                         | n/a                                                  | destructive, success, info exceed sRGB                                                                                                                                       | **Known Problem**; decision for token review                                                  |
| Header auto-hide on home routes                    | slides away for fine pointers, always shown on touch | implemented in `root-header.tsx` and `use-root-header-reveal.ts`, **switched off** by `HEADER_AUTO_HIDE_ENABLED`; the earlier browser check predates the reliability problem | **Off** (not enabled)                                                                         |
| Press-to-reveal on handle and top edge             | reveals at once; hover waits 500ms                   | unit-tested and browser-checked on desktop                                                                                                                                   | **Aligned** (Verified)                                                                        |
| First-run hint on `/home`                          | one line, dismissible, fine pointers only            | `home-shell-hint.tsx`; dismissal remembered in the browser                                                                                                                   | **Proposed**; copy and storage choice await the owner                                         |
| Handle and hint in dark mode, with a screen reader | n/a                                                  | not tested                                                                                                                                                                   | Open Question                                                                                 |
| Token names                                        | repo names (`muted`, `border`, `input`, `sidebar`)   | same                                                                                                                                                                         | **Aligned**; no new vocabulary introduced                                                     |

### Provenance

- Colour, ladder and elevation values were checked against `packages/ui/core/src/styles`; contrast ratios were computed from those values.
- The header, handle and hint behaviour was read from source and exercised in a browser (desktop and phone widths); contrast for the handle and hint text was computed from rendered colours.
- The theme-owned framing, One Voice rule, touch-by-input-method and Real-16 rule are guidance, not verified behaviour.
