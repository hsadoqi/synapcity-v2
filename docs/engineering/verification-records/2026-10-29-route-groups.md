# Route groups: verification record (2026-10-29)

Scope: the `(public)`, `(auth)` and `(protected)` route groups in `apps/web` (commits `1663c5ce`, `0f131c86`) and the follow-up on branch `refactor/route-group-followup`. This is an evidence record, not a specification. The decision is in the second 2026-10-29 amendment of [ADR-0006](../../architecture/decisions/0006-authentication-with-supabase.md).

## Correction to an earlier claim

An earlier report said `pnpm verify` had exited 0 on the route-group split. That run was started from `apps/web`, where `pnpm verify` is the web package's own script (`pnpm lint && pnpm check-types && pnpm build`, `apps/web/package.json`). It did not run the repository gate: no unit tests, no end-to-end tests, no Storybook tests, no `pnpm deps`, no `pnpm boundaries`. Its log begins with `$ pnpm lint && pnpm check-types && pnpm build`. The repository gate is the root script and must be started from the repository root. The first root run is recorded below.

## Why standalone end-to-end needed environment variables

Two separate facts, both established by inspection rather than guesswork:

1. The mistaken run above never reached the end-to-end step, so it could not need them.
2. `apps/web` reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` on every request (`src/proxy.ts`), and `SITE_URL` for `metadataBase` and auth redirects. A development checkout gets them from `apps/web/.env.local`, which is git-ignored and exists only in the main checkout. A fresh worktree has only `.env.example`, so the server answers every page with 500 and Playwright times out waiting for it. CI sets placeholder values in `.github/workflows/ci.yml`. Nothing in `turbo.json` supplies them (`globalPassThroughEnv` lists `SITE_URL` and `SYNAPCITY_DEV_AUTH`; `NEXT_PUBLIC_*` reaches web tasks through Turborepo's Next.js inference).

Reproducible command from a worktree without `.env.local` (placeholders, no credentials, no Supabase contact):

```sh
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321 \
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=ci-placeholder-key \
SITE_URL=http://localhost:8080 \
pnpm verify          # from the repository root
```

Cache behavior: `test:e2e` and `web#test:e2e` have `cache: false` and always run; `test:coverage` is cached by input hash, so a changed test or source file is a cache miss and runs. The final run's log is checked for `cache miss` on `web:test:coverage` (see the final section).

## Signed-in and callback verification

Run against the local Supabase stack (`project_id = "synapcity"`, API `http://127.0.0.1:54321`, mail `http://127.0.0.1:54324`), with the web app built from this tree against that stack. Reproduce with the procedure in `apps/web/README.md` (`pnpm test:e2e:local-session`). One temporary user named `route-groups-e2e-<time>-<hex>@example.test` is created through the stack's admin API and removed at the end together with the mail sent to it. After the runs, the stack held no `route-groups-*` user, no mail to one, and no orphaned rows in `spaces`, `documents`, `dashboards` or `user_preferences`.

Results (17 tests, all passed on the final tree):

- Sign-in through the real login form reaches `/<id>/home` in the workspace shell.
- `/` and `/privacy` signed in: one public shell, one `main`, one `h1`, an account menu, no sign-in links; the landing page's workspace button returns to the workspace.
- Account menu: opens from the keyboard (Enter), lists Settings and Sign out, closes on Escape with focus returned to the trigger, and Settings leads into the workspace shell.
- Theme: a mode chosen on `/privacy` persists across the workspace and `/auth/forgot-password`.
- `/auth/login` and `/auth/register` send a signed-in visitor to the workspace (the existing guest-only rule). `/auth/forgot-password`, `/auth/update-password`, `/auth/delete-account`, `/auth/error` and `/auth/welcome` render in one public shell with the account menu.
- Sign-out returns to a public page, leaves no session cookie, and `/<id>/home` then redirects to `/auth/login?next=/<id>/home`.
- Unknown addresses: a single unknown segment and another person's area answer 404 inside the workspace shell (a single segment is read as an owner id); missing Space, document and dashboard answer 404 inside the workspace shell; `/privacy/missing` answers 404 inside one public shell.
- Effective metadata of `/<id>/home` and `/<id>/settings` includes the site title and `og:image` (see Defects found).

