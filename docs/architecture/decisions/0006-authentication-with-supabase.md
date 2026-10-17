# ADR-0006: Authentication with Supabase Auth

**Status:** Accepted
**Date:** 2026-10-13
**Deciders:** Hanaa Sadoqi (repository owner)

## Context

The decisions index lists "Persistence, API, routing, authentication and state management" as open. The owner has created a Supabase project and asked for password and OAuth sign-in. `apps/web` runs Next.js 16.3.8 (App Router, React 19.2.8) and has no authentication, Supabase dependency or environment handling today.

Upstream evidence, read 2026-10-13:

- Next.js 16.3.8, bundled docs (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`): the `middleware` file convention is deprecated and renamed `proxy`; the file is `proxy.ts` and exports `proxy`.
- Supabase, "Setting up Server-Side Auth for Next.js" (<https://supabase.com/docs/guides/auth/server-side/nextjs>): packages `@supabase/supabase-js` and `@supabase/ssr`; env vars `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; one browser client and one server client under `lib/supabase/`; a root `proxy.ts` refreshes the session with `getClaims()`; `getSession()` must not be trusted for authorization; responses that set session cookies must not be cached by a CDN or ISR.
- A locally installed skill still describes `middleware.ts`, the `ANON_KEY` variable and `getUser()`. That guidance is stale for this repository and is not followed.
- The Supabase OAuth pages (Google, GitHub, redirect allow-list) were not read in full. Provider setup details are unverified.

## Decision

- Supabase Auth is the authentication provider for `apps/web`.
- Sign-in methods: email and password (sign up, sign in, sign out, email confirmation, password reset) and OAuth with Google and GitHub.
- Sessions are cookie-based through `@supabase/ssr`, using the PKCE flow. Session refresh happens in `apps/web/src/proxy.ts`.
- The initial implementation was placed in `apps/web`. The owner clarified on 2026-10-13 that this placement was not intended to restrict auth packages or further code splitting. This ADR chooses the auth provider and session behavior; app-local modules, an auth package, or a feature/service split may be selected through a subsequent owner-approved ownership/topology decision.
- Only the publishable key reaches the browser. The service-role or secret key is never exposed, never prefixed `NEXT_PUBLIC_`, and not used by this feature.
- Redirect URLs sent to Supabase (confirmation, reset, OAuth) are built from the server-side `SITE_URL` setting, never from request headers, so a forged `Origin` or `Host` cannot aim an email link at another site. The Supabase redirect allow-list should list exact URLs; a wildcard such as `*.vercel.app` weakens this and needs the owner's approval.
- Authorization checks on the server use `getClaims()` (or `getUser()` where fresh user data is required), never `getSession()`.
- Email confirmation is required before first sign-in. Email is sent through Supabase's default sender for now.
- Sign-ins that share a verified email address resolve to one user (Supabase's automatic identity linking). Observed on 2026-10-13: one address used for password, Google and GitHub sign-in produced a single user. This is only safe while confirmation is required and every enabled provider verifies emails; adding a provider that does not is a change to this ADR.
- Password sign-up never attaches a password to an account that already exists, including one created through Google or GitHub: Supabase returns a look-alike user and sends nothing, to prevent account discovery. The sign-up reply is therefore worded neutrally (it does not say a link was sent or name the address), and signed-in visitors are redirected away from `/auth/login` and `/auth/register`. Adding a password to a social account (Supabase documents `updateUser({ password })` while signed in) is not built; see Unresolved.
- Application data keyed to a user (a `profiles` table) lives in the Supabase Postgres database in the `public` schema, with row-level security enabled and an owner-scoped policy.

## Scope

How users authenticate to `apps/web` and how their session is held and refreshed.

## What this does NOT decide

- The general persistence model, API style or state management for product data. Supabase is chosen here for identity only.
- Authorization beyond "signed in" and "owns this row" (roles, teams, sharing).
- Which routes are protected. The first protected route is a proof, not a product decision.
- Account deletion, MFA, magic links, anonymous sign-in, additional OAuth providers (Apple and others).
- Deployment topology and the production domain.
- Whether `apps/docs` or other apps authenticate.

## Unresolved

- Applying the schema. `supabase/migrations/20261013162633_create_profiles.sql` (columns `display_name` and `avatar_url`, a signup trigger, owner-only RLS) is approved but is run by hand in the dashboard SQL editor. Whether to link the project and use `supabase db push`, and whether the repo adopts declarative schemas, is not yet chosen. The migration has been applied to the project.
- Email delivery: Supabase's default sender is rate-limited and meant for development; the owner accepted it for now, and a custom SMTP provider is needed before real users.
- Leaked password protection (checking passwords against HaveIBeenPwned) is unavailable on the Free plan. It should be enabled if the project moves to a paid plan; until then the minimum length of 8 and optional character-type rules are the only password-strength controls.
- Adding a password to a social account was confirmed for Google on 2026-10-17 (see the next item and Verification); GitHub is untested. Whether the password-reset email also works for such an account is untested, and the Supabase docs do not cover it. There is no dedicated account-settings page, and the app does not run Supabase's reauthentication step: an old session gets "sign out, sign in again, then try once more". Supabase's secure-password-change setting is a dashboard choice for the owner.
- Supabase's "Require current password" setting must stay off. Observed on 2026-10-17: with it on, a Google-only account got `current_password_required` from `updateUser({ password })`, because the form has no current-password field and such an account has no password to give. The owner chose to turn it off and turn on "Secure password change" (a password change needs a sign-in within the last 24 hours) instead. With those settings, a Google-only account set a password on production and then signed in with its email and that password (owner's manual check, 2026-10-17).
- Site URL and redirect allow-list values for local, preview and production, which depend on the undecided production domain.
- Provider-console configuration for Google and GitHub. It worked for local development on 2026-10-13, but was set up without first-party documentation having been read (see Context), so it is not verified against upstream guidance.

## Governance boundary

The repository owner approves changes to the provider, the session model, any persisted schema, new auth methods and any dependency upgrade (`AGENTS.md` §5 and §7a). `@supabase/ssr` and `@supabase/supabase-js` are pinned to exact versions and the lockfile is committed.

## Integration expectations

- Auth UI uses installed `@synapcity/frontend-ui` components and semantic tokens; no hardcoded colours or font stacks.
- The initial Supabase client setup lives in `apps/web/src/lib/supabase/`. Its owning adapter/module may move under an approved ownership/topology decision while preserving request-bound server clients and browser/server separation; client components never import the server client.
- Environment variable names and where they are set (local `.env.local`, Vercel) are documented; `.env*` stays git-ignored.
- Auth responses are not cached across users.

## Verification expectations

- `pnpm verify` passes.
- Manual, against the real Supabase project: sign up, confirm email, sign in, sign out, reset password, Google sign-in, GitHub sign-in, and an unauthenticated visit to the protected route redirecting to sign-in.
- Supabase advisors report no missing RLS on exposed tables; a second user cannot read or update another user's profile row.
- Automated tests cover only what they exercise; end-to-end OAuth is not automated and is reported as manually verified or not verified.

Verified manually on 2026-10-13 by the repository owner against the real project:

- Sign-up (password), confirmation, sign-in, sign-out, password reset, and Google and GitHub sign-in, each reaching the expected page.
- Same-email sign-ins resolved to one user.
- Signed-in visitors are redirected away from `/auth/login` and `/auth/register`.
- `profiles` exists with the expected columns, RLS enabled, the two owner-only policies, both triggers and both functions; `anon` has no grants and `authenticated` may select and update only `display_name` and `avatar_url`.
- The signup trigger created a profile for a new Google user with the provider's name and avatar.
- Impersonating a stranger, a profile was neither visible nor updatable; impersonating the owner, it was both, and `created_at` could not be changed. These ran as rolled-back SQL (`DO` blocks that set the role and JWT claims), not through the application.

Security advisors, first run on 2026-10-13: three warnings, none about objects this feature created. Two (`anon_security_definer_function_executable` and `authenticated_security_definer_function_executable`) concerned `public.rls_auto_enable()`, Supabase's own function behind the `ensure_rls` event trigger. `supabase/migrations/20261013184213_revoke_rls_auto_enable_execute.sql` revokes `EXECUTE` from `public`, `anon` and `authenticated`; after a revoke, a probe table created in a rolled-back block still had RLS enabled, and a second advisor run on the same day showed only the leaked-password warning. The third, leaked password protection, needs the Pro plan and cannot be enabled on the Free plan the project is on.

Not verified: profile isolation between two real accounts through the application, setting a password on a GitHub account and then signing in with it (the Google case was checked by hand on 2026-10-17), and automated tests of the server actions and the session proxy (the pure helpers are unit-tested).

## Reconsideration conditions

A requirement the cookie-session model cannot meet (for example native clients), a Supabase pricing or availability change, a security incident, or a decision to adopt a different persistence or identity stack.
