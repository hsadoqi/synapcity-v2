# Notion import: connected account, import and sync

Status: Draft; D0–D4 approved by the owner on 2026-10-23, D5–D9 open. Date: 2026-10-23. Branch: `feat/build-space-entity` (working tree only; not committed).

## Decision recorded

On 2026-10-23 the product owner moved Notion import into scope (see `docs/product/non-goals.md`, "Notion import track"):

- **Concept:** a person who is signed in to Synapcity links their own Notion account, chooses pages, and gets them as Documents they can edit.
- **Identity:** Notion is a connected account, never a sign-in method. Synapcity identity stays Supabase Auth (ADR-0006).
- **Recording:** narrow the non-goal for this one provider and keep the design here.

This is a separate track from the quick-capture first slice. `docs/product/first-slice.md` is unchanged. The non-goals still defer every other integration, and they still defer write-back to Notion.

On 2026-10-23 the owner approved D0–D4 as written. D1–D3 are recorded in [ADR-0014](../../architecture/decisions/0014-notion-connection-and-token-handling.md), while D0 (sequencing) and D4 (settings placement) are recorded here. D5–D9 are still open and each needs owner approval (AGENTS.md section 5).

## Evidence

### Prototype (evidence, not authority)

A standalone prototype lives outside this repository at `~/Desktop/notion-lexical`. It uses Next.js 16.4.3 and Lexical 0.52.0. Under AGENTS.md section 4 it is evidence of what works. It is not code to migrate.

What it shows:

- **Conversion.** A server-side converter turns Notion blocks into Lexical editor state through `@lexical/headless`, using the same node classes the client editor uses. It covers:
  - paragraphs, headings and lists (nested, numbered, to-do);
  - quotes, callouts, toggles, code, equations, tables, columns;
  - images, file, video and PDF cards, bookmarks and embeds;
  - child pages, `link_to_page`, synced blocks and the table of contents.

  Rich text keeps marks, colors, links and mentions. Unknown blocks render as an "Unsupported Notion block" note, so nothing is dropped silently.

- **Fetching.** A recursive fetch handles pagination, synced blocks and data-source rows. A rate-limited client retries 429 responses using `Retry-After`.
- **Assets.** Notion-hosted files are copied before their URLs expire.
- **Sync rules.** A re-sync is skipped when `last_edited_time` has not moved. Local edits win by default, and the user is offered a "replace with Notion's version" choice.
- **Per-user scoping.** Every connection, document and search is keyed by the host app's user id. It reads that id from one function, `getAppUserId()`.
- **OAuth binding.** The OAuth `state` cookie records which app user started the flow. The callback refuses to finish when nobody is signed in, or when a different user is signed in.
- **Token refresh (the D3 design).** On a 401 the client refreshes once and retries. The rotated access and refresh tokens are stored with a compare-and-set on the refresh token that was used. A call that failed with a token that has since been replaced reuses the stored token instead of refreshing again. A rejected refresh flags the connection, and the person is asked to reconnect.
- **Checks run in the prototype (2026-10-23):**
  - `tsc --noEmit`;
  - a mocked-API pipeline script covering pagination, 429 retry, asset copying, cross-page links, the sync conflict rule and isolation between two users;
  - a mocked-API refresh script covering retry after refresh, rotation, one refresh shared by concurrent calls, losing a refresh race, a rejected refresh, a missing refresh token, and a policy-blocked 429 that is not retried;
  - HTTP probes of a production build with a stub identity.

What it does not show:

- It was never run against a real Notion workspace. Whether a refresh revokes the previous access token is undocumented, so the refresh mock leaves it valid.
- It stores data in a JSON file, not Postgres, so it has no RLS. Its compare-and-set relies on the store's in-process write queue, not a conditional database update.
- Its throttle and its sharing of concurrent refreshes live in process memory, so neither holds across serverless instances.

### Upstream (checked 2026-10-23)

