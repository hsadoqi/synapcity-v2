# Server Remediation Plan — Revision 2 (unresolved sections only)

Supersedes sections D1, D4 and D5, the SRV-19–24 rows, and sections F and G of `server-remediation-plan.md`. Everything else in that plan stands as approved.

**State reviewed:** `HEAD 5d5a9b66`. The other session's identity work landed as `e7030fc7` ("refactor(identity): organize by capability and move Supabase readers to the adapter"): `isRateLimited` and `providerImageFrom` moved into `server-supabase`, and `profileFromClaims` / `currentUserFromClaims` were added to `server-supabase/claims`. That session is now editing `domain-time` and frontend forms (uncommitted), which don't touch the server layer.
**Read-only:** nothing in the repository was changed.

**Verification run at `5d5a9b66`** (unit tests and type checks only; nothing written):

| Scope                                 | Result                           |
| ------------------------------------- | -------------------------------- |
| `server-auth`                         | 20/20 tests, `tsc` 0             |
| `server-supabase`                     | 135/135 tests (was 111), `tsc` 0 |
| `server-account`                      | 42/42 tests, `tsc` 0             |
| `server-data`                         | 104/104 tests, `tsc` 0           |
| App server and auth route directories | 37 files, 508/508 tests          |
| `apps/web`                            | `tsc` 0                          |

Not run: `pnpm verify`, build, e2e, Storybook, database tests.

**First-party facts used below** (fetched 2026-11-11):

- _Vercel function duration_ (vercel.com/docs/functions/configuring-functions/duration): default 300 s on all plans; maximum 300 s Hobby, 800 s Pro/Enterprise; 1,800 s extended beta. "If a function runs for longer than its set maximum duration, Vercel will terminate it." `apps/web/vercel.json` sets no `maxDuration`, so 300 s applies.
- _Supabase Smart CDN_ (supabase.com/docs/guides/storage/cdn/smart-cdn): "When a file is updated or deleted, the CDN cache is automatically invalidated", taking "up to 60 seconds"; "browsers may not refresh their cache". Smart CDN is "automatically enabled for Pro Plan and above". Behavior without Smart CDN: **NOT VERIFIABLE** from Supabase's docs (the fundamentals page doesn't say).
- _auth-js 2.117.3_ (installed): `_request` has no timeout; 5xx and 52x responses are `AuthRetryableFetchError`; GoTrue `session_not_found` becomes `AuthSessionMissingError`.
- _storage-js 2.117.3_ (installed): `list()` default `limit: 100`.
- _Database:_ authenticated statement timeout 8 s, observed as SQLSTATE `57014` during the hosted deletion run (`docs/engineering/database-deployment-ledger.md:39`). The precedent for database-stamped timestamps is `public.stamp_user_state()` (`20261018100000_add_pinned_and_last_viewed.sql:30-56`).

---

## 1. Account deletion — revised workflow and failure-state matrix

### Two separate guarantees

- **Database consistency (already atomic).** `delete_own_account()` deletes `auth.users` and, via `ON DELETE CASCADE`, every owned row (profiles, preferences, spaces, documents, dashboards, compositions, revisions, participation; Auth sessions and identities), in one transaction. Postgres guarantees it either committed or didn't. `supabase/tests/delete-own-account.sql` covers it.
- **Workflow completion (not atomic).** Storage objects can't join that transaction. The workflow therefore promises consistency at every step boundary, and reports `deleted` only when the account is verifiably gone.

### Infrastructure the workflow uses (all existing, plus one column)

- An **account-deletion marker** column on `profiles`, `account_deletion_started_at timestamptz`, database-stamped by a trigger like `stamp_user_state`. It goes in the same pending branch migration as `profile_setup_skipped_at` (section 3). It is the one new piece; see decision G1.
  - It is honored by the avatar commit (section 2) and, as defense in depth, by the `avatars_insert_own` Storage policy.
  - It **expires** after 15 minutes, so a deletion that dies mid-flight never blocks the account. 15 minutes is longer than any request that can be acting on it (300 s function limit, 8 s statement timeout).
- **Idempotent RPC as resolver.** After a successful `delete_own_account()` the caller's user cannot exist: the call deletes 1 row, or 0 rows if it's already gone. Repeating it is safe and definitive on success.
- **Existence check as second resolver.** `getUser()` asks Auth directly. A deleted user is reported as `user_not_found` (needs a db-test confirmation; see section 5).

### Workflow (`server-account` `deleteOwnAccount`; the host supplies wording and logging)

