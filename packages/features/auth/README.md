# @synapcity/features-auth

Owns: the auth experience: sign-in, registration, recovery, email change, connected accounts, sign-out and account deletion presentation and workflows, plus the shared auth shell and its pieces. Plan: [M7.5](../../../docs/superpowers/plans/2026-10-25-m7-5-features-auth.md). Identity schemas belong to `@synapcity/domain-identity`; provider operations belong to `@synapcity/server-supabase` and `@synapcity/server-auth`.

## Public interface

- `@synapcity/features-auth/contracts`: `AuthState` and its helpers, the connected-accounts model, the auth error messages and the recent-link sign-in rule.
- `@synapcity/features-auth/frontend`: the auth components and client state. Files that need `next/*` live under `src/frontend/next/` (rule R11).

The host supplies what a package cannot import: Server Actions, the browser Supabase client factory, route paths and fixture mode. This package does not import app code, define Server Actions or read the session.

## Scripts

`lint`, `check-types`, `test`, and `test:coverage`.
