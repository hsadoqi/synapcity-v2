# Packages Audit

## Domain (pure rules, no I/O)

### **`@synapcity/domain-identity`**, in [packages/domain/identity](packages/domain/identity)

- `schemas/`: `avatar`, `credentials` (now includes `registrationSchema`), `name` (includes `firstNameSchema`/`lastNameSchema`), `profile`
- `utils/`: `avatar-url`, `check-name`, `current-user`, `initials`, `is-rate-limited`, `oauth-providers`, `profile-confirmed`, `provider-image`
- `types/`
- Used by almost everything below, plus `frontend-blocks` (the `User` type only).

## Server (talks to Supabase)

### **`@synapcity/server-supabase`**, in [packages/server/supabase](packages/server/supabase)

- `auth-operations/`: the five units you just split (`sign-in`, `account`, `password`, `recovery`, `registration`)
- `auth-errors`, `provider-failure`, `provider-user`, `claims`, `request-client`, `supabase-identity-provider`, `database-types`
- Also used by `features-settings`, `features-spaces` and `server-data`, but only for `SupabaseServerClient` and `ProviderFailure`.

### **`@synapcity/server-auth`**, in [packages/server/auth](packages/server/auth)

- `utils/is-owner`, `utils/verify-identity`, `types/`, `testing/fake-identity-provider`

### **`@synapcity/server-account`**, in [packages/server/account](packages/server/account)

- `profile/`: `image-type`, `mirror-to-session`, `profile-metadata`, `save-avatar`, `save-name`
- `preferences/`, used by `features-settings` through `readAccountPreferenceRow`

## Frontend infrastructure

### **`@synapcity/frontend-supabase`**, in [packages/frontend/supabase](packages/frontend/supabase)

- `browser-client`, `auth-events`

## Features (UI + contracts)

### **`@synapcity/features-auth`**, in [packages/features/auth](packages/features/auth). This is the largest package.

- `contracts/utils/`: `form-state` (AuthState), `error-messages`, `connected-accounts`, `recent-link-sign-in`
- `frontend/components/`: `auth-confirmation`, `auth-divider`, `auth-shell`, `connected-accounts`, `current-user-avatar`, `delete-account`, `oauth-buttons`, `password/{forgot-password, password-reset, update-password}`, `register`, `resend`, `resend-button`, `sign-out`
- `frontend/hooks/`: `use-confirmation`, `use-cooldown`
- `frontend/providers/`: `connected-accounts`, `pending-email`
- `frontend/next/components/`: `auth-buttons`, `auth-link-button`, `delete-account-card`, `email`, `login`, `profile-setup-card`, `sign-in-again`
- `frontend/next/providers/`: `user-provider`

### **`@synapcity/features-account`**, in [packages/features/account](packages/features/account)

- `frontend/components/`: `avatar/{avatar-field, avatar-form}`, `name/{name-field, name-form}`, `profile/{profile-setup-form, profile-summary}`, `profile-avatar`
- `frontend/next/components/profile-form-shell`
- `contracts/types`
- Imported by `features-auth`.

## Web app wiring ([apps/web](apps/web))

- **Routes:** `(auth)/auth/{callback, delete-account, error, forgot-password, login, register, update-password, welcome}`, `(status)/auth/unavailable`, `(protected)/[userId]/settings`
- **Server Actions:**
  - `features/auth/server/{actions, form-data, operations, session, site-origin}`
  - `features/account/server/actions`
  - `features/settings/server/actions`
- **Components:** `features/auth/components/auth-status`, `features/settings/components/account-settings`
- **Libraries:**
  - `lib/access/` (`caller`, `dev-fixture`, `require-owner`, `require-signed-in`)
  - `lib/routing/` (`auth-flow`, `auth-unavailable`, `safe-next`, `sign-in-href`, `route-access`, `user-paths`, `notices`)
  - `lib/supabase/` (`client`, `server`, `middleware`, `env`)
  - `proxy.ts`

## Database ([supabase](supabase))

- **Migrations:**
  - `create_profiles`
  - `create_avatars_bucket`
  - `profiles_signup_read_google_picture`
  - `delete_own_account`
  - `restore_delete_own_account_execute`
  - `create_user_preferences`
  - `user_preferences_size_by_text`
  - `profiles_structured_names`
- **Tests:** `profiles.sql`, `storage-avatars.sql`, `delete-own-account*.sql`, `user-preferences.sql`

## Two things in the split I noticed but didn't change

- Some type-only imports in the split units lost their `type` modifier, for example `import { SupabaseServerClient }` in `registration-operations.ts`. Lint passes, but it's inconsistent with `sign-in-operations.ts`, which still uses `import type`.
- The ADR-0008 header comment ("an action owns the form, an operation owns one provider call") now appears only in `registration-operations.ts`. It describes all five units, so it probably belongs in `auth-operations/index.ts` or a short README.

## Suggested order

Go bottom-up so each layer is refined against settled dependencies: domain-identity → server-supabase → server-auth / server-account → frontend-supabase → features-account → features-auth → the web app's wiring. The database side is already settled at `574f6789`, so I'd leave it out unless something needs it.

Want me to start with `domain-identity`? I'd begin with a read-only pass that lists concrete readability and organization findings (naming, file boundaries, dead or duplicated exports, test placement). You'd approve or reject each one before I edit anything.
