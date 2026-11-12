I'll begin by establishing repository state and context.
Audited commit: `8cd5e99c` on `feat/register-auth-flow`; working tree has only two untracked audit docs, so tracked server files equal HEAD. Now inventorying the server packages.
The server layer is compact (~3k LOC of production source). I'll read every production module directly, starting with `server-supabase` and `server-auth`.
`server-auth` is a clean port/policy package. I've noted two separate ways `getClaims()` errors are classified, which I'll trace to consumers. Next: the Supabase auth operations and `server-account`.
`server-data` has a careful revision-conflict protocol in `saveComposition`, but its README has drifted from the code. Now I'll map every consumer of the server packages across the workspace.
Now the app-side server code: the Supabase client wiring, access layer, and the remaining direct `@supabase/*` imports.
The proxy/session wiring is deliberate and well-documented. Now the auth feature's server modules — the largest app-side server area.
All 277 server-package unit tests pass. The `tsc` exit codes didn't print, so I'm re-running type checks with explicit exit codes, plus cache-free ESLint, Knip, and the boundary check.
HEAD moved during the audit (`8cd5e99c` → `158910e8`). Another session committed on this branch, so I need to check whether any of it touches the code I audited.
Confirmed: the protected layout reads every Space, document, and dashboard (with participation counts) and keeps 8 of each. Writing the full report now.
I found no cross-user exposure and no verified security vulnerability. The server layer is in good shape: all 717 unit tests that touch it pass, and type checks, lint, Knip and the boundary check are clean. There are 18 findings in the register, mostly Medium and Low.

The full report covers every deliverable you listed (sections A–K). It's at `/private/tmp/claude-501/-Users-hanaasadoqi-Projects-synapcity-worktrees-active-features-auth-flows/b833bea9-5bd0-46c8-8c03-3abe3b66c58a/scratchpad/server-layer-audit.md`. I didn't create, change or delete any repository file.

**What I audited.** The audit started at `8cd5e99c` on `feat/register-auth-flow`. While I worked, another session committed `158910e8`, which only edits `docs/architecture/workspace-conventions.md`. The untracked `docs/audits/*` files also changed, and that wasn't me. No server or app source changed, so the findings apply to both commits. There is no `packages/data/`; the persistence package is `packages/server/data`. I mapped responsibilities to where the code actually puts them rather than to an assumed layering.

**What's working well:**

- Every server function takes the request's Supabase client as its first argument, and no package reads cookies, environment variables or fixture mode.
- Results are small typed values, and failures carry only a code and status, so SDK errors and personal data stay out of logs.
- Every write action checks the caller with a fresh `getUser()`, then still relies on database row security and per-column grants. No service-role key is used anywhere.
- `saveComposition` handles conflicting saves and lost-response retries correctly.

`★ Insight ─────────────────────────────────────`

- The architecture doesn't lack layers. The real problem is that a policy written once carefully (`classify-claims.ts`) was rewritten five more times with weaker rules. Sharing that one function fixes more than any restructuring would.
- The boundary check can say "no violations" while a documented rule isn't enforced. R10 (the `server-only` check) only looks at each server package's root entry, so the `./claims` and `./utils` entries are never checked.
  `─────────────────────────────────────────────────`

**Main findings:**

| ID               | Severity             | Finding                                                                                                                                                                                                                                                                     |
| ---------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SRV-01           | Medium               | Account deletion deletes the user's avatar files _before_ the irreversible deletion call. If that call fails, the account survives with a broken avatar ([operations.ts:103-115](apps/web/src/features/auth/server/operations/operations.ts#L103-L115)).                    |
| SRV-02           | Medium               | Supabase Auth errors are sorted into "signed out" or "unavailable" in six separate places, with different rules. A rate limit (429) or server error (500) during a save tells a still-signed-in person to sign in again, while pages call the same condition "unavailable". |
| SRV-04           | Medium               | Two subpath entries skip the `server-only` guard. `server-auth`'s `./utils` has no importers; `./claims` is deliberately unguarded for the proxy.                                                                                                                           |
| SRV-05           | Medium               | The `SpaceSource` port in `features-spaces` uses `server-data`'s database column names (`space_documents`, `document_id`). Two of its methods have no production callers.                                                                                                   |
| SRV-06           | Medium (this branch) | The new `profile_completed_at` column is never written. `saveName` still copies the setup name into `display_name`, which the new migration says is user-set only.                                                                                                          |
| SRV-07           | Low                  | The two account-deletion operations still sit in the app and import the Supabase SDK directly (a documented transition planned for M7.5).                                                                                                                                   |
| SRV-08 / 09 / 10 | Low                  | Two overlapping avatar uploads can delete the file the profile points to. Every protected page reads all records of three kinds to show 8 of each. `server-data`'s README misdescribes `loadComposition` and `saveComposition`.                                             |