Callback, exercised with a real code: the app starts a password reset, which stores the PKCE verifier cookie in the browser; the stack mails the link; the test follows the link's redirects through the browser context to the stack's verify endpoint and then to `/auth/callback` on the running server. Asserted: before, a verifier cookie and no session cookie; the callback answers 307 to `/auth/update-password` with no `code` in the location and a `Set-Cookie` for `sb-*-auth-token`; afterwards the session cookies are `Path=/`, `SameSite=Lax`, the verifier cookie is gone, the page renders signed in with the account menu; the same link used again leads to `/auth/error?reason=reset` and sets no session. A second reset link whose `next` was replaced with `//evil.example/steal` leads to the person's own home and never to the external address.

What could not be exercised, and why:

- Under `next start` Next builds `request.nextUrl.origin` from the server's host name (`localhost`), not from the `Host` header, and the callback redirects to that origin. A browser on `127.0.0.1` therefore leaves its cookie origin. The test follows the redirect chain through the context's request API, reads the callback's own response, and loads the destination on the browser's origin. That mapping is the only part not performed by the server. The behavior is the same on `origin/main` (`route.ts` is unchanged) and is a local-run property, not a hosted one; whether a hosted deployment derives the origin correctly was not checked.
- OAuth sign-in (Google, GitHub) and email-confirmation and email-change links: no provider or confirmation mail exists in the local stack (confirmations are off). They reach the same handler; covered only by the unit tests in `route.test.ts`.
- The cookies are not `HttpOnly` (the Supabase SSR default); recorded, not changed.

## Error and not-found ownership

Measured on the built app. Next renders a group's `not-found` inside that group's layout, and an error boundary replaces the layouts below it, so the root boundaries bring the public shell for addresses no group matches, each group's `not-found` brings none, and `(protected)` has an error boundary inside the workspace shell. Checked in a browser signed in and signed out: exactly one banner and one main in every case above.

