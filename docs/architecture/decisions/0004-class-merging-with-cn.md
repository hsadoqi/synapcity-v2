# ADR-0004: Class merging with the `cn` package

**Status:** Accepted
**Date:** 2026-10-13
**Deciders:** Hanaa Sadoqi (repository owner)

## Context

shadcn components merge class names with a `cn` helper. The long-standing form is `clsx` plus `tailwind-merge` in `lib/utils.ts`. This repository imports `cn` from the `cn` package (version 0.4.0). The shadcn manual-installation documentation (https://ui.shadcn.com/docs/installation/manual, read 2026-10-13) lists `cn` among the dependencies to install and shows `export { cn } from "cn"` in `lib/utils.ts`, so this is upstream's own current form. The package describes itself as a drop-in replacement for `clsx` + `tailwind-merge`.

The npm registry page could not be read in this session (HTTP 403), so the package's maintainer and release history were not independently checked.

## Decision

- Class names are merged with `cn` from the `cn` package.
- `@synapcity/frontend-ui` depends on `cn` and re-exports it from `src/lib/utils.ts` (`export { cn } from 'cn'`). Applications re-export it from `@synapcity/frontend-ui/lib/utils`.
- `clsx` and `tailwind-merge` are not added as direct dependencies.
- Components should import through the `utils` alias that `components.json` defines, so that `shadcn add` output and hand-written components match. Today `button.tsx` imports `cn` straight from `'cn'`; that is allowed but should be aligned when the file is next touched.

## Scope

How class names are merged in this repository.

## What this does NOT decide

- The class-variance and variant approach (`class-variance-authority` is in use but not governed here).
- A utility library for anything other than class merging.

## Unresolved

- The package's maintenance health and merge behavior have not been verified against `tailwind-merge` for this theme's custom tokens (for example `text-xs/relaxed` and the `--text-*` ladder).

## Governance boundary

The repository owner approves swapping the merge utility or adding `clsx` / `tailwind-merge`. A dependency upgrade is its own change (`AGENTS.md` §7a).

## Integration expectations

Every new component uses `cn()` for composition and never concatenates class strings or writes a ternary inside a `className` string.

## Verification expectations

`pnpm check-types` and `pnpm build` succeed; a component that passes conflicting classes (for example two `p-*` values) renders the later one.

## Reconsideration conditions

The package becomes unmaintained or is removed from shadcn's guidance, a merge bug appears with the custom theme tokens, or a supply-chain concern is raised about it.
