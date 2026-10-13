# ADR-0002: Styling foundation (Tailwind v4, shared tokens, shadcn)

**Status:** Accepted
**Date:** 2026-10-13
**Deciders:** Hanaa Sadoqi (repository owner)

## Context

The application needs one theme that every app and the shared UI package render identically, in light and dark. A first setup left a stale `shadcn init` block in `apps/web/src/styles/globals.css` that redefined `--color-primary`, `--background`, `--radius` and `--font-sans` after the shared import. The compiled CSS then carried two competing definitions of the same tokens, and the shared radius and primary were silently overridden. This ADR fixes the ownership of styling so that cannot recur.

Evidence: `packages/frontend/tailwind-config/`, `apps/web/src/styles/globals.css`, `apps/web/components.json`, `packages/frontend/ui/components.json`; the compiled stylesheet of `apps/web` before and after the cleanup.

## Decision

1. **Tailwind CSS v4, CSS-first.** There is no `tailwind.config.*`. The theme is declared in CSS with `@theme inline`, `@utility` and `@custom-variant`. PostCSS runs `@tailwindcss/postcss` through the shared config exported as `@synapcity/frontend-tailwind-config/postcss`.
2. **One owner for tokens: `@synapcity/frontend-tailwind-config`.** `shared-styles.css` is the package entry and composes `tokens/variants.css`, `base.css`, `utilities.css`, `accessibility.css` and `typeset.css`. Colour ramps (`base`, `primary`, `accent`), the semantic colours (`background`, `foreground`, `primary`, `muted`, `border`, `ring`, `success`, `warning`, `info`, the sidebar set), the type ladder, the radius scale and the font roles are defined there and nowhere else.
3. **Apps contain wiring only.** `apps/web/src/styles/globals.css` imports `tailwindcss`, `shadcn/tailwind.css` and `@synapcity/ui/styles.css`, and declares `@source` lines. It declares no `:root`, `.dark`, `@theme` or `@layer base` rules. A token change is made in `@synapcity/frontend-tailwind-config`.
4. **Light and dark are explicit-or-system.** `.light` and `.dark` on the root force a mode; without either, `prefers-color-scheme` decides. The `dark` variant follows the same rule. Mode values come from the `theme-light` and `theme-dark` utilities, applied on `:root`.
5. **shadcn/ui, style `base-mira`, on Base UI.** Components live in `@synapcity/ui` (`packages/frontend/ui/src/components/ui`) and use `@base-ui/react` primitives, `class-variance-authority` and `lucide-react`. Both `components.json` files set `tailwind.config` to empty, `cssVariables: true` and `baseColor: neutral`. The web app's `components.json` routes the `ui` alias to `@synapcity/ui/core` and `utils` to `@synapcity/ui/lib/utils`, so `pnpm ui:add` (`shadcn add -c apps/web`) writes into the shared package.
6. **`shadcn/tailwind.css` is imported by each consuming app.** It supplies the `data-open` and `data-closed` variants and the accordion keyframes that the base-style overlay components use.
7. **Values.** Base radius 0.25rem (`--radius-base`), text base 0.9375rem (`--text-base-size`) with a fixed ladder derived from it, achromatic default palette. Classes use semantic tokens, never palette colours.
8. **Reduced motion and forced colours** are handled once, in `accessibility.css` and `base.css`, outside component code.

## Scope

How styling is owned, composed and extended. It does not choose which components exist, the product's colour identity, or the theme editor's behaviour.

## What this does NOT decide

- The theme editor, its persistence, or what writes user overrides (font overrides are ADR-0003).
- Density control and user text scale beyond the tokens that already exist.
- A component catalogue or visual-regression tool.
- Chromatic brand colours. `primary` and `accent` ramps are currently identical to the `base` ramp.

## Unresolved

- The `@source` line in each app that points into `packages/frontend/ui/src` is duplicated in `@synapcity/ui`'s own stylesheet. Whether one of them can go has not been tested.
- The `typeset.css` file is vendored from shadcn's typeset; whether upgrades are tracked as a dependency or a copy has not been decided.

## Governance boundary

The repository owner approves changes to token ownership, the shadcn style or base library, the dark-mode strategy, and any move from CSS-first to a JavaScript Tailwind config. Adding or editing a component is ordinary work done under `AGENTS.md`'s design rules.

## Integration expectations

- A new app imports `tailwindcss`, `shadcn/tailwind.css` and `@synapcity/ui/styles.css`, then adds `@source` for any workspace it renders classes from, because Tailwind v4 does not scan symlinked workspace packages by itself.
- Components import `cn` per ADR-0004 and use `className` for layout only.
- `shadcn add` must not write token blocks into an app's `globals.css`; if it does, remove them.

## Verification expectations

`pnpm build` succeeds. Inspecting the compiled stylesheet shows each token defined once, `--radius` derived from `--radius-base`, and no `--font-sans` self-reference. Light, dark and system-dark are checked by eye in a browser; this ADR's authors did not run that check.

## Reconsideration conditions

A second design language or brand, a requirement for per-region theming that CSS variables cannot meet, a shadcn change that breaks the `base-mira` + Base UI pairing, or a Tailwind major.
