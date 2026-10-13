# web

Owns: the Synapcity web application: routes, page composition, font loading and app-level data. It is a composition root; reusable components live in `@synapcity/frontend-ui` and theme tokens in `@synapcity/frontend-tailwind-config`.

Next.js 16 (App Router) and React 19. See [ADR-0001](../../docs/architecture/decisions/0001-workspace-topology-and-toolchain.md) for the workspace and toolchain.

## Running it

From the repository root:

```bash
pnpm install
pnpm dev:web      # http://localhost:8080
```

Per-app checks run through the root scripts (`pnpm lint`, `pnpm check-types`, `pnpm build`); `pnpm verify` runs everything. There is no test runner yet.

## Structure

| Path                     | Contains                                                             |
| ------------------------ | -------------------------------------------------------------------- |
| `src/app/`               | Routes and the root layout, which loads Inter, Geist, Geist Mono     |
| `src/styles/globals.css` | Imports and `@source` lines only; no tokens                          |
| `src/lib/`               | App-level helpers, including the `cn` re-export                      |
| `components.json`        | shadcn config; routes added components into `@synapcity/frontend-ui` |

## Styling

Do not add theme variables, `:root`/`.dark` rules, or font stacks here. Change tokens in `@synapcity/frontend-tailwind-config` ([ADR-0002](../../docs/architecture/decisions/0002-styling-foundation.md)) and fonts through the roles in [ADR-0003](../../docs/architecture/decisions/0003-typography-roles-and-font-preferences.md). Add components with `pnpm ui:add <name>` from the root.
