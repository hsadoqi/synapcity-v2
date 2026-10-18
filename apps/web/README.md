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

Tests: Vitest unit tests sit beside the code they cover as `*.test.ts` (`pnpm test` from the root, or `pnpm --filter web test`). They cover the pure auth helpers and route policy in `src/lib`, the auth and profile server actions (with the Supabase client replaced), the auth callback route handler, the session proxy (`src/lib/supabase/middleware.ts`) and an import-boundary check (`src/architecture.test.ts`). Component and hook tests that need a DOM are named `*.dom.test.tsx` and run in jsdom; everything else runs in Node. `pnpm test:e2e` runs the Playwright tests against a production build.

These tests replace the Supabase client, so they do not prove live email delivery, OAuth round trips, cookie behavior across tabs or database policies (RLS). Those need a live run against a real project. Pages are covered only by the end-to-end tests.

## Environment variables

Set these in `apps/web/.env.local` (git-ignored) and, for deployments, in the hosting provider. Authentication is governed by [ADR-0006](../../docs/architecture/decisions/0006-authentication-with-supabase.md).

| Variable                               | Exposed to the browser | Purpose                                                                                                                          |
| -------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | yes                    | Supabase project URL                                                                                                             |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes                    | Supabase publishable key. Never put the secret or service-role key in this app                                                   |
| `SITE_URL`                             | no                     | Public origin of this app. Used to build email and OAuth redirect URLs; it must be on Supabase's redirect allow-list (see below) |
| `NEXT_PUBLIC_SENTRY_DSN`               | yes                    | Optional. Sentry DSN for error reports, sent only after someone turns them on (see below)                                        |

The app throws on the first sign-up, reset or OAuth call if `SITE_URL` is missing.

### Development fixture mode

By default, development uses real Supabase auth like every other environment. To browse the signed-in pages without a Supabase project, set `SYNAPCITY_DEV_AUTH=fixture` in `apps/web/.env.local` and restart the dev server. You are then a fixed fixture user at `/fixture-user/home`; the header shows "Fixture mode", and sign-in, sign-up, recovery, OAuth, sign-out and every account change (name, photo, email, password, connected accounts, account deletion and synced preferences) are rejected before any Supabase call. Settings still work, from browser storage only. It only works when `NODE_ENV` is `development`; test and production ignore it. See the amendment in [ADR-0006](../../docs/architecture/decisions/0006-authentication-with-supabase.md).

### Error reports (Sentry)

Error reports are off for everyone until a person turns them on in Settings, under Data privacy; until then the Sentry SDK is not even downloaded. With `NEXT_PUBLIC_SENTRY_DSN` unset, nothing is sent at all. The app sends browser errors only, without breadcrumbs, user data, cookies, headers or query strings, and replaces ids in URLs. In the Sentry project settings, also turn on **Prevent Storing of IP Addresses** (Security & Privacy), because Sentry can see the address a report was sent from, and the privacy notice at `/privacy` says reports carry nothing that identifies the person.

Reports are labelled with `NEXT_PUBLIC_VERCEL_ENV` and `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA`, which Vercel sets on its builds; elsewhere the environment is `NODE_ENV`, so local errors show as `development`, not `production`.

Not set up yet, each a separate change:

- **Source maps.** Production stack traces are minified until source maps are uploaded at build time (for example `sentry-cli sourcemaps inject` and `upload` in CI, then deleting the maps from the deployment). That needs a Sentry auth token as a CI secret. Do not bring back `withSentryConfig` for this: it also instruments the server.
- **Ad blockers.** Many block `*.sentry.io`, so some reports never arrive. Sentry's `tunnel` option fixes this through an app route that forwards reports; that route must accept only this project's DSN, or it becomes an open relay.
- **Server errors.** Only browser errors are reported. Server reporting needs the person's consent on the server, which waits on ADR-0010.

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

## Supabase settings and migrations the account flows depend on

Set in the Supabase dashboard, or run by hand in its SQL editor (the repository does not apply migrations). Each item says what breaks without it.

| Where                               | Setting                                                                                                                                                                           | Without it                                                                                                       |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Authentication, Sign In / Providers | **Enable Manual Linking** (beta, off by default)                                                                                                                                  | Connecting or disconnecting Google or GitHub from settings fails; the page says linking is switched off.         |
| Authentication, Sign In / Providers | Password strength: 8 characters, lowercase, uppercase, digits and symbols (already set by the owner)                                                                              | The form's rule and the project's would differ; the form never asks for less than the project.                   |
| Authentication, Sign In / Providers | **Secure email change** either way                                                                                                                                                | The wording is true for both settings. On, an email change needs a link from each address.                       |
| Authentication, URL Configuration   | Redirect URLs entry `<SITE_URL>/auth/callback**` (above)                                                                                                                          | No emailed link or provider sign-in returns, including email change, connecting an account and account deletion. |
| Authentication, Email Templates     | The **Magic Link** template is what account deletion sends, so it reads as a sign-in link. Its wording is the owner's to edit; the link itself must stay `{{ .ConfirmationURL }}` | The deletion email is the stock sign-in email.                                                                   |
| Storage                             | Bucket `avatars` with owner-folder policies: `supabase/migrations/20261017113500_create_avatars_bucket.sql`                                                                       | Photo upload fails.                                                                                              |
| SQL editor                          | `supabase/migrations/20261017122000_profiles_signup_read_google_picture.sql`                                                                                                      | A new Google account starts with no stored photo (the header still shows it).                                    |
| SQL editor                          | `supabase/migrations/20261017140000_delete_own_account.sql`. **Irreversible once called.** Read it first                                                                          | Account deletion reaches its last button and then fails with "Could not delete your account".                    |

Not verified against a real project at the time of writing: the avatars and Google-picture migrations were run by the owner (the first confirmed, the second unconfirmed), and the deletion migration has not been run. The first of two email-change links is assumed to return with a message and no code. An emailed link is assumed to record `otp` or `magiclink` in the token; if it records another name, deletion refuses and does nothing (it fails closed).

## Structure

| Path                     | Contains                                                             |
| ------------------------ | -------------------------------------------------------------------- |
| `src/app/`               | Routes and the root layout, which loads Inter, Geist, Geist Mono     |
| `src/styles/globals.css` | Imports and `@source` lines only; no tokens                          |
| `src/lib/`               | App-level helpers, including the `cn` re-export                      |
| `components.json`        | shadcn config; routes added components into `@synapcity/frontend-ui` |

## Styling

Do not add theme variables, `:root`/`.dark` rules, or font stacks here. Change tokens in `@synapcity/frontend-tailwind-config` ([ADR-0002](../../docs/architecture/decisions/0002-styling-foundation.md)) and fonts through the roles in [ADR-0003](../../docs/architecture/decisions/0003-typography-roles-and-font-preferences.md). Add components with `pnpm ui:add <name>` from the root.
