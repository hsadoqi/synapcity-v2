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
- Which routes are protected beyond the signed-in owner area (`/<userId>/home` and `/<userId>/settings`). The owner area's organization is settled by the route-group amendment below; any other protected route, and any public route, is not.
- Account deletion, MFA, magic links, anonymous sign-in, additional OAuth providers (Apple and others).
- Deployment topology and the production domain.
- Whether `apps/docs` or other apps authenticate.

## Unresolved

- Applying the schema. `supabase/migrations/20261013162633_create_profiles.sql` (columns `display_name` and `avatar_url`, a signup trigger, owner-only RLS) is approved but is run by hand in the dashboard SQL editor. Whether to link the project and use `supabase db push`, and whether the repo adopts declarative schemas, is not yet chosen. The migration has been applied to the project.
- Email delivery: Supabase's default sender is rate-limited and meant for development; the owner accepted it for now, and a custom SMTP provider is needed before real users.
- Leaked password protection (checking passwords against HaveIBeenPwned) is unavailable on the Free plan. It should be enabled if the project moves to a paid plan; until then the minimum length of 8 and optional character-type rules are the only password-strength controls.
- Adding a password to a social account was confirmed for Google on 2026-10-17 (see the next item and Verification); GitHub is untested. Whether the password-reset email also works for such an account is untested, and the Supabase docs do not cover it. There is no dedicated account-settings page, and the app does not run Supabase's reauthentication step: an old session gets "sign out, sign in again, then try once more". Supabase's secure-password-change setting is a dashboard choice for the owner.
- Supabase's "Require current password" setting must stay off. Observed on 2026-10-17: with it on, a Google-only account got `current_password_required` from `updateUser({ password })`, because the form has no current-password field and such an account has no password to give. The owner chose to turn it off and turn on "Secure password change" (a password change needs a sign-in within the last 24 hours) instead. With those settings, a Google-only account set a password on production and then signed in with its email and that password (owner's manual check, 2026-10-17).
- The production domain, and with it the production `SITE_URL` and its redirect allow-list entry. The per-environment rule is decided (2026-10-14): one `SITE_URL` per environment, each on the allow-list as `<SITE_URL>/auth/callback**` with exact hosts and no wildcard host, as set out in the `apps/web` README. Supabase's [Redirect URLs guide](https://supabase.com/docs/guides/auth/redirect-urls) was read for this; it does not state whether an entry without `**` matches a redirect that carries a query string, so that form is unverified.
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

## Amendment 2026-10-17: development fixture mode

Approved by the repository owner (decision D1 of `docs/superpowers/plans/2026-10-16-auth-review-follow-ups.md`, recommended option). Real Supabase verification is the default in every environment, including development. Fixture browsing of the owner-area pages is kept only as an explicit server-side opt-in.

| Mode             | When                                                    | Identity                          | Owner-area pages                | Mutations                                    |
| ---------------- | ------------------------------------------------------- | --------------------------------- | ------------------------------- | -------------------------------------------- |
| Real (default)   | Always, unless the flag below is set; all of production | Supabase verified claims          | Verified owner (`requireOwner`) | Normal                                       |
| Fixture (opt-in) | `NODE_ENV=development` and `SYNAPCITY_DEV_AUTH=fixture` | Fixed display user, not a session | Fixture user's id only, marked  | Rejected before a Supabase client is created |

- `getVerifiedClaims()` keeps meaning provider-verified claims; a fixture is never returned from it. `requireOwner` returns a tagged result (`verified` or `fixture`).
- The flag is read on every call by `apps/web/src/lib/access/dev-fixture.ts`; `test` and `production` ignore it. It is declared in `turbo.json` (`globalPassThroughEnv`). This is a new durable configuration name, approved with the amendment.
- Fixture mode skips the session proxy and the browser auth subscription, shows a visible "Fixture mode" label, and the settings page and every auth and profile action explain that account actions are unavailable.
- The previous unconditional development bypass (`development-auth.ts`, on `v0/supabase-environment-error-df72e1eb`) is not carried over; it is retained there as evidence only.

