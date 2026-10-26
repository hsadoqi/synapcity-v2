# ADR-0014: Notion connection storage and token handling

**Status:** Accepted  
**Date:** 2026-10-23 (drafted and accepted)  
**Deciders:** Hanaa Sadoqi (repository owner), by direct approval in session on 2026-10-23 of the [Notion import spec](../../superpowers/specs/2026-10-23-notion-import-design.md)'s recommendations D1 (one table, owner-only RLS), D2 (app-level AES-256-GCM token encryption) and D3 (OAuth flow and atomic token refresh), as written.

## Context

On 2026-10-23 the owner moved Notion import into scope as a track separate from the first slice (`docs/product/non-goals.md`, "Notion import track"). A person who is signed in to Synapcity links their own Notion account. Notion grants an access token and a refresh token, and the app must keep both to call the Notion API on that person's behalf. Notion is never used to sign in. [ADR-0006](0006-authentication-with-supabase.md) keeps identity in Supabase Auth.

Constraints this decision has to respect:

- **Ownership.** Content and records belong to one user and are protected by row-level security. [ADR-0010](0010-preference-persistence.md), [ADR-0012](0012-owned-space-records.md) and [ADR-0013](0013-document-and-dashboard-persistence.md) all use owner-only RLS with server-validated writes.
- **Keys.** The app uses only the Supabase publishable key. `apps/web/src/lib/supabase/env.ts` says the secret and service-role keys "must never be used here".
- **Development.** Fixture mode has no session and must not mutate anything (`apps/web/src/lib/access/dev-fixture.ts`).
- **Notion's OAuth** ([Authorization](https://developers.notion.com/docs/authorization), checked 2026-10-23):
  - the token response includes `access_token`, `refresh_token`, `bot_id`, `workspace_id` and `owner`;
  - a `refresh_token` grant returns "a new access token and a new refresh token";
  - no token lifetime and no revocation endpoint are documented.

Evidence from the prototype at `~/Desktop/notion-lexical` (outside the repository; evidence only, AGENTS.md section 4): the flow and refresh below were exercised there against a mocked Notion API, including one refresh shared by concurrent calls and losing a refresh race. They have not been run against a real Notion workspace.

This ADR resolves part of the "Notion import" candidate in the [index](README.md). It also resolves part of "Persistence, API, routing and state management", for this one table only.

## Decision

### 1. One connection row per user, owner-only RLS

- **Table.** A single Supabase table holds each user's Notion connection, one row per user:
  - `user_id`: primary key, references `auth.users (id)` on delete cascade;
  - `workspace_id`, `workspace_name`, `workspace_icon`, `bot_id`;
  - `notion_user_name` (display only);
  - `access_token_ciphertext`, `refresh_token_ciphertext`;
  - a flag that the connection needs reconnecting;
  - `connected_at`, `updated_at`.
- **No email.** The Notion user's email is not stored.
- **RLS.** A person can select, insert, update and delete only their own row. All writes go through server operations (the [ADR-0008](0008-auth-actions-and-server-operations.md) pattern), never directly from the browser.
- **No new key.** Connect, import and sync run inside the signed-in person's request, using the existing publishable-key server client. No secret or service-role key is introduced.
- **One workspace.** Connecting a different workspace replaces the row.

### 2. Tokens encrypted in the app before storage

- **Encryption.** Both tokens are encrypted on the server with AES-256-GCM before they are written, using a server-only key from an environment variable.
- **Rotation.** The ciphertext carries a key-version prefix, so the key can be rotated without a migration.
- **Never exposed.** Tokens and webhook secrets are never logged and never sent to the browser.

### 3. OAuth flow bound to the signed-in user, with atomic refresh

- **Connect.** It refuses in fixture mode and when signed out. It sets a short-lived httpOnly cookie holding a random `state`, the starting user's verified `claims.sub`, and a same-site return path.
- **Callback.** It requires the matching `state` and the same `claims.sub` before exchanging the code. Otherwise it stops without storing anything.
- **Refresh.**
  - On a 401 from Notion, refresh once and retry.
  - Store the new access and refresh tokens in one update, conditional on the refresh token that was used (compare-and-set). The update that loses uses the stored token.
  - A call that failed with a token that has since been replaced uses the stored token instead of refreshing again.
  - A rejected refresh sets the reconnect flag, and the person is asked to reconnect.
- **Disconnect.** A server action deletes the row. Documents created from Notion are kept.

## Scope

This ADR governs how a Notion connection and its tokens are stored, protected, created, refreshed and removed.

## What this does NOT decide

- The table, column, route and feature names. They go through the `docs/glossary.md` naming process; the names above are working labels.
- The encryption key's environment variable name, and the key rotation procedure.
- When implementation starts. Under the spec's D0 it follows Minimal Documents.
- Where an imported Document records its source (D5), converter nodes and dependencies (D6), imported files (D7), sync rules (D8), and webhooks (D9). Webhooks would need a privileged key or a `security definer` function, which this ADR does not adopt.
- Settings UI copy and layout beyond the spec's D4.
- More than one workspace per user.

## Unresolved

- Whether a refresh revokes the previous access token is not documented by Notion. The compare-and-set design is correct either way, and the first real-workspace test should record what happens.
- Behavior across serverless instances: concurrent refreshes in different instances rely on the database compare-and-set alone. An in-process de-duplication only reduces wasted refresh calls.

## Governance boundary

The repository owner owns this decision. Changing the storage model, introducing a privileged key, or moving token protection to Supabase Vault requires the owner's approval and a superseding ADR.

## Integration expectations

- **Placement.** Server code lives in an app-local feature under `apps/web/src/features/`, reading identity only through `getVerifiedClaims()`.
- **Migration.** A migration drafted for this table follows the existing pattern: owner-only RLS policies and an owner index. It is not applied by repository tooling, matching the ADR-0012 and ADR-0013 migrations.
- **Settings.** The Notion row reads display columns only.

## Verification expectations

- **RLS tests:** a second user can neither read nor change another user's row.
- **Callback tests:** it refuses when signed out, in fixture mode, on a `state` mismatch, and when `claims.sub` differs from the user who started the flow.
- **Refresh tests,** against a mocked Notion API:
  - rotation stores both tokens;
  - concurrent 401s cause one refresh;
  - losing the compare-and-set does not overwrite the winner;
  - a rejected refresh sets the reconnect flag.
- **No leaks:** a check that no token or ciphertext reaches client components or logs.
- **Real workspace:** one manual connect, refresh and disconnect against a real Notion workspace before release.

## Reconsideration conditions

- Notion documents token lifetimes, revocation or a different refresh behavior.
- Webhooks (spec D9) are adopted and need a privileged path.
- Users need several workspaces at once.
- An audit finds the app-level key management harder to operate than Supabase Vault.
