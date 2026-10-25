# Profile photos: keep every photo and let the person choose

**Status:** Proposed. Nothing here is approved or implemented. Section 7 lists the decisions that need the owner.
**Date:** 2026-10-25
**Governing documents:** [ADR-0006](../../architecture/decisions/0006-authentication-with-supabase.md) (profiles, avatars bucket), [ADR-0014](../../architecture/decisions/0014-multi-app-package-boundaries.md) (where code lives), [M7 design](2026-10-24-m7-auth-account-design.md).
**Terminology:** "photo" is a working label. `docs/glossary.md` has no entry for it, so no table, package or route name below is decided (AGENTS.md section 3).

## 1. What was observed

During the M7 manual checks (2026-10-25) two things were seen:

1. After a page refresh the profile photo briefly showed a different picture, and the first interaction with the page brought the other one back.
2. Signing in with Google replaced the photo the person had uploaded with their Google photo.

## 2. Current state (read at `f3768472`)

| Where                                                         | What it holds                                                                                                                                             |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public.profiles.avatar_url`                                  | One URL. Documented as canonical (`profile-metadata.ts`). Set at sign-up by a trigger from `avatar_url` or `picture`, then changed by the avatar actions. |
| `auth.users.raw_user_meta_data` (the token's `user_metadata`) | A mirror of the above, written by `withAvatarUrl`. The header reads this through the token claims (`current-user.ts`: `avatar_url` or `picture`).         |
| `auth.identities.identity_data`                               | What each linked provider supplied (`picture` for Google, `avatar_url` for GitHub). Read by `providerImageFrom` as the fallback after a removal.          |
| Storage bucket `avatars`                                      | Public read, owner-only write. `saveAvatar` stores one file per upload under `<userId>/` and `removeOldAvatars` deletes every other file in that folder.  |

## 3. Likely cause of the two observations (not yet reproduced)

Supabase refreshes `user_metadata` from the provider on an OAuth sign-in. That would overwrite the mirrored `avatar_url` with Google's `picture` while `profiles.avatar_url` still holds the upload. The header (token claims) then shows the provider photo, and anything that reads the profile row shows the upload. That matches both observations: the first render uses the token, and the later read uses the profile.

To confirm before any fix: sign in with Google on an account that has an uploaded photo, then compare `profiles.avatar_url` with the token's `user_metadata.avatar_url`. Supabase's behavior here is version-sensitive and must be checked against its current documentation (AGENTS.md section 7a); it is marked NOT VERIFIED until then.

## 4. Two separable changes

**A. Fix the disagreement (small).** One source of truth for the photo shown. Either the header reads the profile row, or the mirror is re-written after an OAuth sign-in. No new table. Fixes both observations.

**B. Keep every photo (this request).** A person can have several photos: one per linked provider, plus their own uploads. They can look at them and choose which is active. A provider sign-in can add or refresh a provider photo but never changes the active one.

A should ship first and does not depend on B. B builds on A: once there is one source of truth, B only changes what that source is.

## 5. Proposal for B (not approved)

### 5.1 Model

A new table, one row per photo, owned by one user:

| Column (working names) | Notes                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| `id`                   | Durable identifier.                                                                        |
| `user_id`              | References the user. Row-level security: the owner reads and writes their own rows only.   |
| `source`               | `upload`, `google`, `github`. A closed set that grows with the provider list.              |
| `url`                  | `https` only, 2048 characters at most, the same check as `profiles.avatar_url_https`.      |
| `storage_path`         | Set for uploads and for copied provider photos; null when the photo stays a provider link. |
| `created_at`           | Ordering.                                                                                  |

The active photo stays in `profiles.avatar_url`, which keeps working for every current reader. Choosing a photo updates that one column; no reader changes.

### 5.2 Rules

- A provider sign-in may insert or refresh its own `source` row. It never touches `profiles.avatar_url` after the first sign-up.
- Choosing a photo sets `profiles.avatar_url` and the token mirror together, in one server operation.
- Removing a photo deletes its row and its file. If it was active, the active photo falls back to the newest remaining one, or to none (initials).
- A per-person cap on stored photos (open question Q3).
- Account deletion removes the rows with the user (cascade) and the files with the existing storage cleanup.

### 5.3 Provider photos: link or copy

Provider picture URLs can change or stop working, and Google's can be served from short-lived addresses. Linking is simple but a photo can break. Copying into the `avatars` bucket is stable but means storing a third-party image on the person's behalf. Open question Q2.

### 5.4 Where code goes (ADR-0014)

- Contract (photo schema, source set, resolution rule): `packages/domain/identity`.
- Operations (list, add, choose, remove, with the bucket calls): `packages/server/account`, taking the Supabase client as an argument.
- Screen (a gallery in Settings, choose and remove): `packages/features/account`, with the Server Actions staying in `apps/web` as in M7.
- Migration: `supabase/migrations/`, with a backfill that creates one `upload` or provider row from each existing `profiles.avatar_url`.

## 6. What this does not change

The avatar upload limits and image-type check, the `avatars` bucket policies for writes, name editing, and the header's use of `profiles.avatar_url` as the active photo.

## 7. Decisions for the owner

| #   | Question                                                                                                   | Recommendation                                                                  |
| --- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Q1  | Ship A (one source of truth) on its own first?                                                             | Yes. It fixes the visible bug and shrinks B.                                    |
| Q2  | Link provider photos, or copy them into the `avatars` bucket?                                              | Copy, so a changed provider URL cannot break the gallery. Needs privacy review. |
| Q3  | How many photos may one person keep?                                                                       | A small cap such as 10, to bound storage.                                       |
| Q4  | Should a new provider sign-in on a person with no photo set the active photo?                              | Yes, only when `profiles.avatar_url` is empty.                                  |
| Q5  | Terminology: "photo", "avatar", or "profile picture"? Table and package names follow the glossary process. | Decide in the glossary before the migration is written.                         |

Approving B is an approval-gate decision: it creates a persisted schema and a durable identifier and changes storage behavior (AGENTS.md section 5).

## 8. Verification plan

- Reproduce section 3 on a throwaway account before changing anything, and record the result here.
- Domain schema and resolution-rule unit tests; server operation tests for add, choose, remove, cap and cascade; a row-level security SQL test that one user cannot read or change another's rows.
- Manual: Google and GitHub sign-in on an account with an upload, refresh with no flicker, choose, remove, delete the account.
- The full `pnpm verify`. Live provider behavior is not covered by any automated check.

## 9. Not decided

Table and column names (Q5), the cap (Q3), link versus copy (Q2), whether GitHub photos are in scope for the first release, and how the gallery looks.

## 10. Investigation log (2026-10-25)

Recorded from the M7 manual checks and the debugging that followed. Each item says what was seen, what was checked, and how sure we are. Nothing here was reproduced in a controlled test.

### 10.1 Redirects after sign-out and some OAuth sign-ins

- Seen: after signing out, and on some Google sign-ins, the browser landed on the wrong route. Later reported working.
- Checked: `UserProvider`, the auth-event rule (`shouldRefreshOnAuthEvent`), the browser client, `SignOutButton`, `DeleteAccount`, `DeleteAccountCard`, and the diff of the server actions from #70 to `main` (`f3768472`). The provider and event logic match the pre-M7 code; the components differ only in receiving their Server Actions as props; the server action diff is imports only. `signOut` still clears the session, revalidates the layout and redirects to `/`. The user menu reaches it through `AuthStatus`, which is unchanged. The standalone `SignOutButton` is not rendered anywhere (its only use in `home/page.tsx` is commented out).
- Not checked: the diff of #69, which moved the provider operations into `server-supabase`; the dev server's cached build; the `next` value passed through the callback.
- Theory (unconfirmed): nothing in #70 to #74 changed this behavior, so the wrong route either predates M7, came from #69, or came from a stale dev build. It stopped happening, so no cause was found.

### 10.2 Delete account: link rejected, then "too many tries"

- Seen: the first deletion email arrived, but opening the link reported it as expired, although it was opened right after requesting it. A second request was refused as too many tries.
- Checked: `requestAccountDeletion`, `sendAccountDeletionLink`, `deleteOwnAccount`, the callback route, `hasRecentLinkSignIn` (10-minute window), the error page wording, and `isRateLimited`.
- Finding: the callback sends every failed code exchange to the error page for the flow. The page's text lists three reasons (expired, already used, opened in a different browser) and cannot say which happened. "Expired" in the report therefore does not prove the link was old.
- Theories, most likely first: (1) the link was opened in a different browser, profile or an email app's built-in browser, so the PKCE secret was missing; (2) a mail client or scanner opened the link first and used the one-time code; (3) the Supabase email OTP lifetime. `supabase/config.toml` sets `otp_expiry = 3600`, which is the local config and not necessarily the hosted project's value.
- The refusal is Supabase's `over_email_send_rate_limit` or `over_request_rate_limit`, mapped by `isRateLimited` and `authErrorMessage`. ADR-0006 records that the default email sender is rate-limited and was accepted for now. Registration, recovery and deletion emails sent in one session probably used the budget. Not confirmed against the project's auth logs.
- Outcome: the owner reported it working afterwards. The dashboard auth logs were not read.
- Possible improvement, not made: pass the real error code from the callback to the error page so it can say which failure happened. It changes auth wording, so it needs the owner's approval.

### 10.3 Photo flicker and replacement

See sections 1 to 3. Hypothesis: a Google sign-in rewrites `user_metadata.avatar_url` while `profiles.avatar_url` keeps the upload. Not reproduced.

### 10.4 Discussion and decisions

- The owner chose a short design document before any photo work, and asked that errors, attempts, theories and discussions be recorded.
- Whether the photo bug is fixed first (change A) or together with the gallery (change B) is open (Q1).
- No code, migration, ADR or glossary entry was changed.
