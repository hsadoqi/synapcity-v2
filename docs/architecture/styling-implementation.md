# Styling implementation: Tailwind v4, shadcn and custom CSS variables

**Status:** Proposed. This describes how styling currently works in the code. It does not govern. ADR-0002 (styling foundation) and ADR-0003 (typography) are the governing records; where this page and an ADR disagree, the ADR wins and this page is stale. See "Differences from the ADRs" below.

**Scope:** `@synapcity/frontend-tailwind-config`, `@synapcity/frontend-ui`, and the styling entry of `apps/web` and `apps/docs`.

**Not verified:** Read from source, plus one check of the compiled CSS (noted where used). Light, dark and system-dark have not been checked by eye in a browser by the author, and no test covers it.

## The idea in one paragraph

Every colour is a CSS variable, set once per mode. Tailwind utilities (`bg-background`) and shadcn components read those variables, so changing the mode, or one token, restyles everything without touching a component. Tokens are owned by one package. Apps contain only imports.

## The import chain

```text
apps/web/src/styles/globals.css
  @import 'tailwindcss'
  @import 'shadcn/tailwind.css'
  @import '@synapcity/frontend-ui/styles.css'
        └─ packages/frontend/ui/src/styles/globals.css
             @import '@synapcity/frontend-tailwind-config'
                  └─ shared-styles.css
                       @import './tokens/base.css'
                            ├─ tw-animate-css
                            ├─ accessibility.css   (reduced motion)
                            ├─ utilities.css       (theme-light, theme-dark values)
                            ├─ typography.css      (font defaults, typeset.css)
                            └─ variants.css        (the dark variant)
                       @theme inline { ... }       (maps variables to Tailwind)
```

Plus an `@source` line in each app and in the UI package, because Tailwind v4 does not scan symlinked workspace packages by itself (ADR-0002, Integration expectations).

## How one colour travels

Take the page background. It passes through three stages.

1. **Value, per mode.** `tokens/utilities.css` defines two `@utility` blocks, `theme-light` and `theme-dark`. Each sets `color-scheme` and the same set of variables, such as `--background`, with that mode's value.
2. **Selection.** `tokens/base.css` applies them: `@apply theme-light` on `:root`, `@apply theme-dark` on `.dark`, and `@apply theme-dark` on `:root:not(.light):not(.dark)` inside `@media (prefers-color-scheme: dark)`. The mode mechanism itself is described in [dark-mode.md](dark-mode.md).
3. **Utility.** `shared-styles.css` maps each variable into Tailwind's theme: `--color-background: var(--background)`. That makes `bg-background`, `text-foreground`, `border-border` and the rest exist as classes.

A component then writes a class and nothing else. In `button.tsx` the default variant is `bg-primary text-primary-foreground hover:bg-primary/80`, and the outline variant uses `border-border` and `dark:bg-input/30`.

### Why the mapping is `@theme inline`

With `inline`, Tailwind writes the variable reference into the utility instead of going through a theme variable. In the compiled CSS of `apps/docs`, the `body` rule (from `@apply bg-background`) comes out as `background-color: var(--background)`, and `--color-background` is not emitted at all. So the class follows whichever `--background` is currently active, which is exactly what switching `.dark` changes. Without `inline`, the value would be resolved where the theme variable is defined, and the mode switch would not reach it.

This was checked against Tailwind 4.3.3 as installed, on one rule. Other `--color-*` variables do appear in the output (for example `--color-foreground`, `--color-muted`); I did not investigate why, so do not assume `inline` suppresses all of them.

## The colour model

Three kinds of variable, from raw to semantic.

| Kind     | Examples                                                                                                               | Notes                                                                                              |
| -------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Ramps    | `--base-50` to `--base-950`, `--primary-*`, `--accent-*`                                                               | Eleven steps each. `primary` and `accent` currently point at `base`, so the palette is achromatic. |
| Semantic | `--background`, `--foreground`, `--muted`, `--border`, `--ring`, `--card`, `--popover`, `--secondary`, `--destructive` | What components use. Defined as steps of a ramp or as an `oklch()` value.                          |
| Status   | `--success`, `--warning`, `--info` (each with `-foreground`)                                                           | Beyond shadcn's defaults. Plain `oklch()` per mode.                                                |

The sidebar set (`--sidebar`, `--sidebar-primary`, and so on) follows shadcn's naming and is derived from the semantic values.

**The `base` ramp inverts in dark mode.** In `theme-light`, `--base-50` is near white and `--base-950` is near black. In `theme-dark` the same names hold the opposite values (`--base-50` is near black). That is why a semantic token such as `--foreground: var(--base-950)` is written identically in both modes yet produces opposite colours. A step name means "the lightest" or "the darkest" in the current mode, not a fixed shade.

**`--shadcn-primary`.** The semantic primary is stored as `--shadcn-primary` and mapped with `--color-primary: var(--shadcn-primary)`. The ramp keeps `--color-primary-50` to `--color-primary-950`. So `bg-primary` is the semantic colour and `bg-primary-500` is a ramp step. The repository does not record why the semantic one carries the `shadcn-` prefix; a reasonable reading is that it keeps it apart from the `--primary-*` ramp names.

**Selection tints** (`bg-selected`, `bg-sidebar-selected`) are `@utility` blocks that mix the background with 14% of the primary using `color-mix(in oklch, ...)`. They follow the mode automatically because both inputs are variables.

## Non-colour tokens