| Step | Action                                                                                                                                                          | Precondition for the next step                                           |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1    | `readClaims`: verified, signed out or unavailable                                                                                                               | verified                                                                 |
| 2    | `hasRecentLinkSignIn(amr, now)` (moved to `server-supabase`)                                                                                                    | true, else `link-required`                                               |
| 3    | **Mark and detach** in one `UPDATE profiles SET account_deletion_started_at = <stamped>, avatar_url = <provider image or null> WHERE id = uid` with `.select()` | 1 row. 0 rows → go to the resolver (the account may already be gone)     |
| 4    | **Sweep** the caller's folder: page `list()` (limit 100) and recurse into sub-folders until empty; `remove()` in batches; check every error                     | the folder lists empty                                                   |
| 5    | `rpc('delete_own_account')`                                                                                                                                     | success → step 6; `42501` → `link-required`; any other result → resolver |
| 6    | **Post-delete sweep** (best effort): one more list-and-remove with the still-valid token. Failure is logged and doesn't change the outcome                      | —                                                                        |
| 7    | `signOut({ scope: 'local' })`, best effort                                                                                                                      | —                                                                        |

**Resolver** (used after an ambiguous step 3 or step 5 result):

1. Call the RPC once more. Success → `deleted`.
2. If it returns `42501` (the AMR window has lapsed), or the outcome is still unknown: call `getUser()`.
   - `user_not_found` → `deleted`.
   - A user comes back → the account exists; report `failed` for the step that triggered the resolver.
   - Unavailable → `unconfirmed`.

The resolver never assumes. A `57014` is a rolled-back statement by Postgres semantics, but it still goes through the resolver, because a lost response looks the same to the client.

### Failure-state matrix

| #   | Failure point                                              | Database                                    | Storage                                   | Reported outcome                                                                  | Message (host wording)                                                                                                             | Retry                                                  |
| --- | ---------------------------------------------------------- | ------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| F1  | Step 1 signed out / unavailable                            | unchanged                                   | unchanged                                 | `signed-out` / `unavailable`                                                      | "Sign in again…" / "Try again"                                                                                                     | safe                                                   |
| F2  | Step 2: no recent link sign-in                             | unchanged                                   | unchanged                                 | `link-required`                                                                   | "Ask for a new link"                                                                                                               | safe                                                   |
| F3  | Step 3 error (definite)                                    | unchanged                                   | unchanged                                 | `failed { step: 'detach' }`                                                       | "Nothing was deleted. Try again."                                                                                                  | safe                                                   |
| F4  | Step 3 updates 0 rows                                      | —                                           | —                                         | resolver → `deleted`, or `failed` if the row is refused but the user exists       | as resolved                                                                                                                        | safe                                                   |
| F5  | Step 4: one or more removals fail                          | marker set (expires); `avatar_url` detached | some objects remain                       | `failed { step: 'files' }`                                                        | "Your account was not deleted. Your uploaded photo was removed from your profile; some files could not be removed yet. Try again." | safe: step 3 re-marks, step 4 re-sweeps                |
| F6  | Step 5 `42501`                                             | marker set; detached                        | folder empty                              | `link-required`                                                                   | "This confirmation expired. Your account was not deleted; your uploaded photo was removed."                                        | safe after a new link                                  |
| F7  | Step 5 `57014` timeout                                     | rolled back (Postgres) → resolver confirms  | folder empty                              | resolver → `failed { step: 'delete' }`                                            | "Your account was not deleted. Your uploaded photo was removed. Try again."                                                        | safe                                                   |
| F8  | Step 5 network loss / gateway timeout (may have committed) | unknown → resolver                          | folder empty                              | `deleted` / `failed` / `unconfirmed`                                              | `unconfirmed`: "We could not confirm whether your account was deleted. Try again to finish."                                       | safe: the RPC is idempotent                            |
| F9  | Request killed between steps 3 and 5                       | marker set (expires in 15 min); detached    | partially swept                           | none (the request died)                                                           | generic error page                                                                                                                 | safe; the account stays usable, and the marker expires |
| F10 | Request killed after a step 5 commit                       | deleted                                     | folder empty                              | none                                                                              | generic error; a revisit shows signed out                                                                                          | n/a                                                    |
| F11 | Step 6 sweep fails                                         | deleted                                     | possibly late objects (see section 2, S7) | `deleted`                                                                         | "Your account was deleted."                                                                                                        | n/a; logged                                            |
| F12 | Retry after a success                                      | gone                                        | empty                                     | step 1 still verifies locally; step 3 updates 0 rows → resolver → RPC → `deleted` | "Your account was deleted."                                                                                                        | —                                                      |

