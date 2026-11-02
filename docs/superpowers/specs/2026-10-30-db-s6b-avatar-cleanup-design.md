# S6b: Recoverable Avatar Cleanup

**Status:** Proposed, revision 4.

- The intent queue with its claim and lease state machine, the avatar write functions, the runner RPCs and the tests are implementation-ready (D10 Decided).
- **G-runner gates S6b(a) and RC.** The cleanup runner uses a service-role credential and needs the owner's explicit approval before it is built (AH §9 item 13).
- **This slice is the roadmap's one expand/migrate/contract exception** (roadmap section 5). It lands in three merges: (m-expand) in T3, (a) after T3 and G-runner, and (m-contract) in its own train, T3c, immediately after S6b(a) is deployed. RC is possible only after T3c. The contract is deliberately not coupled to T4, so an unrelated S7 decision cannot delay it.
- The migration's merge position follows AH M-3 (last in the later order) unless the owner allows it earlier (roadmap section 10).
- Revision 2 removed the "log when both removal and enqueue fail" path and the folder sweep. Revision 3 closes the race between the runner and `commit_avatar`, defines how the runner reaches the queue, and bounds the number of pending uploads.

**Date:** 2026-10-30
**Roadmap:** [database execution roadmap](../plans/2026-10-30-database-execution-roadmap.md), slice S6b, trains T3 (expand) and T3c (contract)
**Contracts:** [database architecture handoff](2026-10-30-database-architecture-handoff.md) D10; INV-2, INV-20 (and the strengthening proposed in roadmap section 11, item 3); M-3, M-4, M-5
**Branch:** `db/s6b-avatar-cleanup`, stacked on S6a.

**Preview safety:** pushed only after Preview isolation holds (roadmap section 5a, PI-3). Development and local verification do not wait for it.

## A. Identity and scope

- **Capability:** replacing or removing an avatar, abandoning an upload, or deleting the account never leaves a public image that nothing records. Every object that should be removed has a durable cleanup intent before the app reports success. Only the runner removes such objects, and it can never remove an object that is, or is about to become, the current avatar.
- **Problem (Exists, in `packages/server/account/src/profile/save-avatar/save-avatar.ts`):**
  - The upload writes `<uid>/<uuid>.<ext>`. Names are unique per upload, which is already correct.
  - Then it updates `profiles.avatar_url` directly.
  - Then `removeOldAvatars` lists the whole folder and removes everything except the new path. That is two defects:
    1. **No durable record.** A failed removal leaves an orphan nobody knows about (ID-01).
    2. **A concurrency defect.** The sweep can remove a second tab's upload that has not yet committed its URL.
  - Account deletion runs the same sweep, then `delete_own_account()`.
- **In scope:**
  - the intent queue with claims and leases;
  - four avatar write functions;
  - three runner RPCs;
  - `delete_own_account()` enqueuing in the same transaction;
  - replacing the folder sweep;
  - the runner, built after G-runner;
  - the contract migration;
  - the D10 statement in the docs;
  - tests.
- **Out of scope:** discovering pre-existing orphans. That would need a one-off listing with the runner's credential, which is a separate approved operation.
- **Dependencies:**
  - I: S6a (account SQL tests, `delete_own_account` baseline), F5.
  - R: T3 for (m-expand), T3c for (m-contract).
  - G: G-runner before (a).

## B. Data model and persistence

### Migration `storage_cleanup_queue` (m-expand, T3)

**`private.storage_cleanup_intents`:**

- `id bigint generated always as identity primary key`
- `bucket text not null check (bucket = 'avatars')`
- `object_name text not null`
- `owner_id uuid`. It has no FK: the account is gone when an `account_deleted` intent drains. It is derived from the path prefix and used only for locking and bounding.
- `reason text not null check (reason in ('replaced','removed','upload_abandoned','account_deleted'))`
- `state text not null default 'pending' check (state in ('pending','claimed','held'))`
- `claim_token uuid`, `claimed_at timestamptz`, `claim_expires_at timestamptz`, constrained by
  `check ((state = 'claimed' and claim_token is not null and claimed_at is not null and claim_expires_at is not null) or (state <> 'claimed' and claim_token is null and claimed_at is null and claim_expires_at is null))`.
  Every transition out of `claimed` (complete, fail, held) and every upsert clears all three fields explicitly.
