# Theme mode provider consolidation — design

**Status:** Draft for review. Not authoritative: it records a proposed design and approves nothing under `AGENTS.md` §5.
**Date:** 2026-10-10
**Source:** `docs/theme-tasks.md` ("Theme Mode Tasks"), sub-project A of five (A mode provider, B store and persistence, C primary ramp, D harmony, E accent).
**Governing record:** ADR-0016 (Proposed). This design is the "consolidate the duplicate dark-mode providers" work that ADR-0016 lists as separate.

## Purpose

One provider owns the light / dark / system mode, applies it before first paint, and keeps it across reloads. Today two providers disagree, the saved mode likely does not survive a reload, and system users get a flash.

## Evidence (current code)

| Fact | Where |
| --- | --- |
| `apps/web` mounts `ThemeProvider` (`mode`, `resolvedMode`, `setMode`). It writes cookie `appearance` and applies the class in an effect. | `packages/ui/core/src/providers/theme-provider.tsx`, `apps/web/app/root-providers.tsx` |
| Root layout reads cookie `theme`, so the two names never meet. | `apps/web/app/layout.tsx` |
| The layout puts a class on `<html>` only for explicit light or dark. For `system` it adds none and the provider adds one after hydration. | `apps/web/app/layout.tsx` |
| `DarkModeProvider` writes `theme`, sets `data-theme`, does not apply the class for `system`, and starts its system value as `light`. | `packages/ui/core/src/providers/dark-mode-provider.tsx` |
| `DarkModeProvider`, `useDarkMode`, `useDarkModePreference` are used only by the `dark-mode` block, its test, one export in `components/base/index.ts`, and a commented-out line in the command palette. | repository search |
| Web tests already use `ThemeProvider`. | `apps/web/components/root/*/*.test.tsx`, `theme-sheet.test.tsx` |
| `data-theme` is read only by `apps/web/public/brand-assets/synapcity-tokens.css`. | repository search |

## Decisions taken

Decisions 1 and 2 were put to the owner as questions and accepted as recommended. Decision 3 was covered by the owner's later blanket acceptance of all recommendations, not confirmed individually.

1. **`ThemeProvider` is canonical.** It is the single mode-concern provider, alongside the colour, typography and display providers (ADR-0016, "Structure": state is owned per concern by a provider). `DarkModeProvider` is archived, not deleted.
2. **Interim cookie name is `theme`.** The layout already reads it. This is a persisted identifier under `AGENTS.md` §5, so it is interim until sub-project B decides the key scheme.
3. **Pre-paint script, no new dependency.** A small blocking inline script sets the class before first paint. `next-themes` and a CSS-only fallback were considered and not chosen (the first is a new dependency and would replace the provider; the second duplicates the dark token block).

## Design

### 1. Provider contract (`@synapcity/frontend-ui-core`)

- Keep `mode`, `resolvedMode`, `setMode`, `useThemeMode`. Keep `resolvedMode` as `null` on the server and the first client render, to avoid a hydration mismatch.
- `setMode` writes cookie `theme` (1 year, `Path=/`, `SameSite=Lax`, `Secure` on https). Invalid input is ignored, as today.
- The provider stays in `ui-core` for now. ADR-0016 leaves the package location open.

### 2. Pre-paint script

- The script source is exported from `ui-core` next to the provider, so the resolve rule lives in one package and is tested with it.
- It reads the `theme` cookie, accepts only `light`, `dark` or `system`, falls back to `system` for anything else, resolves `system` through `matchMedia('(prefers-color-scheme: dark)')`, and sets exactly one of `light` / `dark` on `document.documentElement`.
- It is a static string. No user value is interpolated. The cookie value is checked against the allowlist before use.
- The root layout renders it in `<head>` and adds `suppressHydrationWarning` to `<html>`. The server-rendered class for explicit light or dark stays; the script is idempotent over it.

### 3. Migration

- Port `dark-mode-preference-control.tsx` and its test to `useThemeMode`. `preference` becomes `mode`, `mode` becomes `resolvedMode`.
- Remove the `DarkModeProvider` export from `components/base/index.ts` and from `providers/index.ts`.
- Move `dark-mode-provider.tsx` to `docs/archive/` with a short pointer note, following `docs/archive/2026-10-10-web-text-ladder.md`.
- Delete the commented-out `useDarkModePreference` line in the command palette.
- `data-theme` is no longer set. The only reader is a standalone brand-asset stylesheet; the plan must confirm nothing imports it before this is final.

## Verification

- Provider unit tests: initial mode, `setMode` both directions, cookie written with the right name and attributes, invalid input ignored, `system` follows a `matchMedia` change, `resolvedMode` is `null` before the client reads it.
- Script tests: runs against cookie × `matchMedia` combinations in jsdom; rejects a malformed cookie; parity test that the script and the provider resolve the same mode for the same inputs.
- The ported `dark-mode` block tests pass against `ThemeProvider`.
- Manual: reload with each of light, dark and system (system set to each) shows no flash; keyboard operation of the control is unchanged.
- Repository checks per `AGENTS.md` §6: `pnpm format:check`, `lint`, `typecheck`, `test`, `test:storybook`, `test:smoke`, `deps`, `deps:boundaries`, `docs:check`, `build`, `verify`.

## Not in scope

- The store, persistence keys beyond this interim name, and any database (sub-project B, needs its own approval).
- Colour ramps, harmony, accent (C, D, E).
- Where the theme providers live as a group (ADR-0016 leaves the package open).
- Renaming `ThemeProvider` or its hooks. Naming goes through `docs/glossary.md`.

## Approvals this needs

- Interim cookie `theme`: a persisted identifier (§5). Resolves the "Mode cookie name" item under ADR-0016 "Unresolved", so ADR-0016 needs a one-line amendment.
- Archiving `DarkModeProvider` is allowed by the preservation policy (archive over delete) but is named here so it is not a surprise.

## Open items for the plan

- Confirm nothing imports `apps/web/public/brand-assets/synapcity-tokens.css` before dropping `data-theme`.
- Confirm the `ui-core` public export surface (ADR-0005, exports-only) for the script constant.
