# Dark mode: how it is handled

**Status:** Proposed. This describes how dark mode currently works in the code. It does not govern. The governing decision is ADR-0002 §4 ("Light and dark are explicit-or-system"); where this page and the ADR disagree, the ADR wins and this page is stale.

**Scope:** `apps/web`, `apps/docs`, `@synapcity/frontend-ui`, `@synapcity/frontend-tailwind-config`.

**Not verified:** The behavior below was read from source. It has not been checked in a browser by the author, and the repository has no test runner.

## The model in one paragraph

A single class on the root element, `<html class="dark">` or `<html class="light">`, forces a mode. When neither class is present, the browser's `prefers-color-scheme` decides. The class is the only switch: colours are CSS variables that change when the class changes, and components never branch on the mode themselves.

## The four pieces

| Layer                | Where                                                               | Job                                                                                                                |
| -------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Colour values        | `packages/frontend/tailwind-config/tokens/utilities.css`            | `theme-light` and `theme-dark` utilities define every colour variable and set `color-scheme`.                      |
| Selectors and `dark` | `packages/frontend/tailwind-config/tokens/base.css`, `variants.css` | Apply `theme-dark` under `.dark` (or under system-dark when no class is set). Define the Tailwind `dark:` variant. |
| State                | `packages/frontend/ui/src/providers/mode-provider.tsx`              | Thin wrapper over `next-themes`. Stores the choice, resolves "system", and writes the class onto `<html>`.         |
| Control              | `packages/frontend/ui/src/components/mode-toggle.tsx`               | A dropdown with Light, Dark and System. Calls `setTheme` from `useTheme()`.                                        |

### Colour values and selectors

`base.css` applies the two palettes like this:

- `:root` gets `theme-light`.
- `@media (prefers-color-scheme: dark)` gives `:root:not(.light):not(.dark)` the `theme-dark` palette. This is the "no explicit choice, follow the device" case.
- `.light` and `.dark` apply `theme-light` and `theme-dark` directly, which beats the media query because an explicit class is more specific than `:not(.light):not(.dark)`.

`variants.css` defines the Tailwind `dark` variant with the same rule: it matches inside `.dark`, or under `prefers-color-scheme: dark` unless inside `.light`. Utilities such as `dark:scale-100` therefore agree with the variables.

Because the variables carry both modes, components use semantic classes (`bg-background`, `text-muted-foreground`) and never a hand-written `dark:` colour. A `dark:` variant is only appropriate for non-colour behavior, like the icon rotation in the toggle.

### State

`ModeProvider` forwards its props to `ThemeProvider` from `next-themes`. Each app's `providers.tsx` mounts it with:

```tsx
<ModeProvider attribute="class" defaultTheme="system" enableSystem>
```

- `attribute="class"` makes `next-themes` toggle `.light` / `.dark` on `<html>`, which is what the CSS above reads.
- `defaultTheme="system"` and `enableSystem` mean a first-time visitor follows their device.
- `next-themes` persists the choice in `localStorage` and injects a small inline script before first paint, which avoids a flash of the wrong theme.
- `attribute="class"` is required, not optional. `next-themes` defaults to `data-theme`, which nothing in the CSS reads. Omitting it (as `apps/docs` briefly did) makes the toggle appear to work while no colours change.

### Control

`ModeToggle` is a dropdown trigger (`ModeButton`) plus three items (`ModeMenu`). Selecting an item calls `setTheme("light" | "dark" | "system")`. The sun and moon icons cross-fade using the `dark:` variant, not JavaScript.

## Wiring rules

1. **`ModeToggle` must render inside `ModeProvider`.** In `apps/web/src/app/layout.tsx` the toggle is a child of `<RootProviders>`. `useTheme()` outside a provider does not throw. It returns a default whose `setTheme` is an empty function, so the click handler runs, nothing changes, and no `.dark` class appears. This was the cause of an earlier bug where the new theme was logged but the page did not update.
2. **Put `suppressHydrationWarning` on `<html>`.** `next-themes` changes the `class` attribute before React hydrates, so React would otherwise warn about a mismatch.
3. **Do not set `:root`, `.dark` or `@theme` rules in an app's `globals.css`.** Colour values are changed once, in `utilities.css` (ADR-0002 §3).
4. **Import from the package exports.** Providers are `@synapcity/frontend-ui/providers/*`, and the toggle is `@synapcity/frontend-ui/components/mode-toggle`.

## Debugging checklist

If the mode does not change:

1. Does `<html>` gain or lose `class="dark"` when you pick an option? If not, the provider is missing or the component is outside it (rule 1).
2. If the class changes but colours do not, check that the element uses semantic colour classes and not a palette colour.
3. If "System" does not follow the device, check that `enableSystem` is set on the provider and that no `.light` or `.dark` class is hard-coded on `<html>`.
4. If a flash of the wrong theme appears on load, check that `suppressHydrationWarning` is on `<html>` and that the provider is in the root layout, not a nested one.

## Known gaps and open items

- `mode-toggle.tsx` uses `h-[1.2rem] w-[1.2rem]` bracket values, which the design rules discourage. A scale step such as `size-5` would change the icon size, so it needs a decision.
- `apps/web` and `apps/docs` each have their own `providers.tsx` with identical content. The duplication is how they drifted apart once already; sharing one provider config from `@synapcity/frontend-ui` would remove that risk but is a separate decision.
- A debug `console.log` remains in `handleModeChange`.
- The `dark-mode-provider.tsx` filename was renamed to `mode-provider.tsx`. The archived note `docs/archive/archive/2026-10-10-dark-mode-provider.md` describes a different, earlier provider from the previous implementation and is historical only.
- Light, dark and system-dark have not been checked by eye (ADR-0002 states the same).

## Revisit triggers

Change this page when the dark-mode strategy changes (this needs repository-owner approval under ADR-0002), when `next-themes` is replaced, or when the theme editor starts writing user colour overrides.