I'm not recommending any new package, repository pattern or service layer. Each proposed change moves code into an owner that already exists.

**Checks I ran, all passing:**

- Server package unit tests: 277.
- App-side server tests: 418.
- `features-spaces` server tests: 22.
- `tsc --noEmit` and ESLint (run without its cache) in each server package.
- `pnpm boundaries` (2,209 files) and `pnpm deps` (Knip).

**Not run:** `pnpm verify`, build, format check, end-to-end, Storybook, and the database tests. The database tests need Docker and write to a local database stack, which a read-only audit shouldn't do.

**Decisions for you (section K has the tradeoffs):**

1. **Where auth operations live.** I'd keep them in `server-supabase` and update the docs, which currently assign them to `server-auth`.
2. **`./claims` guard.** I'd add a named R10 exception and remove the unused `server-auth/./utils` entry.
3. **Account-deletion cleanup order.** First check whether Storage still accepts the session after the user is deleted. If it does, clean up after deletion; if not, repair `avatar_url` when deletion fails.
4. **Where the Space participation-link type lives.** I'd put it in `domain-spaces`, coordinated with the domain refactor.
5. **429/500 during saves.** I'd treat them as "try again" rather than "sign in again", to match the page path.

The domain-side items are written up as cross-layer findings for the other agent to pick up, not as changes. That covers `hasRecentLinkSignIn` moving out of `features-auth`, the participation type, the `createRecord` insert mapping, and the duplicate `avatarFileSchema` in `domain-identity`.

If it'd help, I can publish the report as a page you could share.
I'll start by re-establishing repository state and reading the domain workstream's current plan, since several findings depend on it.
The final plan is ready, and checking it against the code changed three of my original findings. Account deletion is more serious than I reported, the auth-error problem is narrower, and part of the profile finding was wrong and is withdrawn. Nothing in the repository was changed.

Another session has uncommitted changes in `server-supabase`, `server-account` and the app's sign-in code. It's moving Supabase-specific helpers out of `domain-identity` into `server-supabase`. Those are the same files as findings SRV-02 and SRV-04, so the plan starts with a gate: no server work on those files until that session commits.

**What changed from the first audit**

- **Account deletion (SRV-01) is now High.** The deployment ledger records the delete call timing out (SQLSTATE `57014`) on a production-equivalent database. That is exactly the case where the photos are already deleted but the account survives, with the profile pointing at a missing file. I also missed a second defect: if removing files fails, deletion goes ahead and reports success. The avatar bucket is public, so a deleted person's photos stay reachable by URL.
- **Auth errors (SRV-02) are narrower.** In the installed `auth-js` 2.117.3, every 5xx response is already treated as an outage. The real divergence is 429 rate limits, 4xx errors with no code, and non-JSON or thrown errors. On save paths those tell the person to sign in again; on pages they show "unavailable".
- **Profile (SRV-06): one claim withdrawn.** The forms now edit the raw display name on purpose, so `saveName` writing `display_name` is correct. What's still broken is completion: nothing writes `profile_completed_at`, the database requires a first name to mark completion, and the setup step never asks OAuth users for one.
- **Six new findings, SRV-19 to SRV-24.** The playground layout runs 2 queries per Space. A failed name save during profile setup reports failure even though the photo was saved. Pin actions never refresh the sidebar. A no-cache header hook on the Supabase client is never wired up. One API 404 response can be cached. The database test helpers are stranded inside `server-data`.

`★ Insight ─────────────────────────────────────`

- **Deletion can't be made atomic.** The database part already is: one transaction deletes the user and cascades to every table. Storage files can't join that transaction. So the plan orders the steps so that every failure leaves a consistent state: point the profile away from the uploaded files, remove the files, then delete. Reversing the order looks simpler but depends on Storage accepting a deleted user's token, which is unverified. If that failed, the person would be signed out with public photos and no way to retry.
- **For avatar races, "only delete files older than a grace period" is simpler and safer than compare-and-swap.** A concurrent upload is always younger than the grace period, so two saves can never delete each other's file, and no legitimate save is rejected.
  `─────────────────────────────────────────────────`

**What the plan recommends**

