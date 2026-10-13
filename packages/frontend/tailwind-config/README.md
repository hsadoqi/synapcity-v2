# @synapcity/frontend-tailwind-config

Owns: the Tailwind v4 theme for every app and package: colour ramps and semantic colours, light and dark values, the type ladder, the radius scale, the font roles, base element styles, reduced-motion and forced-colours handling, and the shared PostCSS config ([ADR-0002](../../../docs/architecture/decisions/0002-styling-foundation.md)).

Nothing else defines a token. An app's `globals.css` contains imports and `@source` lines only.

## Layout

| File                       | Contains                                                                         |
| -------------------------- | -------------------------------------------------------------------------------- |
| `shared-styles.css`        | The entry. Imports the files below and maps tokens to Tailwind (`@theme inline`) |
| `tokens/variants.css`      | The `dark` variant: `.dark`, or system preference when no class is set           |
| `tokens/utilities.css`     | `theme-light` and `theme-dark` colour values, selection utilities                |
| `tokens/base.css`          | Base element styles, `tw-animate-css`, `:root` defaults (radius, text size)      |
| `tokens/accessibility.css` | Reduced motion                                                                   |
| `tokens/typeset.css`       | Vendored shadcn typeset for long-form text                                       |
| `postcss.config.mjs`       | Exported as `@synapcity/frontend-tailwind-config/postcss`                        |

## Using it

An app imports, in this order, `tailwindcss`, `shadcn/tailwind.css` and `@synapcity/ui/styles.css` (which imports this package), then adds an `@source` line for each workspace whose classes it renders. Its `postcss.config.mjs` re-exports `postcssConfig` from `@synapcity/frontend-tailwind-config/postcss`.

## Fonts

Roles are `--font-body`, `--font-ui`, `--font-heading` and `--font-code`. Each reads `--font-preference-<role>` first and falls back to the default loaded by the app ([ADR-0003](../../../docs/architecture/decisions/0003-typography-roles-and-font-preferences.md)). The fonts themselves are loaded by the app, not here.