**Invariants this matrix guarantees:**

- **D-I1.** No outcome is `deleted` unless the RPC succeeded or Auth reports `user_not_found`.
- **D-I2.** At every step boundary, a surviving account's `profiles.avatar_url` never references a removed object (detach precedes the sweep).
- **D-I3.** A surviving account is never left unable to upload: the marker expires.

**Previously orphaned objects:** step 4 removes everything in the folder, so orphans from earlier crashes or old cleanup failures go too.

**Public accessibility after deletion:**

- Removed objects return 404 from origin.
- With Smart CDN (Pro and above) cached copies are invalidated within 60 s.
- Without Smart CDN the behavior is undocumented (NOT VERIFIABLE).
- Browsers that already loaded an image keep it for its cache TTL. The upload sets `cacheControl: '31536000'` (one year).

**Recommendation (no infrastructure):** lower the avatar `cacheControl` to `3600`. Unique filenames already prevent staleness, so the long TTL buys only bandwidth. Confirm the hosted project's plan; if it lacks Smart CDN, that is a verification item, not a design change. Making the bucket private with signed URLs would remove public exposure entirely, but it reverses owner decision D10 and breaks avatar URLs stored in token metadata. I don't recommend it now.

### Alternatives compared

| Strategy                                                                | Infrastructure                             | Guarantees                                                                                                                 | Verdict                                                                |
| ----------------------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Current: sweep, then RPC, errors swallowed                              | none                                       | none on failure (dangling reference; silent success)                                                                       | defective                                                              |
| Delete first, sweep afterwards                                          | none                                       | depends on Storage accepting a deleted user's token (unverified); a failed sweep strands public files with no way to retry | rejected                                                               |
| Detach + sweep + RPC, **no marker**                                     | none                                       | D-I1, D-I2; a concurrent upload between the sweep and the RPC can commit and survive deletion                              | acceptable minimum                                                     |
| **Detach + marker + sweep + RPC + resolver + post-sweep** (recommended) | one column, one trigger, one policy clause | D-I1–3; uploads after the marker are refused at the commit and by Storage RLS; the residual is section 2's S7 only         | **recommended**                                                        |
| Privileged reconciliation (scheduled sweep with a service key)          | service-role key, scheduler                | closes S7                                                                                                                  | not now: introduces a privileged credential the app deliberately lacks |

---

## 2. Avatar concurrency and cleanup — verified strategy

You were right: a grace period alone doesn't guarantee anything. A slow request can upload, stall, and commit after a peer's sweep has removed its object. The revised strategy rests on three mechanisms, each with a stated reason it holds.

### Mechanisms

1. **Immutable, unique objects** (already in place): every upload writes a new random name; there's no UPDATE policy.
2. **Compare-and-set commit:**
   ```
   read  c = profiles.avatar_url (and the marker)        -- before the upload
   upload x
   UPDATE profiles SET avatar_url = x
    WHERE id = uid
      AND avatar_url IS NOT DISTINCT FROM c
      AND (account_deletion_started_at IS NULL OR account_deletion_started_at < now() - interval '15 minutes')
   RETURNING id
   ```
   (PostgREST: `.eq` or `.is` on `avatar_url`, plus `.or()` on the marker.)
   - 1 row → committed; **the replaced object is exactly `c`**.
   - 0 rows → re-read. A marker is active or the row is gone → remove `x` and return `account-deleting` / `signed-out`. Otherwise another save won → retry with the new `c`, up to 3 attempts, then remove `x` and return `conflict` ("try again").
   - No response (ambiguous) → re-read. The row references `x` → committed. Otherwise **leave `x` in place** (the update may still apply; see the proof) and return `unconfirmed`.
   - A late-arriving update is harmless: its `WHERE avatar_url = c` is re-evaluated when it applies, so it can't overwrite a newer value.
