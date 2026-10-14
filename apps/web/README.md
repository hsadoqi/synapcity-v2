# web

Owns: the Synapcity web application: routes, page composition, font loading and app-level data. It is a composition root; reusable components live in `@synapcity/frontend-ui` and theme tokens in `@synapcity/frontend-tailwind-config`.

Next.js 16 (App Router) and React 19. See [ADR-0001](../../docs/architecture/decisions/0001-workspace-topology-and-toolchain.md) for the workspace and toolchain.

## Running it

From the repository root:

```bash
pnpm install
pnpm dev:web      # http://localhost:8080
```

Per-app checks run through the root scripts (`pnpm lint`, `pnpm check-types`, `pnpm build`); `pnpm verify` runs everything.

Tests: Vitest unit tests sit beside the code they cover as `*.test.ts` (`pnpm test` from the root, or `pnpm --filter web test`). They cover the pure auth helpers in `src/lib` (redirect guard, error messages, site origin, route policy); the server actions, the proxy and the pages are not unit-tested. `pnpm test:e2e` runs the Playwright smoke test against a production build.

## Environment variables

Set these in `apps/web/.env.local` (git-ignored) and, for deployments, in the hosting provider. Authentication is governed by [ADR-0006](../../docs/architecture/decisions/0006-authentication-with-supabase.md).

| Variable                               | Exposed to the browser | Purpose                                                                                                                          |
| -------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | yes                    | Supabase project URL                                                                                                             |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes                    | Supabase publishable key. Never put the secret or service-role key in this app                                                   |
| `SITE_URL`                             | no                     | Public origin of this app. Used to build email and OAuth redirect URLs; it must be on Supabase's redirect allow-list (see below) |

The app throws on the first sign-up, reset or OAuth call if `SITE_URL` is missing.

### `SITE_URL` per environment

Each environment has its own `SITE_URL`, and the emailed link only works if Supabase accepts it. In the Supabase dashboard (Authentication, URL Configuration), add one **Redirect URLs** entry per environment, written as `<SITE_URL>/auth/callback**`. The app appends `?next=…&flow=…` to the callback, and Supabase documents `**` as "any sequence of characters", so that entry covers it. Supabase's guide says the `redirectTo` must match the list, and it says nothing about whether an entry without the `**` also matches a URL carrying a query string, so confirm with a real sign-up before relying on that form.

| Environment | `SITE_URL`                             | Redirect URLs entry                              |
| ----------- | -------------------------------------- | ------------------------------------------------ |
| Local       | `http://localhost:8080`                | `http://localhost:8080/auth/callback**`          |
| Preview     | that deployment's own URL              | one exact entry per deployment; no wildcard host |
| Production  | the production domain (not chosen yet) | `https://<domain>/auth/callback**`               |

Also set Supabase's own **Site URL** (the same page) to the production origin: it is the fallback when a redirect is not on the list, and it is what the email templates use as `{{ .SiteURL }}`. A wildcard host such as `*.vercel.app` needs the owner's approval ([ADR-0006](../../docs/architecture/decisions/0006-authentication-with-supabase.md)); Supabase's own preview-URL example scopes it to a team slug, which is narrower but still a wildcard.

Previews are the sharp edge: a deployment URL that is not on the list does not get its auth links honoured, so auth email from an unlisted preview will not come back to that preview. Turborepo filters task environments to declared variables, so `SITE_URL` is listed under `globalPassThroughEnv` in `turbo.json`: tasks receive it, and changing it does not invalidate the build cache because it is read at request time, not compiled in.

If `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is missing, every request fails (the session proxy runs on all pages) with an error that names the variable. They are read at build time for the browser bundle, so CI and deployments must set them before `next build`; CI uses placeholders.

## Structure

| Path                     | Contains                                                             |
| ------------------------ | -------------------------------------------------------------------- |
| `src/app/`               | Routes and the root layout, which loads Inter, Geist, Geist Mono     |
| `src/styles/globals.css` | Imports and `@source` lines only; no tokens                          |
| `src/lib/`               | App-level helpers, including the `cn` re-export                      |
| `components.json`        | shadcn config; routes added components into `@synapcity/frontend-ui` |

## Styling

Do not add theme variables, `:root`/`.dark` rules, or font stacks here. Change tokens in `@synapcity/frontend-tailwind-config` ([ADR-0002](../../docs/architecture/decisions/0002-styling-foundation.md)) and fonts through the roles in [ADR-0003](../../docs/architecture/decisions/0003-typography-roles-and-font-preferences.md). Add components with `pnpm ui:add <name>` from the root.