## Amendment, 2026-10-17: account and credential flows added on this branch

Additions made at the repository owner's request. They keep the decision above (Supabase Auth, `@supabase/ssr` cookie sessions, `getClaims` on the server, PKCE through `/auth/callback`); none changes it.

- **Change of email** from settings: `updateUser({ email }, { emailRedirectTo })`. Nothing changes until a link is used; the waiting address is read back from the provider (`user.new_email`) and shown until confirmed. Flow tag `email-change`.
- **Password reset from settings**: the existing reset link, sent to the signed-in person's own address, returning to settings. No password is handled in settings.
- **Password rule** for choosing a password: at least 8 characters with a lowercase letter, an uppercase letter, a digit and a symbol. It mirrors the project's Supabase password settings (the owner set them in the dashboard) and uses Supabase's documented symbol set, so the form never rejects what the provider accepts. Sign-in does not apply it, since an older account may predate it.
- **Linked accounts**: Google and GitHub rows in settings, connecting with `linkIdentity` (flow tag `link`). Needs "Enable Manual Linking" in the project's Auth settings. Disconnecting is not built.
- **Account deletion**: a confirm dialog, the address typed, then an emailed link (`signInWithOtp` with `shouldCreateUser: false`, flow tag `delete-account`) that opens a page with a final button. Deleting needs an emailed-link sign-in in the last 10 minutes, read from the verified `amr` claim. The app holds no service-role key, so the deletion is the Postgres function `public.delete_own_account()` (a `SECURITY DEFINER` function that checks the same rule and deletes only `auth.uid()`), shipped as a migration the owner runs by hand. Avatar files are removed first through the Storage API, best effort. Irreversible.
- **Welcome step** after a sign-up or a first provider sign-in (`/auth/welcome`), driven by the `profile_confirmed` user-metadata key. The key is metadata, not a column; where profile data should live stays open (see Unresolved).
- **Notices across a redirect**: `?notice=<key>` from a fixed list in `lib/routing/notices.ts`; an unknown key is ignored and nothing is authorized by it.
- **Error boundaries**: `app/error.tsx`, `app/not-found.tsx` and a styled `app/global-error.tsx`, which needed the font loaders moved to `app/fonts.ts` (see the dated note in ADR-0003).
- **Validation**: zod schemas in each feature's `types/` are the standard for form input.
- **Development fixture mode** (amendment above) covers these flows too: every server action they add refuses before a Supabase client is created, and the settings page and root layout read no provider record or preferences row, so settings work from browser storage only.

Verified by automated tests only (mocked provider and framework boundaries): the operations, actions, callback branches, pages and components above. **Not verified live**: that the first of two email-change links returns with a `message` and no `code` (assumed); that an emailed link yields `otp` or `magiclink` in `amr` (both accepted; any other name makes deletion refuse, so it fails closed); the wording of the Magic Link email the deletion link arrives in; cross-device behavior of PKCE links; and `next build`, Playwright and Storybook, which were not run for this work.

## Implementation note, 2026-10-23: Milestone 4 server identity boundary

Placement only; the provider, session model and rules above are unchanged. The request-bound server client is built by `@synapcity/server-supabase` (`createRequestClient`) from cookies and environment that `apps/web/src/lib/supabase/server.ts` still supplies. Access decisions go through `@synapcity/server-auth`: `getVerifiedIdentity` (claims, reusing the memoized `getVerifiedClaims` read) for `requireOwner` and the Spaces API routes, and `getCallerIdentity` (`getUser()`) for the Spaces, Documents, Dashboards and preferences actions. `getVerifiedClaims()` keeps its meaning, a fixture is never a verified identity, and `apps/web/src/identity-boundary.test.ts` lists the files still allowed to call `getClaims()`/`getUser()` directly (all scheduled for M7). Design: [M4 design](../../superpowers/specs/2026-10-23-m4-server-identity-boundary-design.md).

