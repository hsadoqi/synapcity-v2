# S6a: Account Verification and Auth Parity

**Status:** Proposed. Implementation-ready (D11 Decided). Any hosted Auth change is behind the deployment gates.
**Date:** 2026-10-30
**Roadmap:** [database execution roadmap](../plans/2026-10-30-database-execution-roadmap.md), slice S6a
**Contracts:** [database architecture handoff](2026-10-30-database-architecture-handoff.md) D11; INV-1, INV-2
**Branch:** `db/s6a-account-auth-parity`

## A. Identity and scope

- **Capability:** no new behavior. The working account surfaces are proven:
  - profile name and avatar, preferences, the signup trigger, avatar storage policies and account deletion;
  - local Auth behaves like hosted Auth, so local tests mean something;
  - manual identity linking is off everywhere until a feature uses it (D11).
- **Problem:**
  - No SQL or Storage tests cover `profiles`, `user_preferences`, `handle_new_user`, the avatars bucket or `delete_own_account` (DB-09).
  - **Already in the repository (checked 2026-10-30):** `supabase/config.toml` has `skip_nonce_check = false`, `enable_manual_linking = false`, `site_url` and the redirect on `http://127.0.0.1:3000`, with a D11 comment, and `apps/web/.env.example` documents the same local origin. This was not compared with hosted values.
  - **Still outstanding:**
    - whether every local setting equals the hosted security semantics (needs the hosted values from a read-only `supabase config diff`, run by the owner or operator behind D2);
    - the `localhost:8080` (`dev` script) versus `127.0.0.1:3000` (`dev:local`) origin, which needs a README note;
    - the configuration matrix document;
    - nothing in this list is claimed verified until the matrix is complete.
- **Exists:**
  - migrations 0001 to 0008;
  - `server-account` (`save-name`, `save-avatar`, `preferences`);
  - `features-account` forms;
  - `apps/web/src/app/(auth)/auth/delete-account/actions.ts`;
  - `supabase/config.toml`;
  - the local-session E2E runner.
- **In scope:**
  1. SQL and Storage tests.
  2. `config.toml` verification against the hosted values, and alignment only where they differ.
  3. Local origin unification.
  4. A configuration matrix doc.
  5. Signup and profile E2E.
- **Out of scope:** avatar cleanup recovery (S6b, which stacks on this slice's account SQL tests); hosted Auth changes, which are owner actions.
- **Dependencies:** I: F1, F5. The hosted values for the matrix come from a read-only `supabase config diff` run by the owner or operator (behind D2).

## B. Data model

No migration. The tests use synthetic users in rolled-back transactions (SQL), or harness users (Storage).

## C. Contracts

- **Local `config.toml` mirrors hosted security semantics:**
  - email confirmation;
  - password strength;
  - secure password change;
  - OTP length;
  - the nonce check (on);
  - `enable_manual_linking = false`.

  Exact values come from the config diff at implementation. Every remaining difference is listed in `docs/engineering/auth-configuration.md` with its reason.

- **One local origin, `http://127.0.0.1:3000`** (the reconciliation roadmap's agent parameter, Section I Slice 6):
  - `site_url`;
  - `additional_redirect_urls = ["http://127.0.0.1:3000/auth/callback"]`;
  - `apps/web/.env.example` `SITE_URL`;
  - `dev:local` unchanged.

  The `dev` script stays on 8080 for fixture mode, and its README note says auth flows use `dev:local`.

## D. Integration

Tests only, plus config and docs. E2E users are created through the Admin API, so stricter local confirmation does not affect them.

## E. Fixtures

SQL fixtures cover the three signup metadata shapes (password, Google `picture`, GitHub `avatar_url`), and a JWT `amr` claim with and without a recent email-link sign-in.

## F. UI

Not applicable. No UI change.

## G. Verification

| Layer                         | Test                                                                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| SQL `profiles.sql`            | select and update own only; column grants (`display_name`, `avatar_url` only); immutable id                                           |
| SQL `user-preferences.sql`    | own row only; 16 KiB `::text` boundary; `schema_version` behavior as is (V-12 measured note)                                          |
| SQL `signup-trigger.sql`      | `handle_new_user` creates a profile for each metadata shape; Google picture read                                                      |
| SQL `delete-own-account.sql`  | refuses no session; refuses a stale or missing email-link `amr`; deletes only the caller; cascades `profiles`, preferences, resources |
| Storage (two-user, `test:db`) | owner-folder upload and replace allowed; cross-folder write and delete denied; public read by URL works (D10)                         |
| E2E (local session)           | signup, profile setup, name update, avatar upload                                                                                     |
| Config                        | `pnpm exec supabase start` on the aligned config; the auth E2E passes on `127.0.0.1:3000`                                             |
| Repository                    | `pnpm verify`, `pnpm db:test`                                                                                                         |

Negative proof: weaken `profiles_update_own` and the avatar folder policy in turn. Each must turn its test red.

## H. Completion

- **IC:**
  - section G passes;
  - the matrix doc is complete;
  - an ADR-0006 "Unresolved" note references the ledger and D11 (shared with F4: whichever lands second links to the first).
- **RC:** merged. The hosted Auth half, if the matrix shows hosted changes are needed, is a separate owner-approved action recorded in the ledger.

## I. Risks

- **Restarting the shared local stack** with a new `config.toml` affects every worktree. Announce it, or use F5's disposable stack.
- **Stricter local confirmation** may break manual local sign-up flows; the matrix documents how to confirm locally (Mailpit).
