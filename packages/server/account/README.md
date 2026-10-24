# @synapcity/server-account

Owns: account-scoped persistence operations for the verified caller, beginning with preference-row reads and writes (ADR-0010).

Runtime: server-only. The host supplies the request-bound Supabase client and verified user id. This package does not resolve identity, choose fixture mode, log failures, or read environment variables.

## Public interface

`@synapcity/server-account` exports:

- `readAccountPreferenceRow(client, userId)` returns normalized preferences, an empty account state, or a structured provider failure.
- `writeAccountPreferenceRow(client, userId, preferences, deviceTimezone?)` writes the supplied account record and reports an error or an RLS/no-row result without logging.

The host validates browser input, checks the caller, and decides how failures are logged and presented. No user id is accepted from the browser.

## Scripts

`lint`, `check-types`, `test`, and `test:coverage`. Tests use a stub request client; they do not connect to a database