- `not_before timestamptz not null default now()`
- `attempts int not null default 0`
- `last_error_code text check (last_error_code is null or last_error_code ~ '^[a-z0-9_.:-]{1,64}$')`
- `attempts` is capped at 10,000 (`least(attempts + 1, 10000)`), so a row cannot grow or overflow through repeated failure.
- `created_at timestamptz not null default now()`
- `unique (bucket, object_name)`
- index on `(state, not_before)`
- index on `(owner_id) where reason = 'upload_abandoned' and state = 'pending'`

There are no grants to any client role, including `service_role`. Every access goes through the functions below.

**Object identity.** Object names are unique per upload (a new UUID each time) and never reused, so `object_name` identifies one object. An intent can never refer to a later replacement.

**State machine.**

```text
pending ──claim (runner)──► claimed ──complete (runner, token match)──► (row deleted)
   ▲                           │
   └──fail (runner, token)─────┘   attempts + 1; not_before = now() + backoff
claimed with expired lease ──claim (runner)──► claimed (new token)   reclaim after a crash
pending ──commit_avatar (owner, upload_abandoned only)──► (row deleted; object becomes current)
pending ──claim finds the object is current──► held   anomaly, excluded from claims, monitored
held ──object stops being current (commit_avatar replaces it, clear_avatar, delete_own_account)──► pending   new reason, due now
```

Rules:

1. **An object is removed only when a durable intent exists for it and it can no longer become current.** That happens in two ways:
   - **(a)** The runner removes it while holding a claim.
   - **(b)** The owner's app removes it immediately after `commit_avatar` or `clear_avatar` committed its `replaced` or `removed` intent.

   Path (b) is safe because rule 3 means a replaced or removed path can never be committed again. Both paths removing the same object at once is harmless: a removal of a missing object is a no-op success. `complete_avatar_cleanup` deletes only a `pending` intent whose object is gone, and leaves a claimed intent to the runner's token.

2. **`commit_avatar` refuses any intent in state `claimed`** (`cleanup_in_progress`), whatever its lease, because a runner whose lease expired may still be mid-delete. The client uploads again under a new path. A claimed intent leaves `claimed` only through `complete` or `fail` with its token, or through a reclaim after lease expiry, which re-verifies everything.
3. **`commit_avatar` accepts only a `pending` `upload_abandoned` intent** for the caller's path. A replaced or removed object can never be made current again.
4. **`commit_avatar` verifies that the exact `storage.objects` row exists** (`bucket_id = 'avatars' and name = p_path`, owned by the caller) before making it current. Otherwise it raises `object_missing`, so a profile never points to a removed object.
5. **Enqueue upsert rule.** `commit_avatar` (for the old path), `clear_avatar` and `delete_own_account` enqueue with `insert … on conflict (bucket, object_name) do update`, under the shared locks. On conflict:
   - an existing **`held`** intent becomes `pending`, with the new reason, `not_before = now()`, all claim fields null and `last_error_code` null. This is the only exit from `held`, and it happens exactly when the object stops being current, so a held object is never left orphaned;
   - an existing **`pending`** intent takes the new reason, with `not_before = least(not_before, now())`;
   - an existing **`claimed`** intent is left alone, because the runner already removes it.

**Shared lock order:** the owner's `profiles` row first, then the intent row. Every function that takes both locks follows it, so there is no deadlock:

- `commit_avatar` and `clear_avatar` lock the profile `for update`, then the intent.
- `cleanup_claim` locks the profile `for update skip locked`, then the intent `for update skip locked`, candidate by candidate.
- `account_deleted` intents have no profile, so only the intent is locked. Their owner no longer exists, so nothing can commit them.

**Owner functions.** All are `SECURITY DEFINER` with `set search_path = ''` and fully qualified names. `execute` is revoked from `public`, `anon` and `service_role`, and granted to `authenticated`. Each checks `auth.uid() is not null`. Every path must match `^<auth.uid()>/[0-9a-f-]{36}\.(png|jpg|jpeg|webp|gif)$`, using the extensions `extensionFor` produces (checked at implementation). Anything else raises `42501`.