- **OAuth** ([Authorization](https://developers.notion.com/docs/authorization)):
  - Authorize URL parameters: `client_id`, `redirect_uri`, `response_type=code`, `owner=user`, `state`.
  - Token exchange: HTTP Basic client authentication.
  - The token response includes `access_token`, `refresh_token`, `bot_id`, `workspace_id`, and `owner` (the authorizing user).
  - A `refresh_token` grant exists. Notion says "Refreshing an access token will generate a new access token and a new refresh token". The page states no token lifetime and no revocation endpoint.
- **Rate limits** ([Request limits](https://developers.notion.com/reference/request-limits)):
  - Each connection has a fixed budget per 60-second window: 180 requests (about 3 per second), or 600 on Business and Enterprise plans.
  - A separate limit is shared across all of a workspace's connections.
  - Data-source queries are limited to about 3 per second per connection.
  - A 429 response carries `Retry-After` in seconds. Do not retry a 429 with `public_api_request_blocked`.
- **Files** ([File object](https://developers.notion.com/reference/file-object)): Notion says "The URL is valid for one hour."
- **Webhooks** ([Webhooks](https://developers.notion.com/reference/webhooks), [Event types and delivery](https://developers.notion.com/reference/webhooks-events-delivery)):
  - A subscription is created in the connection's settings and verified once with a `verification_token`. Each request is signed with `X-Notion-Signature`, an HMAC-SHA256 of the raw body keyed by that token.
  - Page events: `created`, `content_updated` (aggregated), `properties_updated`, `moved`, `deleted`, `undeleted`, `locked`, `unlocked`.
  - Payloads include `workspace_id`, `integration_id`, `accessible_by`, `entity` and `timestamp`.
  - Delivery is at-most-once, with up to 8 retries over about 24 hours. Events are unordered and may be stale, so Notion recommends fetching current data from the API.
- **Lexical:** the npm registry lists `lexical` and `@lexical/react` 0.52.0 as the latest release (published 2026-09-28).
- **API version:** the versioning page uses `2026-03-11` in its examples but does not state the latest value. Verify it again when an ADR pins the version.

## Current state in Synapcity

- **Identity.** ADR-0006 adopts Supabase Auth. `getVerifiedClaims()` in `apps/web/src/features/auth/server/session/session.ts` returns verified claims, and `claims.sub` is the user id. Development fixture mode (`SYNAPCITY_DEV_AUTH=fixture`) has no session and cannot mutate (`apps/web/src/lib/access/dev-fixture.ts`).
- **Supabase keys.** The app uses only the publishable key. `apps/web/src/lib/supabase/env.ts` says the secret and service-role keys "must never be used here".
- **Documents.** ADR-0013 stores Document metadata only: "Body, editor state, widgets and layouts are not decided". Lexical is not installed. The first slice proposes Lexical editor state stored as JSON per Document (`first-slice.md`, required decisions 3 and 6).
- **Linked accounts in settings.** Settings shows linked Google and GitHub accounts (`getConnectedAccounts`). These are Supabase sign-in identities. A Notion connection is a different kind of thing: an API grant that is never used to sign in.

## Phases

Each phase is its own pull request and can be verified and reverted on its own.

| Phase | Delivers                                                                                                                                          | Blocked on                                       |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| 0     | This spec and the owner decision.                                                                                                                 | —                                                |
| 1     | Connect and disconnect Notion from settings: connection storage, the OAuth routes, token encryption and refresh. Nothing is imported yet.         | D0, D1, D2, D3, D4                               |
| 2     | Import: page picker, server-side conversion, and new Documents with a Lexical body and a record of their Notion source. Assets copied to Storage. | First-slice Document storage (decision 3), D5–D7 |
| 3     | Manual re-sync with the "local edits win" rule, plus an automatic check when a Document is opened or the window regains focus.                    | D8                                               |
| 4     | Live sync by webhook.                                                                                                                             | D9                                               |

Out of scope for every phase: write-back to Notion, other providers, and importing a whole workspace in the background.

## Decisions needed (owner approval, AGENTS.md section 5)

### D0. Sequencing against the first slice

**Approved 2026-10-23.**

**Recommend:** start phase 1 once the first slice's Minimal Documents has shipped. Phase 2 cannot land before Document storage (first-slice decision 3) is approved and implemented.

**Why:** if import comes first, Notion's block model would set the first Document persistence envelope. The first slice deliberately keeps that envelope minimal. The prototype shows imported content fits the proposed envelope, Lexical editor state as JSON, without changing it. Only the node set grows (D6).

### D1. Connection storage

**Approved 2026-10-23; recorded in ADR-0014.**

**Recommend:** one Supabase table for the user's Notion connection, one row per user. Its name goes through the `docs/glossary.md` naming process; the working label is "Notion connection". Columns:

- `user_id`: primary key, references `auth.users` with cascade on delete;
- `workspace_id`, `workspace_name`, `workspace_icon`, `bot_id`;
- `notion_user_name`, shown as "Connected as …";
- `access_token_ciphertext`, `refresh_token_ciphertext`;
- `connected_at`, `updated_at`.

Rules:

- **RLS:** a person can select, insert, update and delete only their own row. All writes go through server operations (ADR-0008), never directly from the browser.
- **No new key:** the callback, import and sync run in the signed-in person's request, so the existing publishable-key server client and RLS are enough. Phases 1–3 need no service-role key.
- **Email:** do not store the Notion user's email. The display needs only the name.
- **Record it in a new ADR.** The precedents are ADR-0010 (one table, RLS, server-validated writes) and ADR-0012.

### D2. Token protection

**Approved 2026-10-23 (app-level AES-256-GCM, not Vault); recorded in ADR-0014.**

**Recommend:** encrypt both tokens in the app with AES-256-GCM before they reach the database, using a server-only key in a new environment variable. Keep a key version prefix in the ciphertext so the key can be rotated. Never log tokens; the prototype logs its webhook verification token, and that must not be carried over.

**Why:** RLS stops other users from reading a row, but the ciphertext is still visible to the database owner, backups and the person's own session. Encryption in the app keeps a leaked row useless without the key.

**Alternative:** Supabase Vault, if the owner prefers secrets kept inside the database. Evaluate it in the ADR. It was not verified for this spec.

### D3. OAuth flow and refresh

**Approved 2026-10-23; recorded in ADR-0014.**

**Recommend:**

- **Routes:** two route handlers, connect and callback; segment names go through the glossary process. Connect refuses in fixture mode or when signed out. It sets a short-lived httpOnly cookie holding `state`, the starting user's `claims.sub`, and a same-site `returnTo`.
- **Callback:** it requires a valid `state` and the same `claims.sub`. It exchanges the code and upserts the user's row, so connecting a new workspace replaces the old connection.
- **Disconnect:** a server action that deletes the row. Documents are kept.
- **Refresh:** when Notion answers 401, call the `refresh_token` grant once. Save the new access and refresh tokens in one update, conditional on the old refresh token, so two concurrent refreshes cannot both win. If the refresh fails, mark the connection as needing reconnection and tell the person.

**Why:** Notion issues a new refresh token on every refresh. Losing a race loses the connection, so the update has to be atomic.

### D4. Settings placement and copy

**Approved 2026-10-23.**

**Recommend:** a separate "Notion" row in settings showing the workspace, "Connected as …", and a Connect or Disconnect button. Do not list it with the sign-in identities: Google and GitHub sign you in, Notion does not. Disconnecting says that imported Documents stay.

### D5. Recording where a Document came from

**Recommend:** a separate table, not new columns on `documents`. Working label: "document source". Columns:

- `document_id`: references `documents`, cascade on delete;
- `owner_id`, `provider` (checked: `notion`), `external_id` (the page id), `workspace_id`;
- `external_last_edited_at`, `synced_at`, `local_edited_at`, `remote_changed_at`, `sync_error`.

Add a unique constraint on (`owner_id`, `provider`, `external_id`), and owner-only RLS.

**Why:** the ADR-0013 `documents` table stays provider-neutral. A Document that was never imported has no source row, and deleting the source row turns an imported Document into an ordinary one.

### D6. Node set, converter location and dependencies

**Recommend:**

- **Node set:** phase 2 converts into the node set approved for Documents at that time. Every other block becomes a visible "unsupported block" node, never silent loss. Add each further node (callout, toggle, columns, image, embed card, table) as its own small approval with its own tests.
- **Converter:** server-only, in a new feature folder under `apps/web/src/features/`; the name goes through the glossary process. It depends on the Documents feature's node registry and is never imported by it.
- **Dependencies:** `@lexical/headless`, plus whichever `@lexical/*` packages the nodes need, at the same version the first slice installs. That version is 0.52.0 if it is still the latest at install time.

### D7. Imported files

**Recommend:** copy Notion-hosted files into a private Supabase Storage bucket during import. Notion URLs last one hour. Use owner-scoped paths, with access through signed URLs or an owner-checked route. The avatars bucket migration is the precedent. Copy external (`type: "external"`) URLs as links, not files.

### D8. Sync rules

**Recommend:** carry over the prototype's rules:

- skip the fetch when `last_edited_time` is unchanged;
- local edits win, with an explicit "replace with Notion's version" action;
- a page deleted in Notion shows an error rather than deleting the Document.

Run the cheap check when a Document is opened and when the window regains focus. Back off on 429 using `Retry-After`. The per-connection budget is about 3 requests per second on most plans, and the workspace limit is shared with the person's other integrations.

### D9. Webhooks (phase 4)

**Recommend:** decide only after phase 3 is in use, and keep phases 1–3 free of it.

A webhook request has no user session, so processing one needs either a Supabase service-role or secret key on the server, or a narrowly scoped `security definer` function. Both are new, security-consequential mechanisms. If adopted:

- **Subscription:** one subscription per integration, created by the operator.
- **Verification token:** kept as a server secret, not in a table.
- **Signature:** checked over the raw body.
- **Events are hints:** treat each event only as "something changed". Match it to source rows by `workspace_id` and page id, then re-fetch through the normal sync path, because delivery is unordered and at-most-once.

Polling on open and focus (D8) may make this phase unnecessary.

## Risks

- **Notion API changes.** Pin `Notion-Version` in one place and re-check the upgrade guides when bumping it.
- **Large imports exceed a request.** Phase 2 caps a single import (the prototype uses 100 items). Background jobs are out of scope.
- **Shared workspace limits.** Rate limiting can come from the person's other Notion integrations. Surface the 429 reason, not a generic error.
- **Conversion gaps.** Unsupported blocks are visible. Add each node type only with tests that round-trip converter output through the editor.

## Not decided here

Glossary names for every table, route and feature; ADR numbers; the encryption key's variable name; Storage bucket layout; webhook adoption; any write-back.