| Token                           | Defined in           | Value or rule                                                                         |
| ------------------------------- | -------------------- | ------------------------------------------------------------------------------------- |
| `--radius-base`                 | `base.css` (`:root`) | `0.25rem`. `--radius` is derived from it for shadcn.                                  |
| `--radius-xs` to `--radius-4xl` | `shared-styles.css`  | Multiples of `--radius-base` (0.5x to 2.6x).                                          |
| `--text-base-size`              | `base.css` (`:root`) | `0.9375rem`.                                                                          |
| `--text-xs` to `--text-5xl`     | `shared-styles.css`  | `calc(var(--text-base-size) * n / 15)`, each with its own line height.                |
| `--font-body/ui/heading/code`   | `shared-styles.css`  | Read `--font-preference-<role>` first, then the default loaded by the app (ADR-0003). |

Changing `--text-base-size` rescales the whole type ladder, and changing `--radius-base` rescales every radius. Never change `--spacing` in a component; it resizes every gap.

## How shadcn fits in

- **Style and base.** `components.json` sets style `base-mira`, `baseColor: neutral`, `cssVariables: true`, icons from `lucide`. Components use `@base-ui/react` primitives, `class-variance-authority` and the `cn` package (ADR-0004), not Radix.
- **No Tailwind config.** `tailwind.config` is empty in both `components.json` files, because Tailwind v4 is configured in CSS.
- **Where components land.** Components live in `packages/frontend/ui/src/components/ui` and are imported as `@synapcity/frontend-ui/core/<name>`. The web app's `components.json` routes the `ui` alias to `@synapcity/frontend-ui/core` and `utils` to `@synapcity/frontend-ui/lib/utils`. The UI package's own `components.json` uses local `@/` aliases and is not the one the add command reads.
- **Adding one.** Run `pnpm ui:add <name>` from the repository root. That script is `shadcn add -c apps/web`, so the files are written into the shared package.
- **`shadcn/tailwind.css`.** Each app imports it for the `data-open` and `data-closed` variants and the accordion keyframes that overlay components need.
- **Custom variables replace shadcn's.** shadcn normally writes a `:root`/`.dark` block and an `@theme inline` block into the app's CSS. Here those do not exist in apps. The same variable names (`--background`, `--primary`, `--radius`) are defined in the shared package instead. If `shadcn init` or `shadcn add` writes them back into an app's `globals.css`, remove them: the compiled CSS would then carry two competing definitions and the app's would silently win. This is the incident that ADR-0002 records.

## Recipes

**Change a colour.** Edit the value in `theme-light` and/or `theme-dark` in `tokens/utilities.css`. Do not edit a component, an app, or a `dark:` class.

**Give the product a brand colour.** Override the `--primary-*` ramp (and `--accent-*`) in both `theme-light` and `theme-dark`. Semantic tokens already point at the ramp. Choosing brand colour is an approval-gated product decision, and ADR-0002 lists it as not decided.

**Add a new semantic token.** Add the variable to both `theme-light` and `theme-dark`, then add `--color-<name>: var(--<name>)` to `@theme inline` in `shared-styles.css`. Both steps are needed: the first makes the value exist, the second makes a class exist.

**Add a new app.** Create `globals.css` with the three imports and an `@source` for each workspace it renders classes from. Re-export the PostCSS config from `@synapcity/frontend-tailwind-config/postcss`. Mount the provider with `attribute="class"` (see [dark-mode.md](dark-mode.md)).

## Gotchas

- **Missing `@source`.** If a class used inside a workspace package has no CSS, the app is probably not scanning that package.
- **Palette colours and `dark:` colours.** Use `bg-background`, not `bg-neutral-100` or `bg-white dark:bg-black`. A palette class ignores the mode system.
- **Bracket values inside `components/ui`** (for example `hover:bg-[color-mix(...)]` in the secondary button, `text-[0.625rem]` in the `xs` size) came from shadcn and are not a pattern to copy.
- **Reduced motion** is handled once in `accessibility.css`, outside every `@layer`, so it overrides component animation without `!important`.

## Differences from the ADRs

Found while writing this; none has been edited, because both are Canonical documents (see `docs/engineering/documentation.md`, "Stale-claim handling").

- ADR-0002 §2 says `shared-styles.css` composes `variants.css`, `base.css`, `utilities.css`, `accessibility.css` and `typeset.css`. In the code, `shared-styles.css` imports only `base.css`, which imports the rest, and `typeset.css` comes in through `typography.css`.
- Nothing else I checked disagrees: `tailwind.config` is empty and `cssVariables` is true in both `components.json` files, and the alias routing sits in the web app's file, as ADR-0002 §5 says.

## Observations for you to triage

- **A suspect fallback.** `shared-styles.css` defines `--font-body: var(--font-preference-body, var(--font-inter, --font-sans, system-ui))` and the compiled CSS keeps it literally. `--font-sans` there is a bare word, not `var(--font-sans)`, so it is read as a font family name, not a variable. It has no effect while `--font-inter` is set by the layout, but it looks unintended. Not changed.
- **`--font-preference-*` are unset by default.** Nothing defines them until the theme editor (ADR-0003) writes them, so each role falls through to the font the app loads.
- **Duplicated `@source`.** Already recorded as unresolved in ADR-0002.

## Revisit triggers

Update this page when a token moves, a new `@theme` or `@utility` block is added, `shadcn` or `tailwindcss` has a major release, or the brand colour is chosen.