| Function                          | Effect, in one transaction, in the shared lock order                                                                                                                                                                                                                                                                                                             |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `begin_avatar_upload(p_path)`     | Lock the profile. Refuse with `too_many_pending_uploads` if the caller already has 5 or more `pending` `upload_abandoned` intents, or 20 or more open intents in any state with `owner_id` = caller (agent parameters, section I). Insert an intent: `upload_abandoned`, `not_before = now() + interval '1 hour'`.                                               |
| `commit_avatar(p_path)`           | Lock the profile, then the path's intent. Rules 2 to 4 above. Read the old path from `avatar_url`, only if it is a public URL into `avatars/<uid>/` (provider pictures are not bucket objects). Set `avatar_url` to the public URL of `p_path`. Delete `p_path`'s intent. Enqueue a `replaced` intent, due now, for the old path under the upsert rule (rule 5). |
| `clear_avatar()`                  | Lock the profile. Enqueue a `removed` intent for the current path under the upsert rule (rule 5). Set `avatar_url = null`.                                                                                                                                                                                                                                       |
| `complete_avatar_cleanup(p_path)` | For the app's best-effort immediate removal. Lock the profile, then the intent. Delete the caller's `pending` intent for `p_path` only if no `storage.objects` row exists for it. A claimed intent is left to the runner.                                                                                                                                        |

**Runner RPCs.** The service key does not make the `private` schema reachable through PostgREST, and the schema stays unexposed. The runner calls three public functions instead. Each is `SECURITY DEFINER` with `set search_path = ''`, with `execute` revoked from `public`, `anon` and `authenticated` and granted to `service_role` only. Each checks `auth.role() = 'service_role'` as defense in depth.