Observed and pre-existing: a 404 raised inside a matched dynamic route (a missing record, another person's area) is served by Next as its `__next_error__` bootstrap document, and the shell and message render on hydration. The same raw responses were measured on `origin/main` (`9a3a11c1`, separate investigation worktree). It was also reproduced with the group `not-found` files removed, so the groups are not the cause. A visitor without JavaScript sees no page content for those 404s. Not changed.

Not exercised: a render error inside the owner area in a browser (the `(protected)/error.tsx` boundary is covered by the DOM test of its shared message and the group structure test only); `global-error` (existing tests only).

## Responsive and keyboard

Phone 360 px and desktop 1280 px, signed out (`/`, `/privacy`, `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/error?reason=reset`) and signed in (`/auth/welcome`, the longest account flow, `/auth/update-password`, `/auth/delete-account`, `/privacy`). Raw results: [JSON](2026-10-29-route-groups-responsive-keyboard.json).

- No horizontal overflow on any page at either width; no element extends past the viewport.
- Cards keep a 16 px side gutter at 360 px and a 448 px column at 1280 px; the privacy text is capped at 768 px.
- Tab order follows reading order on every page (skip link, logo, theme, account controls, then the content), and the skip link moves focus to `main`. Every focus stop had a visible focus ring (outline or box shadow).
- Empty sign-in and sign-up submissions mark the field invalid, show the message in a `role="alert"` element, and move focus to the first field.
- Observations not caused by this change and left alone: the header's sign-in and sign-up links stay visible on the auth pages themselves; `/` repeats them in the hero; the sign-up page's invalid email field has no `aria-describedby` while sign-in's does.

Not run: a screen reader, forced-colors or reduced-motion passes, a real touch device.

## Defects found by this verification

- `/auth/welcome` returned 500 for a signed-in visitor: the server page passed `signInHref`, a function, to a client component. It also fails on `origin/main`. Fixed with a small client wrapper (`welcome-card.tsx`) and a regression test.
- The owner-area layouts `[userId]/layout.tsx` and `[userId]/home/layout.tsx` re-ran `createMetadata`, which replaces `openGraph` and dropped `og:image` and the `summary_large_image` card from every owner-area page (the same defect as `/auth/login` before the groups). Their metadata exports repeated the root's values, so they were removed.

## Return path on a bare `/<userId>`

Found while reviewing the split: a signed-out visit to `/<userId>` used to reach the page's `requireOwner` and be sent to `/auth/login?next=/<userId>/home`. After the split the `(protected)` layout's `requireSignedIn()` ran first, could not read the request path, and redirected to `/auth/login` with no `next` (commit `af58422c`; the earlier ADR-0006 amendment recorded this as accepted). The destination was recoverable, so it was treated as a regression.

A first fix moved the redirect-only page out of the group so `requireOwner` ran first. It was rejected after a signed-in visit to an unknown single segment (`/nope`) rendered the public 404 shell instead of the workspace shell, and it broke the "every page in a group" test. It was reverted before publishing.

The fix kept: the proxy forwards the request path in `x-synapcity-request-path` (always replacing a client value) and `requireSignedIn` uses it through `safeNextPath` and `signInHref`. The `(public)`/`(auth)`/`(protected)` split and layout ownership are unchanged. It is a new proxy-set request header, made on the owner's direct instruction to correct the lost return path (the AGENTS.md section 5 approval); its correctness review is in ADR-0006. Coverage: see the ADR.

## Final verification

See the pull request description for the results of the final runs on the pushed head; they are not repeated here so they cannot drift from the logs.

## Reconstructed probe pages

The six throwaway pages used while measuring boundaries (a throwing page and a `notFound()` page under each of `(public)`, `(auth)/auth` and `(protected)/[userId]/home`) were deleted by the session that wrote them, and one copy was swept into a commit and removed again. The originals were not archived. The text below is a reconstruction from the contents seen in the working tree before they were deleted; it is not a copy of the files. It is kept outside the route tree on purpose, and no executable probe route exists.

`probe-err/page.tsx` (placed under each group):

```tsx
export default function P() {
  throw new Error('probe');
}
```

`probe-nf/page.tsx` (placed under each group):

```tsx
import { notFound } from 'next/navigation';
export default function P() {
  notFound();
}
```

Paths they occupied: `app/(public)/probe-{err,nf}`, `app/(auth)/auth/probe-{err,nf}`, `app/(protected)/[userId]/home/probe-{err,nf}`.

## Final verification of the tree at `6bcfe359`

- Root gate, from the repository root, with the CI placeholder values: `pnpm verify` exit 0 (format, lint and types 61 tasks, deps, boundaries with no violations, brand check, coverage, e2e, Storybook, build). Web unit tests: 76 files, 765 tests passed. End-to-end: 104 passed, 26 skipped (nine fixture and account groups plus the 17 `local-session` tests, which need the local stack). Storybook: 167 files passed.
- Cache: `web:test:coverage` was a cache hit on this run. It replayed the log of an identical-input run on the same tree (765 tests, including `route-groups`, `route-groups.dom`, `welcome-card` and the request-path tests). An earlier run on the pre-fix tree was a cache miss and executed them. End-to-end tasks are never cached.
- Local-stack suite on the same tree, built against the local stack: 17 passed. A client-sent `x-synapcity-request-path` header (`/evil.example`, `//evil.example/x`, `/x/home`) did not change the redirect: `/someone` always went to `/auth/login?next=%2Fsomeone`. The temporary user and its mail were removed; no `route-groups-*` user, mail or orphaned rows remained.
- The request-path header mechanism falls under AGENTS.md section 5 (routing, security-adjacent). It was made on the owner's direct instruction to correct the lost return path, which is the approval that section requires; its review is in ADR-0006.
- Not run: the nine fixture and account e2e tests (they need a fixture dev server and a saved account session); OAuth and email-confirmation callbacks; a hosted deployment; a screen reader.