3. **Replace-delete:** after its commit, a save deletes only `c` (when `c` is an object in the caller's folder).
4. **Bounded-age orphan sweep:** after its commit, a save lists the folder and removes objects that are all of: not `x`; not the object the row references when re-read **after** the commit; and older than `T = 1 hour`.
5. **Remove photo** is the same commit with the provider image (or null) as the value, plus replace-delete.
6. **Session mirror:** mirror the `avatar_url` read back from the row after the commit, not the request's own value, so the header's token copy converges on the row (otherwise a losing save could mirror a deleted object).

### Why `T` is a guarantee, not a guess

An object's `created_at` is set by Storage during the request that uploaded it, so it's at or after that request's start. That request is terminated by Vercel within at most 1,800 s (300 s configured today). Any database statement it sent is cancelled within 8 s. So after `T = 3600 s` (which covers every Vercel tier, the statement timeout and clock skew), **no live request can still commit that object**. Combined with "a save only ever commits its own fresh object", an object older than `T` that isn't referenced now can never be referenced again. Deleting it is safe even if the row changes between the sweep's read and its delete: any newly referenced object is younger than `T`, so it isn't in the deletion set.

Two caveats are stated as assumptions:

- **(i)** `created_at` must not be earlier than the request start. That's true by construction; a db test asserts it.
- **(ii)** Uploads come through the Server Action. A person hand-crafting direct Storage and PostgREST calls on their own account can make their own reference dangle. That's self-inflicted and out of scope.

### Invariants

- **A-I1.** Once a save reports success, `profiles.avatar_url` references an existing object, and no cleanup deletes an object while the row references it.
- **A-I2.** Every unreferenced object is removed by its creator (a failed commit), by the save that replaced it, by a later save once older than `T`, or by account deletion.
- **A-I3.** While a deletion marker is active, no save commits a new reference.

### Concurrent sequences (A and B are two saves by the same user; D is a deletion)

| #                                    | Sequence                                                                                                                                                                              | Result                                                                                                      | Invariant                                                                                            |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| S1                                   | A reads c=o; B reads c=o; A uploads a; B uploads b; A commits (o→a), deletes o; B's commit expects o → 0 rows → re-reads a → commits (a→b), deletes a; both sweeps skip young objects | row=b, b exists; a and o removed                                                                            | A-I1, A-I2                                                                                           |
| S2 (slow request)                    | A reads o, uploads a, stalls 4 min; B saves (o→b), deletes o, sweep keeps a (young); A resumes: expects o → 0 rows → re-reads b → commits (b→a), deletes b                            | row=a, a exists                                                                                             | A-I1 (last writer wins)                                                                              |
| S3 (stall beyond the function limit) | A uploads a, then Vercel kills A at 300 s before its commit; 2 h later B saves: a is older than T and unreferenced → removed                                                          | row=b; a removed                                                                                            | A-I2                                                                                                 |
| S4 (lost response)                   | A's commit response is lost; A re-reads: if a → success; if not → a is left and the result is `unconfirmed`; if the late update applies, it only matches when the row still equals o  | row consistent; a referenced or a later-swept orphan                                                        | A-I1, A-I2                                                                                           |
| S5 (remove versus upload)            | R commits (o→provider), deletes o; A expects o → 0 rows → commits (provider→a)                                                                                                        | row=a                                                                                                       | A-I1                                                                                                 |
| S6 (save versus deletion)            | D marks and detaches (a→provider); A's commit fails on the marker → A removes its object; or A committed before D → D's detach replaces it and D's sweep removes it                   | no reference to a removed object; folder empty before the RPC                                               | A-I3, D-I2                                                                                           |
| S7 (residual)                        | A passes Storage's insert check **before** D's marker, its object row lands **after** D's sweep and after the RPC, and A then crashes before its own cleanup                          | one object for a deleted user; D's post-delete sweep (step 6) removes it if Storage still accepts the token | the only residual: needs a concurrent save, a crash in a millisecond window, and a failed post-sweep |

**Does the Storage policy clause help?** Adding `AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.account_deletion_started_at IS NULL OR p.account_deletion_started_at < now() - interval '15 minutes'))` to `avatars_insert_own` makes any upload checked after the marker (or after the profile is gone) fail at Storage. It narrows S7 to requests already past the check. Whether Storage evaluates RLS at the start or the end of an upload is unverified, so S7 is documented, not claimed closed.

### Deterministic tests

- **Unit** (`server-account`): a fake row store with compare-and-set semantics, a fake bucket with injectable `created_at`, and a step scheduler that runs S1–S6 in every interleaving. Each run asserts A-I1 (the referenced object exists) and A-I2 (no unreferenced object older than T remains after a save).
- **Database** (local stack, `avatars-storage` moved to `server-account`): two clients for the same user run the primitives (`readCurrent`, `upload`, `commit`, `replaceDelete`, `sweep({ minAgeMs })`) in scripted order for S1, S2, S5 and S6, with no sleeps. `minAgeMs` is a parameter, so S3 uses `0`. Also assert `created_at` is at or after the time recorded before the upload (caveat i).

---

## 3. Profile lifecycle — Option B

### Model (one migration on this branch, alongside the marker in section 1)

- `profiles.profile_setup_skipped_at timestamptz` (new), nullable.
- `profiles.profile_completed_at` (exists) stays the only completion marker; `CHECK (profile_completed_at IS NULL OR first_name IS NOT NULL)` (exists).
- A `BEFORE UPDATE` trigger stamps both columns with `now()` when they go from null to a value. Clients can't backdate, following the `stamp_user_state` precedent.
- Grants: `update (profile_setup_skipped_at)` to `authenticated`. RLS is unchanged (owner-only).
- **Backfill (behavior-preserving):** users whose `auth.users.raw_user_meta_data ->> 'profile_confirmed' = 'true'` get `profile_setup_skipped_at = now()`. Mapping them to "completed" would claim a name confirmation that may not have happened, and the constraint would refuse rows without `first_name`. Existing metadata keys are left as they are (no destructive metadata edits).

### States and transitions

State is derived as: `completed` if `profile_completed_at` is set; else `skipped` if `profile_setup_skipped_at` is set; else `incomplete`.

| From → To                        | Trigger                                                     | Write (one statement)                                                                    | Guard                                                                       |
| -------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| incomplete → skipped             | "Skip" on the welcome step                                  | `SET profile_setup_skipped_at = <stamp> WHERE id = uid AND profile_completed_at IS NULL` | 0 rows is fine: already completed                                           |
| incomplete → completed           | Welcome-step submit                                         | `SET first_name, last_name, display_name, profile_completed_at = <stamp>`                | `firstNameSchema` (domain) on the server; DB constraint                     |
| skipped → completed              | The first explicit save of a valid first name from settings | same as above, with `profile_completed_at` only if still null                            | same                                                                        |
| completed → completed            | Later name edits                                            | names only; `profile_completed_at` unchanged                                             | first name can't be cleared (server validation; the DB constraint backs it) |
| completed → skipped / incomplete | —                                                           | not allowed                                                                              | the skip write is conditional on `completed_at IS NULL`                     |

**Prompt rule** (domain): show the welcome step when `isNewAccount(createdAt)` is true and the state is `incomplete`. Skipped and completed users aren't prompted. This keeps today's 7-day window, so long-standing accounts aren't suddenly prompted.

**First names for OAuth sign-ups:**

- The signup trigger stays as it is: it copies only an explicit `first_name` key and never derives one from `full_name` / `name`.
- The welcome form may **prefill** the first-name field from the provider's explicit structured `given_name` (Google supplies it; GitHub doesn't). It's stored only when the person submits. Otherwise the field starts empty.
- The display name keeps its existing OAuth prefill.