- **Single auth-error policy:** one classifier in `server-supabase` with context-specific mappings. No public result type changes; only which branch fires for those error cases. The plan includes a regression-test matrix.
- **Server-only boundaries:** `./claims` stays unguarded but shrinks to `readClaims` only. The Next 16 docs say the proxy runs on Node.js, but whether it can load `server-only` can't be confirmed from the docs alone. The new profile helpers move to the guarded root. R10 is extended to check every export entry, with one named exception. `server-auth/./utils` has zero importers anywhere and its export can be removed.
- **Structure:** no new packages. `server-auth` stays as it is. `server-supabase` and `server-account` get changes to how they're organized, and `server-data` gets minor ones. Database test helpers become a `./testing` export of `server-data`, which the conventions already allow.
- **Seven phases:** a coordination gate, then deletion and the avatar lifecycle, auth errors, boundaries, the profile contract, reads and caching, and contracts and docs. Each phase lists its files, public contract changes, tests, verification commands and possible conflicts (the domain session, the `fix/r4-pin-toggle-race` branch).

**Decisions that need your approval**

1. **Account deletion that fails after the photo was removed:** I recommend the account stays, the uploaded photo is gone (reverted to the provider picture or initials), and the message says so plainly. Deletion should also stop if file removal fails.
2. **Recording "skipped profile setup"** once completion moves to the column:
   - **(A, recommended):** a marker in user metadata. No schema change, and it's harmless for a reminder prompt.
   - **(B):** a new `profile_setup_skipped_at` column, which needs a migration.
   - **(C):** don't record it; the step reappears until finished.

   Please also confirm the setup step should require a first name, which the database constraint needs, including for OAuth users.

3. **Orphaned photos from an upload during deletion:** I recommend accepting and documenting this narrow risk for now. Closing it needs a privileged cleanup key, which the app deliberately doesn't hold.
4. **Name of the Space participation type:** the glossary leaves this unresolved. I recommend a working-label type in `domain-spaces` when the first consumer lands.

I left out decisions your instructions or the evidence already settle: treating 429/500 as "try again", the narrow `./claims` exception, removing the unused `./utils` export, and making root exports explicit.

**What isn't verified**

- I re-ran only `pnpm boundaries` on the current in-flight tree (passes). The earlier test, type-check, lint and Knip runs were on the pre-edit commit and weren't repeated.
- Database tests, end-to-end tests and a production build were not run.
- Section H lists exactly what each unconfirmed finding still needs: SRV-04's proxy guard needs a build plus a proxy smoke test, SRV-21 a browser check, SRV-22 a header check on the sign-in callback.

Files are in `/private/tmp/claude-501/-Users-hanaasadoqi-Projects-synapcity-worktrees-active-features-auth-flows/b833bea9-5bd0-46c8-8c03-3abe3b66c58a/scratchpad/`:

- server-remediation-plan.md — the final plan
- server-layer-audit.md — the earlier audit
  I'll start by checking the concrete runtime bounds the new avatar and deletion analysis depends on: function lifetime, database statement timeouts, the existing database-clock pattern for timestamps, and the current state of the other session's work.
  HEAD has moved to `5d5a9b66`, and the other session's server changes no longer show as uncommitted, so they've likely been committed. Checking what landed, since that defines the Phase 0 gate.
  I've revised the four unresolved areas, and the plan needs two more approvals from you: an account-deletion marker column and a shorter avatar cache lifetime. Nothing in the repository was changed.

**What changed in the repository since the last plan.** The other session committed its identity work as `e7030fc7`. That commit moved `isRateLimited`, `providerImageFrom` and the claims-to-profile helpers into `server-supabase`. That session is now editing `domain-time` and frontend forms, which don't touch the server layer. At `5d5a9b66`:

- All server packages pass their unit tests (20, 135, 42 and 104).
- The app's server and auth route modules pass 508 tests.
- Type checks are clean.

That partly satisfies the Phase 0 gate. Still outstanding: `pnpm verify` and the database test suites on a clean checkout of that commit.

**1. Account deletion**

- **Two separate guarantees:**
  - **Database consistency:** already atomic. One transaction deletes the user and cascades to every owned row.
  - **Whole-workflow completion:** can't be atomic, because Storage files can't join that transaction.
- **Workflow:**
  1. Verify the session and the recent emailed-link sign-in.
  2. In one update, set a deletion marker and point the profile away from uploaded files.
  3. Remove every file, paging and checking each error.
  4. Call the delete RPC.
  5. Run a best-effort second file sweep.
  6. Sign out.
