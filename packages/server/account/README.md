# @synapcity/server-account

Owns: account-scoped persistence operations for the verified caller: preference-row reads and writes (ADR-0010), the profile operations (name, avatar, session mirroring; since M7.2 Task C) and deleting the account (since 2026-11-11).

Runtime: server-only. The host supplies the request-bound Supabase client and verified user id. This package does not resolve identity, choose fixture mode, log failures, or read environment variables.

## Public interface

`@synapcity/server-account` exports:

- `readAccountPreferenceRow(client, userId)` returns normalized preferences, an empty account state, or a `ProviderFailure` (code and status only, from `server-supabase`).
- `writeAccountPreferenceRow(client, userId, preferences, deviceTimezone?)` writes the supplied, already-validated `AccountPreferences` and reports a `ProviderFailure` or the RLS/no-row result (`row_not_written`) without logging.
- `saveName(client, user, name)` saves the name to the caller's own profile row and returns `{ ok: true, patch }` or `{ ok: false, failure }`.
- `saveAvatar(client, user, request)` uploads or removes the picture and returns `{ ok: true, avatarUrl, patch }` or `{ ok: false, reason, message?, failure? }`, where `reason` is `invalid-file`, `unsupported-type`, `upload-failed`, `profile-not-saved`, `account-deleting`, `conflict` or `unconfirmed`. The host owns the wording. `avatarUrl` is what the row holds after the save, which a newer save may already have changed.
- `readProfileSetup(client, userId)` reads the names and the setup state (`incomplete`, `skipped`, `completed`) from `profiles`. `saveProfileNames(client, userId, { firstName, lastName, displayName })` saves the names and marks setup completed in one write (the database stamps the time and keeps the first one), returning a patch that mirrors the names into the token; it reports `first-name-required` when the database refuses completion without a valid first name. `skipProfileSetup(client, userId)` records a skip only while setup is not completed.
- `deleteOwnAccount(client)` deletes the caller's own account and returns an `AccountDeletionOutcome`: `deleted` (with an optional `cleanupFailure` to log), `link-required`, `signed-out`, `unavailable`, `failed { step, photoRemoved }` or `unconfirmed`.
- `mirrorToSession(client, user, patches)` returns `{ ok: true }` or `{ ok: false, step, failure }`.
- The pure helpers `withFullName`, `withAvatarUrl`, `withProfileNames`, `detectImageType` and `extensionFor`. `withProfileConfirmed` (the old `user_metadata` flag) is transitional and no longer called; profile setup is recorded in `profiles`.

### Avatar lifecycle

- Every upload is a new, uniquely named object in the caller's folder, cached for an hour (`cacheControl: '3600'`). Pictures uploaded before 2026-11-11 were cached for a year; caches that already hold them are not invalidated by this change.
- The profile row is changed with a compare-and-set against the value read before the upload, and only while no account-deletion marker is active, so a late write never overwrites a newer picture and no save removes another save's file.
- After a commit, a save removes the picture it replaced, then unreferenced objects older than an hour (`ORPHAN_MIN_AGE_MS`): no request can still commit an object that old (300 s function limit, 8 s statement timeout).

### Account deletion

The database part is one transaction (`delete_own_account()`); Storage cannot join it. The workflow marks the profile (`account_deletion_started_at`, stamped by the database, active for 15 minutes) and takes the uploaded picture off it, removes every file in the folder, calls the database function, sweeps once more and signs the browser out. A failure at any step leaves a consistent account whose profile never points at a removed file; an ambiguous answer is resolved by calling the function again and then asking Auth whether the user exists, never assumed. While the marker is active, `saveAvatar` and the `avatars_insert_own` Storage policy refuse new pictures.

Failures carry a code and status only, through `toProviderFailure`. The package never logs and holds no product copy; the host logs the same operation names (`saveName`, `saveAvatar.upload`, `saveAvatar.profile`, `mirrorToSession.updateUser`, `mirrorToSession.refreshSession`) and maps reasons to messages.

The host validates browser input, checks the caller, and decides how failures are logged and presented. No user id is accepted from the browser.

## Scripts

`lint`, `check-types`, `test`, and `test:coverage` use a stateful stub request client (`src/testing/fake-account-client.ts`) and do not connect to a database. `test:db` runs the `*.dbtest.ts` files against the disposable stack with real signed-in clients, using the `@synapcity/server-data/testing` harness; see `vitest.db.config.ts`.