## Implementation note, 2026-10-27: Supabase review fixes

Design: [Supabase review fixes](../../superpowers/specs/2026-10-27-supabase-review-fixes-design.md). The provider, session model and PKCE rules above are unchanged, except for two owner decisions:

- **Sign-out scope (R1).** Signing out ends this browser's session only (`signOut({ scope: 'local' })`); the person's other devices stay signed in. Before, supabase-js's default `global` scope signed them out everywhere. A "sign out everywhere" control is not built.
- **View recording exception (R5).** `recordSpaceView` checks the caller with `getVerifiedIdentity` (claims) instead of `getCallerIdentity` (`getUser()`), because it runs on every Space open and writes only a timestamp that row-level security limits to the caller's own rows. A revoked session can at most stamp its own row until its token expires. Every other write, pins included, keeps the fresh lookup. The saving depends on asymmetric signing keys: the project's key set lists an ES256 key (checked 2026-10-27); a live token's header was not checked.

Placement: the remaining provider calls in the auth Server Actions (password sign-in, sign-up confirmation resend, password update, OAuth sign-in, sign-out) and `/auth/callback`'s code exchange are `server-supabase` operations; the actions and the route stay host entries. `identity-boundary.test.ts` now allows only `getVerifiedClaims` in `session.ts` plus the two files the leftovers change moves. An Auth outage on a protected page still sends a signed-in person to sign-in, because the proxy redirects first; that stays the separate proxy decision (leftovers F4).

## Amendment, 2026-10-29: the `(protected)` route group

Approved by the repository owner (decisions D1 and D2 of [the protected route architecture plan](../../superpowers/plans/2026-10-29-protected-route-architecture.md)). The provider, session model, `getClaims` rule and PKCE flow above are unchanged, and no URL, schema or policy changes.

**Decision.** The signed-in owner area, `app/(protected)/[userId]/...`, sits in a `(protected)` route group. The group adds no URL segment. It is route organization: it is not a security mechanism, and no code may rely on a page being inside it to be protected. The group's layout (`app/(protected)/layout.tsx`) is a thin server-side backstop that calls `requireSignedIn()` (`lib/access/require-signed-in.ts`), which reads the same memoized claims as `requireOwner` and so adds no second verification. The root layout, shell and providers are unchanged and shared with public and auth pages. Moving the shell into the group is not decided (see below).

**Where access is decided.** Each layer has one job and none replaces another:

| Layer                                 | Decides                                                                                                    | Does not decide                                       |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Proxy (`proxy.ts`, `isProtectedPath`) | Session refresh; signed-out redirect to `/auth/login?next=<path+query>` for `/<x>/(home\|settings)(/...)`. | Whose area it is. A bare `/<userId>` (see below).     |
| `(protected)/layout.tsx`              | Signed in or not, as a backstop for any route added to the group.                                          | Whose area it is; the return path (see below).        |
| `requireOwner`                        | The visitor is the user the URL names. Called by `[userId]/layout.tsx` and by every page under `[userId]`. | Authorization for anything not addressed by an owner. |
| Server Actions, route handlers        | `getCallerIdentity` (fresh lookup) or `getVerifiedIdentity`, then act as the caller.                       | Anything the database refuses.                        |
| Row Level Security                    | The rows a caller may read or write: the final authority.                                                  |                                                       |

A layout is not re-run on client navigation (Next.js 16.4.3, authentication guide, "Layouts" caution), so the layout checks are never the only check on a page. `apps/web/src/protected-routes.test.ts` enforces this: every page under `[userId]` must call `requireOwner`; every page under the group must map to a path the proxy protects, or be listed with a reason; no `app/[userId]` may exist outside the group; the group layout must call `requireSignedIn`. The test is a lexical scan and proves a guard is called, not that the call is reached on every path.