**Writes and reads by owner**

| Concern                 | Owner                                        | Contract                                                                                                                                                                                                                                                                                                                       |
| ----------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Name rules, prompt rule | domain-identity (domain session)             | `firstNameSchema`, `lastNameSchema`, `nameSchema` (exist); `needsProfileSetup({ createdAt, completedAt, skippedAt })` (changed); retire `PROFILE_CONFIRMED_KEY` / `isProfileConfirmed` once nothing reads them                                                                                                                 |
| Persistence             | server-account                               | `readProfileSetup(client, uid)` → `{ state, firstName, lastName, displayName }`; `completeProfileSetup(client, uid, names)` → `completed` / `first-name-required` (constraint `23514`) / `failed`; `skipProfileSetup(client, uid)` → `skipped` / `already-completed` / `failed`; `saveName(client, user, displayName \| null)` |
| Code exchange           | server-supabase                              | `exchangeAuthCode` returns `{ userId, createdAt }` and stops computing `needsProfileSetup`                                                                                                                                                                                                                                     |
| Callback, actions       | apps/web                                     | the callback reads `readProfileSetup` and applies the domain rule; `completeProfile` / `skipProfileSetup` actions call the server-account operations                                                                                                                                                                           |
| Header display          | server-supabase `profileFromClaims` (exists) | the mirror writes `first_name`, `last_name`, `full_name` (removed when the display name is cleared), `avatar_url`                                                                                                                                                                                                              |
| Form fields             | features-account                             | first name (required), last name, display name (optional), photo                                                                                                                                                                                                                                                               |

