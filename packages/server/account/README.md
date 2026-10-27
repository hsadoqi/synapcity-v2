# @synapcity/server-account

Owns: account-scoped persistence operations for the verified caller: preference-row reads and writes (ADR-0010) and, since M7.2 Task C, the profile operations (name, avatar, session mirroring).

Runtime: server-only. The host supplies the request-bound Supabase client and verified user id. This package does not resolve identity, choose fixture mode, log failures, or read environment variables.

## Public interface

`@synapcity/server-account` exports:

- `readAccountPreferenceRow(client, userId)` returns normalized preferences, an empty account state, or a `ProviderFailure` (code and status only, from `server-supabase`).
- `writeAccountPreferenceRow(client, userId, preferences, deviceTimezone?)` writes the supplied, already-validated `AccountPreferences` and reports a `ProviderFailure` or the RLS/no-row result (`row_not_written`) without logging.
- `saveName(client, user, name)` saves the name to the caller's own profile row and returns `{ ok: true, patch }` or `{ ok: false, failure }`.
- `saveAvatar(client, user, request)` uploads or removes the picture and returns `{ ok: true, avatarUrl, patch }` or `{ ok: false, reason, message?, failure? }`, where `reason` is `invalid-file`, `unsupported-type`, `upload-failed` or `profile-not-saved`. The host owns the wording.
- `removeOldAvatars(client, userId, keep?)`, best effort; `mirrorToSession(client, user, patches)` returns `{ ok: true }` or `{ ok: false, step, failure }`.
- The pure helpers `withFullName`, `withAvatarUrl`, `withProfileConfirmed`, `detectImageType` and `extensionFor`.

Failures carry a code and status only, through `toProviderFailure`. The package never logs and holds no product copy; the host logs the same operation names (`saveName`, `saveAvatar.upload`, `saveAvatar.profile`, `mirrorToSession.updateUser`, `mirrorToSession.refreshSession`) and maps reasons to messages.

The host validates browser input, checks the caller, and decides how failures are logged and presented. No user id is accepted from the browser.

## Scripts

`lint`, `check-types`, `test`, and `test:coverage`. Tests use a stub request client; they do not connect to a database.
