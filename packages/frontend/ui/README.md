# @synapcity/frontend-ui

Owns: the shared React components (shadcn/ui, style `base-mira`, on Base UI), the `cn` class-merging helper, and the stylesheet entry that applies the shared theme.

It owns no theme tokens. Tokens live in `@synapcity/frontend-tailwind-config` ([ADR-0002](../../../docs/architecture/decisions/0002-styling-foundation.md)).

## Entry points

| Import                                     | Provides                                                                                                                                 |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `@synapcity/frontend-ui/core/<name>`       | A shadcn component, for example `@synapcity/frontend-ui/core/button`                                                                     |
| `@synapcity/frontend-ui/components/<name>` | A Synapcity component, for example `.../components/link-button`                                                                          |
| `@synapcity/frontend-ui/blocks/<name>`     | A larger composition, for example `.../blocks/root-shell`                                                                                |
| `@synapcity/frontend-ui/providers/<name>`  | A context provider, for example `.../providers/mode-provider`                                                                            |
| `@synapcity/frontend-ui/lib/<name>`        | Helpers: `utils` (`cn`, [ADR-0004](../../../docs/architecture/decisions/0004-class-merging-with-cn.md)), `account-links`, `sidebar-data` |
| `@synapcity/frontend-ui/hooks/<name>`      | Hooks, for example `use-mobile`                                                                                                          |
| `@synapcity/frontend-ui/utils/<name>`      | Pure utilities, for example `theme`                                                                                                      |
| `@synapcity/frontend-ui/components`        | A barrel of every `core` and `components` export                                                                                         |
| `@synapcity/frontend-ui/blocks`            | A barrel of every block                                                                                                                  |
| `@synapcity/frontend-ui/styles.css`        | The shared theme, imported once by each app                                                                                              |

## Layout

Every component is a folder named after it. The folder is the unit; nothing sits loose beside its siblings.

```text
src/components/link-button/
  link-button.tsx          the component
  link-button.stories.tsx  stories (Storybook, with the a11y checks)
  link-button.test.tsx     tests (Vitest, jsdom)
  index.ts                 the folder's public surface: re-exports from ./link-button
```

- `components/ui/<name>/` holds shadcn components (`core/<name>`), `components/<name>/` the Synapcity ones, `blocks/<name>/` compositions and `providers/<name>/` providers. A block's sub-components are nested folders (`blocks/root-shell/root-header/`).
- The `exports` map in `package.json` resolves each wildcard entry to `<folder>/index.ts`, so an import names the folder, never a file.
- Code reaches any other folder through `@synapcity/frontend-ui/*`, including in stories and tests. A relative import may only name a file in the same folder (`./entity-icons`), such as an `index.ts` re-exporting its component or a component using a private helper beside it; never `../` or a path into a subfolder.
- `src/package-structure.test.ts` enforces all of this: each folder has its component, index, stories and tests; relative imports only to same-folder files; every specifier and `exports` entry resolves.

## Adding a component

From the repository root:

```bash
pnpm ui:add <component>
```

This runs the shadcn CLI against `apps/web`, whose `components.json` routes the `ui` alias to this package. The CLI writes a flat `src/components/ui/<name>.tsx`; move it into `src/components/ui/<name>/<name>.tsx` and add the index, stories and tests described above. Then edit the component here. Use a variant before reaching for `className`, and keep `className` to layout. If the CLI writes theme variables into an app's `globals.css`, remove them.

## Rules

- No Next.js routing, request APIs, Server Actions, or imports from `apps/*`. The package is application-runtime agnostic ([workspace conventions](../../../docs/architecture/workspace-conventions.md)).
- Colours come from semantic classes (`bg-background`, `text-muted-foreground`), never palette classes or `dark:` colours.
- Fonts are the roles `font-body`, `font-heading` and `font-code`. A component never declares a font stack ([ADR-0003](../../../docs/architecture/decisions/0003-typography-roles-and-font-preferences.md)).
