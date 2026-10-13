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
- Code lives in `apps/web` only. No new workspace package is created.
- Only the publishable key reaches the browser. The service-role or secret key is never exposed, never prefixed `NEXT_PUBLIC_`, and not used by this feature.
- Authorization checks on the server use `getClaims()` (or `getUser()` where fresh user data is required), never `getSession()`.
- Email confirmation is required before first sign-in. Email is sent through Supabase's default sender for now.
- Sign-ins that share a verified email address resolve to one user (Supabase's automatic identity linking). Observed on 2026-10-13: one address used for password, Google and GitHub sign-in produced a single user. This is only safe while confirmation is required and every enabled provider verifies emails; adding a provider that does not is a change to this ADR.
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

- Applying the schema. `supabase/migrations/20261013162633_create_profiles.sql` (columns `display_name` and `avatar_url`, a signup trigger, owner-only RLS) is approved but is run by hand in the dashboard SQL editor. Whether to link the project and use `supabase db push`, and whether the repo adopts declarative schemas, is not yet chosen. Until the SQL is run and a second-user test passes, the `profiles` verification below is outstanding.
- Email delivery: Supabase's default sender is rate-limited and meant for development; the owner accepted it for now, and a custom SMTP provider is needed before real users.
- Site URL and redirect allow-list values for local, preview and production, which depend on the undecided production domain.
- Provider-console configuration for Google and GitHub. It worked for local development on 2026-10-13, but was set up without first-party documentation having been read (see Context), so it is not verified against upstream guidance.

## Governance boundary

The repository owner approves changes to the provider, the session model, any persisted schema, new auth methods and any dependency upgrade (`AGENTS.md` §5 and §7a). `@supabase/ssr` and `@supabase/supabase-js` are pinned to exact versions and the lockfile is committed.

## Integration expectations

- Auth UI uses installed `@synapcity/frontend-ui` components and semantic tokens; no hardcoded colours or font stacks.
- Supabase clients are created in `apps/web/src/lib/supabase/` and nowhere else; client components never import the server client.
- Environment variable names and where they are set (local `.env.local`, Vercel) are documented; `.env*` stays git-ignored.
- Auth responses are not cached across users.

## Verification expectations

- `pnpm verify` passes.
- Manual, against the real Supabase project: sign up, confirm email, sign in, sign out, reset password, Google sign-in, GitHub sign-in, and an unauthenticated visit to the protected route redirecting to sign-in.
- Supabase advisors report no missing RLS on exposed tables; a second user cannot read or update another user's profile row.
- Automated tests cover only what they exercise; end-to-end OAuth is not automated and is reported as manually verified or not verified.

## Reconsideration conditions

A requirement the cookie-session model cannot meet (for example native clients), a Supabase pricing or availability change, a security incident, or a decision to adopt a different persistence or identity stack.