**Owner-addressed routes and other authenticated routes are different.** `requireOwner` answers one question: is the visitor the owner named in the URL. A future authenticated route that is not addressed by an owner (a shared record, an invitation) asks a different question and must not be given `requireOwner` by default. The structural test therefore requires `requireOwner` only under `[userId]`; any other page in the group must call a guard from the test's `OTHER_ACCESS_GUARDS` list, to which a guard is added deliberately with the design that needs it.

**The bare `/<userId>` path.** The proxy does not match `/<userId>` on its own, and the code does not record this as a decision. A single-segment path cannot be told from a public one-segment page (`/privacy`) by its shape, so matching it would need an allow-list of every public page, and a missed entry would redirect a public page. The page has no content (it redirects to the owner's home), and the group layout sends a signed-out visitor to sign in, so nothing is exposed. A signed-in visitor on another person's id gets a 404 from `requireOwner`, as before.

**Return path.** The proxy keeps the full path and query in `next` for the paths it protects. `requireOwner` can return only the owner's home, because it knows the id and not the path. A layout cannot read the request path in Next.js, so the first version of the route-group split sent a signed-out visit to a bare `/<userId>` to `/auth/login` with no way back, where before the split it went to `/auth/login?next=/<userId>/home`. Fixed without moving the page out of its group (that changed which 404 shell a signed-in visitor sees for an unknown single segment): the proxy copies the request path and query into the request header `x-synapcity-request-path` on every request it handles, replacing any value the client sent, and `requireSignedIn` reads it, validates it with `safeNextPath` and redirects with `signInHref`. The header carries no authority: an invalid or missing value gives a plain `/auth/login`. This adds a proxy-set request header that feeds a redirect target, which is routing- and security-adjacent under AGENTS.md section 5. It was made on the owner's direct instruction to investigate and correct the lost return path using the existing safe-redirect conventions, which is the approval that section asks for; the proxy matcher and every other redirect are unchanged. Reviewed for correctness: the proxy sets it before the Supabase client runs, from `request.nextUrl.pathname` and `.search` (the pair it already puts in `next`), replacing any client value, so it reflects the URL Next matched and not a client claim; the redirect then goes through `safeNextPath` and `signInHref`, and the sign-in page validates `next` again when it follows it. Coverage: `middleware.test.ts` (forwarded value, client value replaced on pass-through and redirect), `require-signed-in.test.ts` (return path, rejected values) and the end-to-end matrix.

**Public and shared resources.** Nothing here adds public access. A resource's owner, persistence and visibility belong to its row and its policies, not to the route that presents it. A future public or shared route must read a record through its own read path with its own policy; it must not reuse `requireOwner`, put its page in this group, or loosen the `*_own` policies. It is out of scope here.

**Not decided.** The shell split, which the next amendment records. Protection of `/auth/welcome`, `/auth/update-password` and `/auth/delete-account`, which stay outside the group and check the session themselves. The supabase outage behaviour recorded as deferred in the [Web Supabase leftovers design](../../superpowers/specs/2026-10-27-web-supabase-leftovers-design.md).

**Version note.** The Context above records Next.js 16.3.8 as read on 2026-10-13; `apps/web` now declares 16.4.3. The `proxy.ts` convention cited there is unchanged.

**Verification.** See the plan's acceptance criteria and the completion report: unit, structural and end-to-end tests, a build whose route table is identical before and after, and manual navigation checks. Not verified: live Supabase behaviour (expired sessions, two real accounts) and the React `cache` memoization across a real request.

## Amendment, 2026-10-29: `(public)` and `(auth)` route groups and the shell split

Decided by the repository owner, superseding the deferral (D2) in the plan above. No URL, session rule, proxy rule or policy changes.

**Decision.** `app/(public)` holds `/` and `/privacy`; `app/(auth)/auth` holds every `/auth/*` page and `/auth/callback`; `app/(protected)` is unchanged in its access rule. The groups add no URL segment and are presentation only. The root layout keeps the document, the boot scripts, the account-preference sync and the providers every page needs (`RegionalProvider`, `RootProviders`, `UserProvider`, `NextShellNavigation`). The workspace shell (`AppShell`, with the sidebar records read) moved to `(protected)/layout.tsx`; `(public)` and `(auth)` use `PublicShell` from `@synapcity/frontend-shells`, and `(auth)` adds `AuthPageShell` for the centred column. Root `error.tsx` and `not-found.tsx` render inside `PublicShell` for addresses no group matches, because the root layout no longer supplies chrome; inside a group they are replaced by the group's own boundaries (see Boundaries).

**Access is unchanged and not implied by the group.** `(auth)` has no blanket guest-only or session-required guard: the login, register and forgot-password pages keep their signed-in behaviour, and `welcome`, `update-password` and `delete-account` keep their own `getVerifiedClaims` checks. `/auth/callback` is a route handler and renders no layout; the proxy still sees it, because the matcher excludes only static assets.

**Behaviour changes for a signed-in visitor.** On `/`, `/privacy` and `/auth/*` they now get the public shell (header with the account menu, footer) instead of the workspace sidebar, and the shell remounts when they move between the public and owner areas. Root `error` and `not-found` show the public shell without an account menu (`error` is a client component and cannot render the server-read menu), for addresses no group matches. Entering the app from the public shell is the hero button on `/` and the account menu.

**Metadata.** `(auth)/layout.tsx` no longer calls `createMetadata`: a layout's `openGraph` object replaces the root one, which dropped the file-based `og:image` from `/auth/login`. Every auth page sets its own title through the root template.

**Boundaries (measured, 2026-10-29).** The first version of the split put the public shell in the root `not-found` and `error` only. Probing each group in the running app with a page that throws and one that calls `notFound()` showed that Next renders a group's `not-found` inside that group's layout, so the root one nested a second shell in every group (two `main` landmarks, two banners, duplicate skip links and ids), and that an `error` boundary replaces the layouts below it, so a failing protected page lost the workspace shell. Now: the root `error` and `not-found` bring the public shell and serve addresses no group matches; each of `(public)`, `(auth)` and `(protected)` has a `not-found` that brings no shell; `(protected)` has an `error` that keeps the workspace on screen. The message copy lives once, in `components/route-messages`. After the change every probed case has one `main` and one banner, and the protected cases keep the workspace shell. A structural test and browser tests pin it.

**Auth presentation.** The auth column now has a side gutter and vertical spacing (16px each side at 320px; it was flush with the screen edge on phones, as it was before the split). The one auth page that rendered `MessagePage` inside the column, the delete-account "ask for a new link" state, uses the same `AuthShell` card as the other auth pages. No per-flow layout option was added, because every flow fits the shared column.

**Follow-up, 2026-10-29 (local-stack verification).** Run against the local Supabase stack with a temporary user ([record](../../engineering/verification-records/2026-10-29-route-groups.md)): signed-in `/`, `/privacy` and the auth pages render in one public shell with the account menu; `/auth/login` and `/auth/register` still send a signed-in visitor on; sign-out drops the session; a password-reset link completes through `/auth/callback` (code exchanged, session cookie set, verifier cookie cleared, replay rejected, an unsafe `next` ignored). It found and fixed two defects that the groups did not cause: `/auth/welcome` returned 500 because the server page passed a function to a client component, and the owner-area layouts re-ran `createMetadata`, dropping the share image there as the auth layout had.

**Not verified.** OAuth and email-confirmation callbacks (no provider or confirmation mail in the local stack); a hosted deployment's callback origin (under `next start` the redirect names `localhost` whatever the `Host` header says); the root `error` boundary and `(protected)/error.tsx` with a real thrown error in a browser; a screen reader. The probe pages used to measure the boundaries were temporary and are not in the repository; the record holds a labelled reconstruction of their text.

## Reconsideration conditions

A requirement the cookie-session model cannot meet (for example native clients), a Supabase pricing or availability change, a security incident, or a decision to adopt a different persistence or identity stack.
