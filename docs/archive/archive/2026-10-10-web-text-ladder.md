# Archived: web text-size ladder override

**Original location:** `apps/web/styles/globals.css`, inside `@theme inline` (lines 55–69 at the time).
**Archived at revision:** `2c5773f` (first committed in `8e8b451`).
**Archived on:** 2026-10-10.

## Why

The block redefined every `--text-*` token in terms of `--text-scale`, which resolved from `--text-scale-base`. Nothing defined `--text-scale-base`, so the web type utilities had no value to scale. It also competed with the documented ladder in `@synapcity/frontend-uiontend-ui-core` (`--text-base-size: 0.875rem`), and its multipliers read as 16px-based, which contradicts `DESIGN.md`. The founder chose the `ui-core` ladder (ADR-0016, "Unresolved": text size).

## Replacement

The `ui-core` ladder in `packages/ui/core/src/styles/globals.css`. The theme sheet applies text size by writing `--text-base-size`.

## The removed block

```css
  --text-scale: var(--text-scale-base);
  --text-base: var(--text-scale);
  --text-xs: calc(var(--text-scale) * 0.75);
  --text-sm: calc(var(--text-scale) * 0.875);
  --text-md: calc(var(--text-scale) * 1);
  --text-lg: calc(var(--text-scale) * 1.125);
  --text-xl: calc(var(--text-scale) * 1.25);
  --text-2xl: calc(var(--text-scale) * 1.5);
  --text-3xl: calc(var(--text-scale) * 1.75);
  --text-4xl: calc(var(--text-scale) * 2);
  --text-5xl: calc(var(--text-scale) * 2.5);
  --text-6xl: calc(var(--text-scale) * 3);
  --text-7xl: calc(var(--text-scale) * 3.5);
  --text-8xl: calc(var(--text-scale) * 4);
  --text-9xl: calc(var(--text-scale) * 5);
```

## Restoring

Paste the block back inside `@theme inline` in `apps/web/styles/globals.css`, or `git show 2c5773f:apps/web/styles/globals.css`. It will not work as written until `--text-scale-base` is defined.
