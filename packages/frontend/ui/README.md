# @synapcity/ui

Owns: the shared React components (shadcn/ui, style `base-mira`, on Base UI), the `cn` class-merging helper, and the stylesheet entry that applies the shared theme.

It owns no theme tokens. Tokens live in `@synapcity/frontend-tailwind-config` ([ADR-0002](../../../docs/architecture/decisions/0002-styling-foundation.md)).

## Entry points

| Import                      | Provides                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------- |
| `@synapcity/ui/core/<name>` | A component, for example `@synapcity/ui/core/button`                                  |
| `@synapcity/ui/lib/utils`   | `cn` ([ADR-0004](../../../docs/architecture/decisions/0004-class-merging-with-cn.md)) |
| `@synapcity/ui/styles.css`  | The shared theme, imported once by each app                                           |

Installed components: `Button`, `Input`, `InputGroup`, `Label`, `Textarea`.

## Adding a component

From the repository root:

```bash
pnpm ui:add <component>
```

This runs the shadcn CLI against `apps/web`, whose `components.json` routes the `ui` alias to this package. Then edit the component here. Use a variant before reaching for `className`, and keep `className` to layout. If the CLI writes theme variables into an app's `globals.css`, remove them.

## Rules

- No Next.js routing, request APIs, Server Actions, or imports from `apps/*`. The package is application-runtime agnostic ([workspace conventions](../../../docs/architecture/workspace-conventions.md)).
- Colours come from semantic classes (`bg-background`, `text-muted-foreground`), never palette classes or `dark:` colours.
- Fonts are the roles `font-body`, `font-heading` and `font-code`. A component never declares a font stack ([ADR-0003](../../../docs/architecture/decisions/0003-typography-roles-and-font-preferences.md)).
