# web

Owns: the Synapcity web application: routes, page composition, font loading and app-level data. It is a composition root; reusable components live in `@synapcity/frontend-ui` and theme tokens in `@synapcity/frontend-tailwind-config`.

Next.js 16 (App Router) and React 19. See [ADR-0001](../../docs/architecture/decisions/0001-workspace-topology-and-toolchain.md) for the workspace and toolchain.

## Running it

From the repository root:

```bash
pnpm install
pnpm dev:web      # http://localhost:8080
```

Per-app checks run through the root scripts (`pnpm lint`, `pnpm check-types`, `pnpm build`); `pnpm verify` runs everything. Start `pnpm verify` from the repository root: inside `apps/web`, `pnpm verify` is this package's own script (`lint`, `check-types`, `build` only) and skips the tests, end-to-end run, Storybook tests, `deps` and `boundaries`.

Tests: Vitest unit tests sit beside the code they cover as `*.test.ts` (`pnpm test` from the root, or `pnpm --filter web test`). They cover the pure auth helpers and route policy in `src/lib`, the auth and profile server actions (with the Supabase client replaced), the auth callback route handler, the session proxy (`src/lib/supabase/middleware.ts`) and an import-boundary check (`src/architecture.test.ts`). Component and hook tests that need a DOM are named `*.dom.test.tsx` and run in jsdom; everything else runs in Node. `pnpm test:e2e` runs the Playwright tests against a production build. The authenticated shared-look case is opt-in: save a session for an account with saved preferences to `e2e/.auth/account.json` (ignored by Git); the test reads account preferences and does not change them. The dashboard server-path case (`e2e/dashboard-persistence.e2e.ts`) is opt-in the same way: it needs that saved session of a dedicated test account (or `E2E_AUTH_STATE`) and `E2E_DASHBOARD_PATH`, the path of an empty dashboard the account owns, and it adds and removes widgets on it. `e2e/dashboard-edit.e2e.ts` runs on the development fixture identity (`SYNAPCITY_DEV_AUTH=fixture` with a dev server) and keeps the composition in the browser, so it covers the interface, not the database.

These tests replace the Supabase client, so they do not prove live email delivery, OAuth round trips, cookie behavior across tabs or database policies (RLS). Those need a live run against a real project. Pages are covered only by the end-to-end tests.

## Environment variables

Set these in `apps/web/.env.local` (git-ignored) and, for deployments, in the hosting provider. Authentication is governed by [ADR-0006](../../docs/architecture/decisions/0006-authentication-with-supabase.md).

| Variable                                | Exposed to the browser | Purpose                                                                                                                                                                    |
| --------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`              | yes                    | Supabase project URL                                                                                                                                                       |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`  | yes                    | Supabase publishable key. Never put the secret or service-role key in this app                                                                                             |
| `SITE_URL`                              | no                     | Public origin of this app. Used to build email and OAuth redirect URLs; it must be on Supabase's redirect allow-list (see below)                                           |
| `NEXT_PUBLIC_SENTRY_DSN`                | yes                    | Optional. Sentry DSN for error reports, sent only after someone turns them on (see below)                                                                                  |
| `NEXT_PUBLIC_PREFERENCES_COOKIE_DOMAIN` | yes                    | Optional. Valid parent DNS domain for the shared look cookie (for example `.example.com`). Empty means host-only. Set the same value in the web and docs production builds |

The app throws on the first sign-up, reset or OAuth call if `SITE_URL` is missing.

### A worktree has no `.env.local`

`.env.local` is git-ignored, so a new worktree starts without it and the server answers every page with 500. For `pnpm test:e2e` and `pnpm verify`, pass the same placeholders CI uses (they hold no credentials and nothing contacts Supabase):

```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321 \
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=ci-placeholder-key \
SITE_URL=http://localhost:8080 \
pnpm verify
```

Do not copy another checkout's `.env.local` into a worktree; it may hold real project values.

### Running Playwright from several worktrees

`pnpm test:e2e` (and `pnpm --filter web exec playwright test`) picks a free port for web and docs on every run, starts both servers from the checkout it runs in, sets `SITE_URL` to the web origin it serves, prints the addresses (`[e2e] web: http://localhost:<port>`) and stops the servers when it ends. Nothing listens on a fixed port, an already-running server is never reused, and two worktrees can run it at the same time. Both apps must be built in that checkout first (`pnpm build` does this; `test:e2e` depends on it). `E2E_WEB_PORT` and `E2E_DOCS_PORT` pin a port to reproduce a run; a taken port fails the run. `E2E_WEB_MODE=dev` serves `next dev` instead of the build, for the fixture-identity specs (`SYNAPCITY_DEV_AUTH=fixture`, see `docs/engineering/quality-gates.md`); the dev server is also started and stopped by the run, and a fixture run needs `--workers=2` or fewer to avoid a cold-compile timeout. The local-session suite below is the exception: it attaches to a server you start.

### Signed-in checks against the local Supabase stack

`pnpm test:e2e:local-session` (from `apps/web`) runs `e2e/local-session.e2e.ts`: sign-in, the account menu, public and auth pages signed in, 404 shells, protected-page metadata, sign-out and a real `/auth/callback` code exchange from a password-reset mail. It needs:

1. The local stack running (`supabase start`; project `synapcity`, API on `127.0.0.1:54321`, mail on `54324`). The runner reads the keys from `supabase status` into its own environment and refuses a non-loopback address; nothing is printed or written.
2. The app built against that stack and serving on `http://127.0.0.1:3000` (the stack's `site_url`, which email links may return to): put `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SITE_URL=http://127.0.0.1:3000` in `.env.local`, then `pnpm build` and `pnpm exec next start -p 3000`.

The run creates one `route-groups-e2e-…@example.test` user in the local stack and removes it and its mail afterwards. In an ordinary `pnpm test:e2e` the file is skipped. The browser follows the mailed link's redirects itself; nothing is mapped to another host.

### Shared-look production domains

Localhost works across ports without a `Domain` attribute. Production requires two real sibling hosts under one selected parent—for example `app.example.com` for this project and `docs.example.com` for the docs project—and `NEXT_PUBLIC_PREFERENCES_COOKIE_DOMAIN=.example.com` in both production builds. Attach each exact host to its hosting project, apply the DNS records the provider reports, wait for verification/TLS, deploy both apps with the same setting, then verify that a look changed on one host appears on the other and that an HTML response renews `synapcity-look` with `Domain=.example.com`, `Secure`, `SameSite=Lax` and a one-year `Max-Age`.

Preview deployments remain host-only: `vercel.app` is a public suffix, so a browser will reject `Domain=.vercel.app`. The production domain is still an open deployment-topology decision; do not replace the example above with a guessed domain or mutate DNS/provider state without the owner's exact targets.

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

| Path                     | Contains                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| `src/app/`               | Routes in `(public)`, `(auth)` and `(protected)` groups; the root layout (fonts, providers) |
| `src/styles/globals.css` | Imports and `@source` lines only; no tokens                                                 |
| `src/lib/`               | App-level helpers, including the `cn` re-export                                             |
| `components.json`        | shadcn config; routes added components into `@synapcity/frontend-ui`                        |

## Styling

Do not add theme variables, `:root`/`.dark` rules, or font stacks here. Change tokens in `@synapcity/frontend-tailwind-config` ([ADR-0002](../../docs/architecture/decisions/0002-styling-foundation.md)) and fonts through the roles in [ADR-0003](../../docs/architecture/decisions/0003-typography-roles-and-font-preferences.md). Add components with `pnpm ui:add <name>` from the root.
