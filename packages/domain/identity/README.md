# @synapcity/domain-identity

Owns: portable identity contracts. The verified-identity result that server code receives from the identity boundary (Milestone 4); the name, avatar and profile schemas; the credential schemas (sign-in, sign-up, new password, email request, update password) with their refusal helpers; and the pure display-user rules (name check, initials, avatar URL, provider image, profile-confirmed, current-user mapping), all moved here in Milestone 7.1. An earlier note planned the credential schemas for a separate `domain-auth` package; whether they should move there is an open owner question recorded in the M7.1 plan.

Runtime: portable TypeScript. The only runtime dependency is `zod`, for the schemas. Category rules: [domain README](../README.md) and [ADR-0014](../../../docs/architecture/decisions/0014-multi-app-package-boundaries.md).

## Public interface

`@synapcity/domain-identity` (root entry):

| Export                                                                                                                                                                                                                                                    | Meaning                                                                                                                                                               |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VerifiedIdentity`                                                                                                                                                                                                                                        | `{ userId }`: the provider subject of the verified caller                                                                                                             |
| `IdentityResult`                                                                                                                                                                                                                                          | `verified` with an identity, `signed-out`, or `unavailable` (provider unreachable)                                                                                    |
| `nameSchema`, `MAX_NAME_LENGTH`, `NameInput`                                                                                                                                                                                                              | The display name: trimmed, 1 to 80 characters. 80 matches the `profiles_display_name_length` database check                                                           |
| `avatarFileSchema`, `AVATAR_FILE_TYPES`, `AVATAR_ACCEPT`, `MAX_AVATAR_BYTES`, `AvatarType`, `AvatarFileInput`                                                                                                                                             | A valid avatar file: PNG, JPEG or WebP, at most 2 MB. Matches the `avatars` bucket; change both together, and the Server Action body cap in `apps/web/next.config.ts` |
| `profileSchema`, `ProfileInput`                                                                                                                                                                                                                           | What the profile form submits: `{ name, avatar? }`                                                                                                                    |
| `signInSchema`, `signUpSchema`, `newPasswordSchema`, `emailRequestSchema`, `updatePasswordSchema`, `firstRefusal`, `everyRefusal`, `AuthFieldName`, password constants and messages                                                                       | The credential rules and the exact words the forms show; `firstRefusal`/`everyRefusal` turn a failed parse into a message and the fields it concerns                  |
| `checkName`, `initialsOf`, `isUploadedAvatar`, `providerImageFrom`, `PROFILE_CONFIRMED_KEY`, `NEW_ACCOUNT_DAYS`, `isProfileConfirmed`, `isNewAccount`, `needsProfileSetup`, `profileFromClaims`, `currentUserFromClaims`, `CurrentUser`, `DisplayProfile` | Pure display-user rules over claims and metadata; no browser, React or provider SDK                                                                                   |

The schemas are also available from `@synapcity/domain-identity/schemas` and the types from `@synapcity/domain-identity/types`.

## Rules

- A `VerifiedIdentity` comes only from a provider's verification of the session (see `@synapcity/server-auth`). Never build one from display data or from an ID a caller supplied.
- Development fixture identities are never represented here; fixture mode stays in the host app (ADR-0006, development amendment).
- Fields are added when a real consumer needs them.
- Name and avatar are display data. They are never used to authorize anything.
- The limits above mirror external systems (database check, storage bucket). If one changes, change the other.

## Scripts

`lint`, `check-types`, `test`, `test:coverage`. Tests sit beside the schemas and utilities (`*.test.ts`); `schemas/contract-messages.test.ts` pins the profile and avatar words and limits the web app asserted before they moved. The identity types are exercised by their consumers' type checks.