**Partial saves (SRV-20).** `completeProfile` writes names and completion first (one atomic statement), then the photo, then mirrors once.

| Outcome                   | Message                                                    |
| ------------------------- | ---------------------------------------------------------- |
| Names failed              | nothing saved                                              |
| Names saved, photo failed | profile completed; the message says the photo wasn't saved |
| Both saved, mirror failed | saved, with "may take a while to show"                     |

**Integrated verification:**

- `supabase/tests/profiles.sql`: new column, trigger stamping, constraint, backfill.
- `server-account` db tests for all three transitions and the skip-after-complete no-op.
- Callback route tests for the three states.
- Manual runs: email sign-up → welcome → complete; Google sign-up with `given_name` prefill; GitHub sign-up with an empty field; skip → later completion from settings.

---

## 4. SRV-19 – SRV-24

| ID                            | Verified impact                                                                                                                                                           | Root cause                                                                                          | Consumers                                                | Owner                               | Correction                                                                                                                                                                          | Tests                                                                                                   | Overlap                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| SRV-19 playground fan-out     | 1 + 2N queries per render of `home/playground` (`playground/layout.tsx:17-26`)                                                                                            | per-Space item reads                                                                                | playground layout only                                   | apps/web (+ `features-spaces` port) | use `listWithRelations()` (participation ids for all Spaces in one query) plus one `listRecordSummaries` per kind; join in memory                                                   | layout test asserting a constant number of source calls                                                 | SRV-05 (first real consumer of the relations method; participation naming stays provisional) |
| SRV-20 profile partial save   | the photo is saved but reported as failed; header stale (`setup-actions.ts:59-77`)                                                                                        | avatar committed before the name; no partial outcome                                                | welcome step                                             | server-account + app action         | section 3 ordering and outcomes                                                                                                                                                     | action tests per partial state                                                                          | profile lifecycle (Phase 4)                                                                  |
| SRV-21 sidebar after pin      | sidebar order (pinned first) should stay stale until a full load, since pin actions don't revalidate and the shared layout keeps its render; **unobserved in a browser**  | no `revalidatePath` on pin actions (`space-state-actions.ts:27-49`, `lib/records/records.ts:31-55`) | sidebar in `(protected)/layout.tsx`                      | apps/web                            | after a successful pin, `revalidatePath(homePathFor(userId), 'layout')` (matches `addToSpace`); confirm it doesn't fight optimistic pin state                                       | e2e: pin on an index page → sidebar order updates without reload; action unit test asserts revalidation | **`fix/r4-pin-toggle-race`** edits the pin flow: land after it, or coordinate with its owner |
| SRV-22 header sink unwired    | session-refresh `Cache-Control` headers are dropped in Route Handlers (`lib/supabase/server.ts:17-24`); whether Next's defaults already prevent caching is **unobserved** | the host never passes `onResponseHeaders`                                                           | `/auth/callback`, `/api/spaces/*`                        | apps/web                            | in Route Handlers, collect the headers and apply them to the response (or set `no-store` explicitly on cookie-setting responses)                                                    | `curl -I` on a callback that refreshes the session; route unit test                                     | independent                                                                                  |
| SRV-23 404 cacheable          | `/api/spaces/[spaceId]` 404 lacks `no-store` (`route.ts:32-33`)                                                                                                           | omission                                                                                            | browser and proxies                                      | apps/web                            | add the header                                                                                                                                                                      | route unit test                                                                                         | independent                                                                                  |
| SRV-24 test harness placement | `server-account` can't run database tests; a storage test lives in the wrong package                                                                                      | the harness is internal to `server-data`                                                            | `server-data` db tests; future `server-account` db tests | server-data / server-account        | export `@synapcity/server-data/testing` (conventions rule 8; dev-only consumers: `server-data` and `server-account` db tests); move `avatars-storage.dbtest.ts` to `server-account` | both `test:db` suites pass                                                                              | needed by Phases 1 and 4                                                                     |

SRV-09 (bounded sidebar reads) stays as previously approved: an SQL order `pinned_at DESC NULLS LAST, updated_at DESC, created_at DESC, id` with `LIMIT 8` and no count embeds, the same order `latestRecords` produces (its stable sort falls back to the input order, `created_at DESC`). An ordering-parity test with ties is required.

---

## 5. Implementation phases (final)

### Phase 0 — Gate (partially satisfied)

