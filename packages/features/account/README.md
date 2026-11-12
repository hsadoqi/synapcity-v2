# @synapcity/features-account

Owns: the account and profile experience: the name and photo forms, the profile summary and setup form, `ProfileAvatar` and the `ProfileState` contract. Plan: [M7.4](../../../docs/superpowers/plans/2026-10-25-m7-4-features-account.md). Canonical identity schemas belong to `@synapcity/domain-identity`; the profile operations belong to `@synapcity/server-account`.

## Public interface

- `@synapcity/features-account/contracts`: `ProfileState` (what every profile action returns; it echoes `firstName`, `lastName` and the display name `name`), `ProfileAction` (the shape of a save action) and `profileNamesSchema` (what the setup step and the settings name form submit: a required first name, optional last and display names, built from `@synapcity/domain-identity`'s name rules).
- `@synapcity/features-account/frontend`: `NameForm` (first, last and display names), `NameField` (the optional display name), `PersonNameFields` (first and last name, inside a `ProfileFormShell`), `PersonNameInputs` (the same inputs for a form with its own state, such as registration), `AvatarForm`, `AvatarField`, `ProfileSummary`, `ProfileSetupForm`, `ProfileFormShell`, `useProfileForm` and `ProfileAvatar`. `ProfileFormShell` lives under `src/frontend/next/` because it reads the current path with `next/navigation` (rule R11).

The host supplies what a package cannot import: each form takes its save `action` (a Server Action in the web app), and each form that can show "Sign in again" takes `signInHref(returnTo)` so the sign-in route stays the app's (ADR-0009). This package does not import app code, define Server Actions, choose fixture mode or read the session.

## Scripts

`lint`, `check-types`, `test`, and `test:coverage`.