| Function                                                                                                            | Effect                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cleanup_claim(p_limit int, p_lease interval) returns table (intent_id bigint, object_name text, claim_token uuid)` | 1. Select candidate ids with `not_before <= now()` and either `pending`, or `claimed` with `claim_expires_at < now()`, without locking. 2. For each candidate, in the shared lock order with `skip locked`: lock the owner's profile if one exists, then the intent; recheck that it is still due. 3. If the object's public URL equals the profile's `avatar_url`, set `held`, clear all claim fields, store `last_error_code = 'is_current'`, and skip it. 4. Otherwise set `claimed`, a new `claim_token`, `claimed_at = now()` and `claim_expires_at = now() + p_lease`. 5. Return the claimed rows. `p_lease` is between 1 and 30 minutes. |
| `cleanup_complete(p_intent_id, p_claim_token) returns boolean`                                                      | Delete the intent only where `state = 'claimed'` and the token matches. Deleting the row removes all claim fields with it. A stale token is a no-op that returns false.                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `cleanup_fail(p_intent_id, p_claim_token, p_error_code text)`                                                       | Where the token matches: set `pending` and clear `claim_token`, `claimed_at` and `claim_expires_at`. Set `attempts = least(attempts + 1, 10000)`. Store `p_error_code` if it matches the code pattern, otherwise `'invalid_error_code'`. Set `not_before = now() + least(interval '1 day', interval '1 minute' * power(2, least(attempts, 11)))`; the exponent is capped before the interval is computed.                                                                                                                                                                                                                                       |

**`create or replace function public.delete_own_account()`.**

- It keeps every existing refusal: no session, or no recent email-link `amr`.
- Before deleting the user, in the same transaction, it locks the caller's profile, then enqueues an `account_deleted` intent for every `storage.objects` row in `avatars` under `<uid>/`, under the upsert rule (rule 5). The current avatar's `held` intent, if any, therefore becomes due instead of being left behind with no profile to release it.
- Reading `storage.objects` from a definer function must be verified against Supabase's Storage schema rules at implementation. If it is not allowed, stop and report.

### Migration `avatar_url_write_contract` (m-contract, T3c)

- `revoke update (avatar_url) on public.profiles from authenticated`. After this, the definer functions are the only client path that changes `avatar_url`.
- It ships only after S6b(a) is deployed (M-5).
- Other writers of `avatar_url` (`handle_new_user` at signup, any metadata mirror) are found with `git grep` at implementation and must be definer code, which the revoke does not affect.

### Durability and race argument (INV-20)

**Every object is current, or it has an intent.** The intent is committed before the app reports success, and before the object stops being current:

- an upload's intent exists before its bytes exist;
- `commit_avatar` atomically turns "new object pending" into "old object due";
- account deletion enqueues in the deleting transaction.

**Each failure point:**

- `begin` fails: nothing is uploaded.
- The upload fails: the runner's removal of a missing object is a no-op success.
- `commit` fails or is refused: the old avatar stays, and the new object's intent remains.
- The immediate removal fails: the intent is already there.
- The runner crashes **before** the Storage removal: the lease expires, the intent is reclaimed and removed.
- The runner crashes **after** the Storage removal, before `cleanup_complete`: it is reclaimed, the removal of a now-missing object is a no-op, then it completes.

**The runner and `commit_avatar` cannot interleave badly:**

- If the claim locks the profile first, `commit_avatar` waits, then sees `claimed` and refuses.
- If `commit_avatar` locks first, the claim's `skip locked` passes over the candidate. On its next run the intent is gone, because the object is now current.

**Existing data.** Profiles keep their `avatar_url`. Objects orphaned before this slice are not discovered (out of scope).

## C. Domain contracts and validation

- The path pattern and the pending-upload bound are shared constants in `@synapcity/domain-identity`, beside the `avatar-url` utilities.
- `extensionFor` and the SQL pattern are tied by a unit test.
- Error codes: `cleanup_in_progress`, `object_missing`, `too_many_pending_uploads`. Each is a custom SQLSTATE chosen like S1's V-1, and mapped in `server-account`.

## D. Data access and application integration

**`save-avatar.ts`, upload:**

1. Generate the path.
2. `rpc('begin_avatar_upload')`. On failure, including `too_many_pending_uploads`, return `upload-failed` and stop.
3. Upload the object. On failure, return `upload-failed`; the intent remains.
4. `rpc('commit_avatar')`. On `cleanup_in_progress` or `object_missing`, return `upload-failed` with "Please try again"; a retry uses a new path. On any other failure, return failure; the old avatar stays.
5. Report success.
6. Best-effort `storage.remove([old])`, then `rpc('complete_avatar_cleanup', old)`. A failure here is logged only; the intent is durable.

**Remove:** `rpc('clear_avatar')`, then the same best-effort step.

**`removeOldAvatars` (the folder sweep) is deleted.** Account deletion keeps a best-effort removal of the caller's objects before the RPC, to shorten public exposure, then `delete_own_account()` enqueues whatever remains.

**Runner (built after G-runner):** `scripts/storage-cleanup-runner.mjs`, operator-run, with the service key from an ignored env file.

- It refuses non-loopback targets unless run under the separately approved hosted procedure in `database-release.md`.
- Loop: `rpc('cleanup_claim', { p_limit: 50, p_lease: '10 minutes' })`. For each row, remove it through the Storage API, then call `cleanup_complete` on success, or `cleanup_fail` with the error code on failure.
- A Storage "not found" counts as success.
- It never lists or sweeps folders.
- Queue length per state, `held` rows, the oldest due `not_before`, and per-owner pending upload counts are in F4's growth monitoring.

## E. Factories, fixtures and seeds

- Test users with two avatar objects.
- Induced failures through a test seam in `save-avatar.ts`'s injected storage client:
  - a Storage removal failure;
  - an upload abandoned between upload and commit;
  - a concurrent second-tab upload.
- A runner harness that can stop after `cleanup_claim` or after the Storage removal, to simulate crashes.

## F. Frontend and user experience

No visible change beyond one message. The avatar form keeps its states. A replacement whose commit is refused shows "Please try again", and the old avatar stays visible. Cleanup is never shown to the person.

## G. Verification

| Layer                           | Test                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SQL                             | every owner function refuses other users' and malformed paths; `commit_avatar` accepts only a pending `upload_abandoned` intent, refuses `claimed` (any lease) and a missing `storage.objects` row, and swaps the URL and intents atomically; provider URLs are not enqueued; `clear_avatar` enqueues and clears; `complete_avatar_cleanup` refuses while the object exists and ignores claimed intents; `begin_avatar_upload` refuses the 6th pending upload; deletion enqueues every object in the caller's folder and nothing else, in the deleting transaction; no client role, `service_role` included, can read or write the table directly; `authenticated` cannot execute the runner RPCs; after (m-contract), a direct `avatar_url` update is refused |
| Runner RPCs                     | claim marks rows `claimed` with a token and lease; a stale token cannot complete or fail; an expired lease is reclaimed with a new token; backoff grows with attempts; a current object becomes `held` and is never returned                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Held exits                      | from `held`: `commit_avatar` replacing that object, `clear_avatar`, and `delete_own_account` each turn the intent to `pending` with the new reason, due now, with claim fields null; a subsequent claim removes it. A held intent whose object stays current is never claimed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| State check                     | inserting or updating to `claimed` without all three claim fields, or to `pending` or `held` with any of them, is rejected by the CHECK                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Backoff bounds                  | at `attempts` 10,000 and beyond, `cleanup_fail` neither overflows nor exceeds one day; an over-long or malformed error code is stored as `invalid_error_code`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Open-intent bound               | the 6th pending upload and the 21st open intent of any state are refused for one owner                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Quota never blocks              | with an owner at 5 pending uploads and at 20 or more open intents of any state: `commit_avatar` for a pending upload, `clear_avatar`, `delete_own_account` and the runner RPCs all succeed; only `begin_avatar_upload` is refused. Account deletion with 25 open intents enqueues every remaining object. The refusal never prevents draining the queue                                                                                                                                                                                                                                                                                                                                                                                                        |
| Concurrency (two sessions)      | **claim against commit**, in both orders, gives the outcomes in section B, and the object that becomes current is never claimed; claim against `clear_avatar`; two runners claiming concurrently never claim the same row (`skip locked`); `delete_own_account` against a claim                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Immediate removal against claim | the app's immediate removal and `complete_avatar_cleanup` racing a runner claim of the same `replaced` intent, in both orders: the object is removed once (the second removal a no-op), the intent ends deleted, and no current object is touched                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Crash recovery                  | runner stopped after claim, before removal: reclaimed after the lease, removed, completed. Runner stopped after removal, before completion: reclaimed, no-op removal, completed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Two-user                        | B cannot begin, commit, clear or complete for A's paths                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Unit                            | the `save-avatar` flow for each failure point in section B; the pattern tie-in test; error-code mapping                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| E2E (local session)             | **induced failure:** a removal failure leaves a `replaced` intent, which the runner then removes, along with the object. An abandoned upload is drained after `not_before`, with the policy time lowered in the test                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Repository                      | `pnpm verify`, `pnpm db:test`, `test:db`, `pnpm db:types` with no diff                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

## H. Completion

- **IC:** section G passes, including the quota-never-blocks row and the runner rows (so IC needs G-runner). The D10 statement (a public URL grants read access) is in the account README and `docs/engineering/setup.md`.
- **RC:**
  - T3 applied with (m-expand); S6b(a) deployed.
  - In production with a throwaway account: an **induced cleanup failure** (an abandoned upload, made with an owner-run script that calls `begin_avatar_upload` and uploads without committing) is enqueued, then **drained** by the approved runner after `not_before`, and the object is gone. Queue states are recorded.
  - T3c applied with (m-contract), and a post-check that `authenticated` lacks the `avatar_url` update grant.
  - A ledger entry.

  RC is never claimed before T3c.

## I. Risks

- **`delete_own_account`, `commit_avatar` and the runner RPCs are security-critical definer functions.** Every refusal is tested, and the advisor output is triaged (M-8).
- **Between (a) and (m-contract),** a direct Data API caller can still write `avatar_url` and bypass the queue for their own avatar. The app paths are covered, and full INV-20 holds from (m-contract).
- **Queue growth.**
  - Per active owner, open intents are bounded: at most 5 pending uploads and at most 20 open intents in any state.
  - `account_deleted` rows are bounded by the objects that existed at deletion.
  - Across owners, total queue size grows with the number of accounts and is not otherwise bounded. That is monitored (F4: rows per state, per-owner open counts, oldest due) and covered by the G-quota-T3 acceptance.
  - The 5 and 20 limits are the approved hard enforcement limits (owner, 2026-10-30), enforced only in `begin_avatar_upload`. Nothing else is counted against them.
  - Monitoring and review thresholds (queue over 10,000 rows, any related table over 1 GiB, a `held` row older than 24 hours, oldest due intent older than 7 days) are not database constraints. They are alerts for owner review.
  - The 7-day trigger is an operational gate for the next train. It does not run the runner, which is operator-run (before each train, at least weekly).
- **A slow client** whose upload is claimed after the one-hour `not_before` has to upload again. That is accepted, and the message says so.