- **Ambiguous outcomes:** a timeout or lost response goes through a resolver. It repeats the RPC, which is safe to call twice and definitive when it succeeds. If that doesn't settle it, it asks Auth whether the user exists. A timeout is never treated as "the account survived".
- **Failure-state matrix:** 12 rows, F1–F12. It covers detach failure, partial file removal, the 8-second timeout, a lost response, a request killed mid-flow, retries, and old orphaned files.
- **Guarantees:**
  - `deleted` is reported only when the deletion is confirmed.
  - A surviving account never points at a removed photo.
  - The marker expires after 15 minutes, so a deletion that dies mid-flight never blocks the account.

**2. Avatar races**

You were right that a grace period alone isn't enough. The revised design has three parts:

- **Compare-and-set commit:** a save only overwrites the photo it read before uploading. A late-arriving update can't overwrite a newer one, and each save deletes only the photo it replaced.
- **Age-bounded orphan sweep:** the age limit comes from a hard bound, not a guess. Vercel terminates functions at 300 s by default and 1,800 s at most, so no request older than an hour can still commit a photo.
- **The deletion marker:** blocks new photo commits, and with the Storage policy clause new uploads, during account deletion.

The revised plan walks through seven concrete interleavings (S1–S7), including a stalled request, a request killed before committing, a lost response, remove-versus-upload, and save-versus-deletion. It also includes deterministic tests for them.

One narrow residual remains (S7). It needs an upload that starts just before the marker is set, lands just after the file sweep, and whose request then crashes. The second sweep then also has to fail. Closing it completely would need a privileged cleanup key, which I'm not recommending.

**3. Profile lifecycle (Option B)**

- **States:** incomplete, skipped or completed, derived from the two timestamps. The database stamps both timestamps itself, the way it already stamps pin times.
- **Transitions:**
  - You can skip only while incomplete.
  - Completing needs a valid first name, enforced by both domain validation and the existing database constraint.
  - A skipped user can complete later from settings.
  - A first name can't be cleared after completion.
- **OAuth users:**
  - The full name is never split into a first name.
  - The first-name field is prefilled only from a provider's explicit `given_name` (Google supplies it, GitHub doesn't), and saved only when the person submits.
- **Partial saves (SRV-20):** names and completion save first in one statement, then the photo, then the session update. Each partial outcome gets its own message.
- **Ownership:** the domain session owns the prompt rule's new signature. `server-account` owns the reads and writes. The app owns the callback and actions.

**4. Phases and cross-agent dependencies**

- There are now eight phases (0–7). One branch migration (Phase 1) carries both new columns, the trigger, the Storage policy clause and the backfill.
- Every touch point with the other session is listed in an integration table. Each phase starts with a `git status`/`git log` check of those paths and stops if there are uncommitted edits.
- SRV-19 to SRV-24 each have impact, cause, consumers, owner, fix, tests and any overlap. The pin-refresh fix (SRV-21) overlaps `fix/r4-pin-toggle-race` and is sequenced after it.
- The proxy check you asked for is a concrete procedure. It runs a production build with the guard added, then three proxy smoke tests. The exception is removed if the proxy passes and kept, with the failure output as evidence, if it doesn't.
- `server-auth/./utils` has no consumers of any file type anywhere in the repository, so removing it is safe.

**Decisions for you**

1. **G1. Deletion marker column** (`profiles.account_deletion_started_at`, in the same branch migration). I recommend adding it: it's what makes "no new photo during deletion" enforceable without a privileged key or background job. Without it, a photo uploaded during deletion can survive as a public file.
2. **G2. Avatar cache lifetime: one year → one hour.**
   - I recommend the change: Supabase's Smart CDN (Pro plan and above) clears deleted files within about 60 s.
   - Without Smart CDN the behavior isn't documented, and browsers keep copies for the full cache lifetime.
   - Unique filenames already prevent stale photos, so the long lifetime only saves bandwidth.

Two defaults I'll apply unless you object:

- Existing users who already dismissed setup through the old metadata flag are backfilled as **skipped**, which preserves current behavior.
- The first-name prefill uses only an explicit `given_name`, as above.

Remaining unverified items are listed in section 7 of the revised plan, each with the evidence it needs. They include Auth's response for a deleted user, whether Storage accepts a deleted user's token, when Storage applies its upload policy, CDN behavior on plans without Smart CDN, and the proxy with `server-only`.

The revised plan is `/private/tmp/claude-501/-Users-hanaasadoqi-Projects-synapcity-worktrees-active-features-auth-flows/b833bea9-5bd0-46c8-8c03-3abe3b66c58a/scratchpad/server-remediation-plan-rev2.md`. Everything outside these sections in `server-remediation-plan.md` (same folder) still stands.
