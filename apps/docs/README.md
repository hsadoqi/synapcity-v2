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

## Shared look

Docs shows the look chosen in the web app (mode, text size, density, fonts and the rest) and writes only the mode, through its mode toggle. Both apps read and write one cookie, `synapcity-look`; see the amendment in [ADR-0010](../../docs/architecture/decisions/0010-preference-persistence.md). The root layout validates and server-renders a request cookie, while the proxy renews a valid value through `Set-Cookie`; the boot scripts remain the migration fallback and resolve system mode in the browser.

`NEXT_PUBLIC_PREFERENCES_COOKIE_DOMAIN` sets the parent domain (the same value as in `apps/web`, inlined at build time). Empty keeps it host-only, so local development works across `localhost:8080` and `localhost:4000`. Production sharing additionally requires real sibling custom domains, such as `app.example.com` and `docs.example.com`, attached to the two hosting projects with DNS and TLS verified, and `.example.com` configured in both builds. A `*.vercel.app` preview domain is a public suffix and cannot be used as the shared cookie parent; previews therefore stay host-only. The production domains are not selected in this repository, so provider and DNS setup remains an explicit deployment action rather than an invented value.

## Structure

| Path                     | Contains                                                             |
| ------------------------ | -------------------------------------------------------------------- |
| `src/app/`               | Routes and the root layout, which loads Inter, Geist, Geist Mono     |
| `src/styles/globals.css` | Imports and `@source` lines only; no tokens                          |
| `components.json`        | shadcn config; routes added components into `@synapcity/frontend-ui` |

## Styling

The same rules as `apps/web`: no theme variables, `:root`/`.dark` rules, or font stacks here. Tokens come from `@synapcity/frontend-tailwind-config` ([ADR-0002](../../docs/architecture/decisions/0002-styling-foundation.md)) and fonts from the roles in [ADR-0003](../../docs/architecture/decisions/0003-typography-roles-and-font-preferences.md). Shared components come from `@synapcity/frontend-ui`; add them with `pnpm ui:add <name>` from the root.
