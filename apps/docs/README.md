# docs

Owns: the Synapcity documentation site. It is a separate Next.js app so documentation can ship independently of `apps/web`. Today it is a placeholder with a single page; no documentation content exists yet.

Next.js 16 (App Router) and React 19, on the same stack as `apps/web` ([ADR-0001](../../docs/architecture/decisions/0001-workspace-topology-and-toolchain.md)).

## Running it

From the repository root:

```bash
pnpm install
pnpm dev:docs     # http://localhost:4000
```

The shared checks run through the root scripts (`pnpm lint`, `pnpm check-types`, `pnpm build`); `pnpm verify` runs everything. This app has no tests of its own.

## Structure

| Path                     | Contains                                                             |
| ------------------------ | -------------------------------------------------------------------- |
| `src/app/`               | Routes and the root layout, which loads Inter, Geist, Geist Mono     |
| `src/styles/globals.css` | Imports and `@source` lines only; no tokens                          |
| `components.json`        | shadcn config; routes added components into `@synapcity/frontend-ui` |

## Styling

The same rules as `apps/web`: no theme variables, `:root`/`.dark` rules, or font stacks here. Tokens come from `@synapcity/frontend-tailwind-config` ([ADR-0002](../../docs/architecture/decisions/0002-styling-foundation.md)) and fonts from the roles in [ADR-0003](../../docs/architecture/decisions/0003-typography-roles-and-font-preferences.md). Shared components come from `@synapcity/frontend-ui`; add them with `pnpm ui:add <name>` from the root.
