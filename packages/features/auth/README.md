# @synapcity/features-auth

Owns: the auth experience: sign-in, registration, recovery, email change, connected accounts, sign-out and account deletion presentation and workflows, the post-sign-up profile step, the shared auth shell and its pieces, and the `AuthButtons` navigation. Plan: [M7.5](../../../docs/superpowers/plans/2026-10-25-m7-5-features-auth.md). Identity schemas belong to `@synapcity/domain-identity`; provider operations belong to `@synapcity/server-supabase` and `@synapcity/server-auth`; the name and photo forms belong to `@synapcity/features-account`.

## Public interface

- `@synapcity/features-auth/contracts`: `AuthState` and its helpers, `AuthAction` and `AuthFormAction` (the shapes of the actions a host passes in), `DeleteAccountState`, the connected-accounts model, the auth error messages and the recent-link sign-in rule.
- `@synapcity/features-auth/frontend`: `LoginForm`, `OAuthButtons`, `RegisterCard`, `ForgotPasswordCard`, `UpdatePasswordCard`, `ResendConfirmation`, `ResendResetLink`, `PasswordReset`, `ConnectedAccounts`, `DeleteAccount`, `SignOutButton`, `CurrentUserAvatar`; the shared `AuthShell`, `AuthDivider`, `AuthConfirmation`, `AuthLinkButton` and `ResendButton`; the client state (`useConfirmation`, `useCooldown`, `PendingEmailProvider`, `ConnectedAccountsProvider`); and, from `src/frontend/next/` because they use `next/*` (rule R11), `UserProvider`, `useCurrentUser`, `EmailChange`, `SignInAgain`, `AuthButtons`, `ProfileSetupCard` and `DeleteAccountCard`.

The host supplies what a package cannot import: the Server Actions (each component takes the ones it and its children use, under their own names), `signInHref(returnTo)` where a form can ask a person to sign in again (ADR-0009), and the browser client factory (`createClient`) for `UserProvider` and `EmailChange`. This package does not import app code, define Server Actions, choose fixture mode or read the session. The web app's `AuthActions` stays in the app because it is a Server Component over the session.

## Scripts

`lint`, `check-types`, `test`, and `test:coverage`. `AuthButtons` has a story, run through the Storybook app and its accessibility checks.
