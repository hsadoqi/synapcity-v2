# ADR-0003: Typography roles and font preferences

**Status:** Accepted
**Date:** 2026-10-13
**Deciders:** Hanaa Sadoqi (repository owner)

## Context

Earlier guidance named one family for both interface and reading text (Geist) and let a font stack live in `layout.tsx`. The owner chose a different pairing: Inter for reading text, Geist for headings, Geist Mono for code. The app also loaded Inter under `--font-sans`, which collided with Tailwind's own `--font-sans` token and produced a self-referencing variable.

Evidence: `packages/frontend/tailwind-config/shared-styles.css`, `apps/web/src/app/layout.tsx`, and the compiled stylesheet.

## Decision

1. **Roles, not font names.** Components and styles use four roles:

   | Role             | Default    | Used for                               |
   | ---------------- | ---------- | -------------------------------------- |
   | `--font-body`    | Inter      | reading text                           |
   | `--font-ui`      | Inter      | controls, labels, menus (follows body) |
   | `--font-heading` | Geist      | `h1`–`h3` and display text             |
   | `--font-code`    | Geist Mono | `code`, `kbd`, `samp`, `pre`           |

   Tailwind's `font-sans` maps to `--font-body` and `font-mono` to `--font-code`.

2. **Geist Mono is for code only.** Interface controls are not set in the monospace face.
3. **User overrides are read first.** Each role resolves `var(--font-preference-<role>, <default>)`: `--font-preference-heading`, `--font-preference-body`, `--font-preference-code`, and optionally `--font-preference-ui`. With no override set, `--font-ui` follows the body choice. The override is written on `:root` by whatever applies user preferences.
4. **Loading.** `apps/web/src/app/layout.tsx` loads Inter through `next/font/google` as `--font-inter`, and Geist and Geist Mono through `next/font/local` as `--font-geist-sans` and `--font-geist-mono`. The three variable classes sit on `<html>`. Nothing else declares a font stack.
5. **Adding a selectable font** means adding a loader to the curated list in `layout.tsx` and a value the override can name. A component never imports a font.

## Scope

The font roles, their defaults and the override variable names.

## What this does NOT decide

- What writes `--font-preference-*`. No theme editor or persistence exists yet.
- Which fonts the curated user list contains beyond the three defaults.
- Persistence or server rendering of the chosen fonts (cookie, storage or database).
- Type scale values, which belong to ADR-0002.

## Unresolved

- Whether `--font-preference-ui` is exposed to users or stays an internal escape hatch.
- ~~The `.typeset-docs` rule referenced a `--font-geist` variable that did not exist.~~ Resolved: `typography.css` no longer declares `--font-inter`, `--font-geist`, `--font-geist-mono` or default `--font-preference-*` values on `:root`, which had shadowed the `next/font` variables and left headings on `system-ui`. `.typeset-docs` now references the role tokens.

## Governance boundary

The repository owner approves changes to the default pairing, the role set, or the override names. Adding a font to the curated list is ordinary work once the list's membership rule exists.

## Integration expectations

A future theme editor writes only the `--font-preference-*` names above. Server-rendered pages must emit the same values the client applies, to avoid a font flash.

## Verification expectations

The compiled stylesheet shows `body` in Inter, `h1`–`h3` in Geist, and `code`/`kbd`/`samp`/`pre` in Geist Mono, with no `--font-sans` self-reference. Setting a `--font-preference-*` value in DevTools changes the matching role. The first check was done on the compiled CSS; the DevTools check has not been done.

## Reconsideration conditions

A brand typeface, a licensing change to Inter or Geist, a requirement for scripts these fonts do not cover, or a measured loading cost that a system font stack would remove.