- Domain identity integration is committed (`e7030fc7`). At `5d5a9b66`: server packages and app server tests and type checks pass (above).
- **Still required before Phase 1:** `pnpm verify` on a clean checkout of the gate commit (the shared worktree has the other session's uncommitted `domain-time` and forms edits, so run it in a separate worktree or after they commit), plus `pnpm db:stack start --fresh && pnpm db:test` and `pnpm --filter @synapcity/server-data test:db`.
- Passing boundaries alone doesn't establish this gate.

### Phase 1 — Branch migration (one migration; needs approval G1)

- **Scope:** `profile_setup_skipped_at`; `account_deletion_started_at`; stamping trigger; grants; `avatars_insert_own` marker clause; backfill.
- **Files:** `supabase/migrations/<ts>_profile_setup_and_deletion_marker.sql`, `supabase/tests/profiles.sql`, `storage-avatars.sql`, `delete-own-account.sql`; `server-supabase` `database.types.ts` via `pnpm db:types --stack`.
- **Contract changes:** schema only.
- **Verify:** `pnpm db:test`, `pnpm db:types --stack` diff, `pnpm db:parity --environment local`.
- **Conflicts:** none (the migration area is owned by this branch).

### Phase 2 — Avatar lifecycle and account deletion (SRV-01, 07, 08, 24)

- **Scope:** sections 1 and 2.
- **Files:**
  - `server-account`: `profile/avatar/*`, new `account-deletion/*`, index, README, `vitest.db.config.ts`, devDependency on `server-data`.
  - `server-supabase`: `auth-operations/account-deletion-operations/*`, `session-claims/recent-link-sign-in.ts`, index, README.
  - `server-data`: `./testing` export; move the storage test.
  - `features-auth/contracts`: remove `hasRecentLinkSignIn*` after the consumers move.
  - App: `delete-account/{actions,page}.tsx`, `features/account/server/save-avatar.ts`, delete `features/auth/server/operations/*`.
- **Contract changes:** new `deleteOwnAccount`, `sendAccountDeletionLink`, `hasRecentLinkSignIn` (moved); `saveAvatar` outcomes gain `conflict`, `account-deleting`, `unconfirmed`; `removeOldAvatars` becomes internal (its only outside consumer migrates); avatar `cacheControl` → 3600.
- **Tests:** section 2 unit and db; section 1 unit (every matrix row) and db (F5, F6, F7 via stale AMR, F12, more than 100 objects, `user_not_found` resolver).
- **Verify:** package tests, `pnpm typecheck`, `pnpm boundaries`, `pnpm deps`, both `test:db` suites, manual deletion with a forced failure.
- **Conflicts:** `features-auth` is next on the other session's list (`docs/audits/packages-refactor.md`). Agree on ownership of `recent-link-sign-in` before starting.

### Phase 3 — Auth classification (approved; SRV-02, 03, 12, 13)

- Unchanged from the approved plan.
- **Files:** `server-supabase` `auth-errors` (now also holds `isRateLimited` from `e7030fc7`), `claims/classify-claims.ts`, `supabase-identity-provider`, `provider-user/provider-user.ts`, the unlink fallback; app auth actions.
- **Coordinate:** the other session committed `auth-errors` changes in `e7030fc7`; confirm it has no further pending edits there.

### Phase 4 — Profile lifecycle (approved Option B; SRV-06, 20)

- **Scope:** section 3.
- **Depends on:** Phase 1 (schema) and the domain session's `needsProfileSetup` signature change (commit first, or agree on the signature and let one side land both).
- **Files:** `server-account/profile/{names,setup}`; `server-supabase` `exchangeAuthCode`; app callback, `setup-actions`, `name-actions`, welcome and settings pages; features-account form.
- **Verify:** section 3's integrated list plus `pnpm test:e2e` (auth specs) locally.

### Phase 5 — Boundaries and public API (approved conditionally; SRV-04, 17, 22)

- **Scope:**
  - Narrow `./claims` to `readClaims` / `ClaimsResult`: move `profileFromClaims` and `currentUserFromClaims` (added by `e7030fc7`) to the guarded root, and split `dev-fixture.ts` so the proxy imports only `fixtureModeEnabled`.
  - Extend R10 to all non-`./testing` export keys, with one named exception and a probe.
  - Remove the `server-auth` `./utils` export (repository-wide search: zero consumers of any file type; dependents `apps/web` and `server-supabase` import only the root).
  - Explicit root exports.
  - SRV-22.
- **Proxy verification (your condition):**
  1. On a branch, add `import 'server-only'` to `claims/index.ts`.
  2. `pnpm build`.
  3. Start the production server against the local stack.
  4. Request a protected route signed in, signed out, and with Auth stopped (`pnpm db:stack stop` of Auth only, or a bad URL).
  5. If all three behave, drop the exception instead of adding it. If the proxy fails to load, keep the exception, and record the failure output as its justification.
- **Conflicts:** the claims and `session.ts` files were last edited by `e7030fc7`; confirm no pending edits.

### Phase 6 — Reads, cache and routes (SRV-09, 19, 21, 23)

- **Scope:** section 4.
- **Conflicts:** `fix/r4-pin-toggle-race` for SRV-21.

### Phase 7 — Contracts and hygiene (SRV-05 provisional naming, 10, 11, 14, 15)

- **Participation:** introduce a type only with SRV-19 as its consumer, as a feature-local `SpaceItemLink` in `features-spaces/server/types`, marked provisional in its doc comment. Domain placement and the final noun wait for the glossary decision, coordinated with the domain session.

### Cross-agent integration points

| Integration point                                                       | Committed by the other session     | This plan's phase       | Rule                                                  |
| ----------------------------------------------------------------------- | ---------------------------------- | ----------------------- | ----------------------------------------------------- |
| `server-supabase/auth-errors` (`isRateLimited`)                         | `e7030fc7`                         | 3                       | no concurrent edits; build on the commit              |
| `server-supabase/claims` (`profileFromClaims`, `currentUserFromClaims`) | `e7030fc7`                         | 5                       | move to the root after confirming no pending edits    |
| `server-supabase/provider-user` (`providerImageFrom`)                   | `e7030fc7`                         | 2 (save-avatar uses it) | consume only                                          |
| `domain-identity` `profile-setup` signature                             | pending (domain session)           | 4                       | one side lands both, or the domain change lands first |
| `features-auth/contracts` `recent-link-sign-in`                         | `features-auth` next on their list | 2                       | agree on the owner before editing                     |
| Space participation type                                                | not started                        | 7                       | provisional feature-local label only                  |

Before each phase: `git log` / `git status` of the paths above; stop if another session has uncommitted edits there.

---

## 6. Decisions requiring approval

**G1. The account-deletion marker (schema change in the branch migration).**

- Recommendation: add `profiles.account_deletion_started_at` with a 15-minute expiry, honored by the avatar commit and the `avatars_insert_own` policy. It's what makes "no new photo during deletion" enforceable without a privileged key or background job.
- Alternative: no marker (no schema change). D-I1 and D-I2 still hold, but an upload committing between the sweep and the RPC survives deletion as a public file.
- Tradeoff: one column plus one policy clause, against a known orphan window.

**G2. Avatar browser/CDN cache lifetime.** Recommendation: change the upload's `cacheControl` from one year to one hour. It costs some extra bandwidth for repeat views (unique names already prevent staleness) and limits how long a deleted photo can be served from caches. The alternative is keeping one year, which is fine only if the hosted plan has Smart CDN and you accept browser-cached copies.

Already settled and not re-asked: Option B; the narrow `./claims` exception with build verification; auth-classification consolidation; the structure; provisional participation naming. Two defaults I'll apply unless you object: backfilling `profile_confirmed=true` users as **skipped**, and prefilling first name only from an explicit provider `given_name`, stored only when the person submits.

---

## 7. Remaining verification gaps

| Item                                                              | Status                                                 | Evidence needed                                                     |
| ----------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------- |
| `user_not_found` from `getUser` after deletion                    | assumed from GoTrue behavior                           | db test (F12, resolver)                                             |
| `57014` and a lost RPC response                                   | rollback by Postgres semantics; resolver path untested | db test with a stale AMR (`42501`); unit tests with injected errors |
| Storage accepting a deleted user's token (step 6)                 | unknown; step 6 is best effort only                    | db test; doesn't block the design                                   |
| Storage RLS evaluated at the start or end of an upload (S7 width) | unknown                                                | db test or Supabase Storage source; documented as residual          |
| `created_at` at or after upload start                             | by construction; unasserted                            | db test                                                             |
| Basic-CDN behavior on deletion                                    | NOT VERIFIABLE from docs                               | hosted project plan check                                           |
| Proxy with `server-only`                                          | NOT VERIFIABLE from docs                               | Phase 5 build plus smoke test                                       |
| SRV-21, SRV-22                                                    | unobserved                                             | browser check; `curl -I`                                            |
| Full `pnpm verify` and database suites at the gate commit         | not run                                                | Phase 0                                                             |
