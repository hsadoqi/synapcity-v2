# Auth UI: header status, user menu, sign-in/up and sign-out

Status: Draft, awaiting review. Date: 2026-10-13. Branch: `fix/auth-ui`.

## Goal

Make the signed-in or signed-out state visible and actionable across the web app:

- Signed out: Sign in and Sign up controls, in a compact header form and a larger call-to-action form on the root page (`/`).
- Signed in: an avatar button in the header that opens a user menu (name, email, Sign out).
- One sign-out component, used everywhere, that always reflects the current session.

## Scope and non-goals

UI only. No changes to Supabase configuration, schema, route policy (`route-access.ts`), the existing auth server actions, or dependencies. No new architectural decision is made: auth architecture stays as in ADR-0006. Components use only existing tokens and installed shadcn parts (`Button`, `Avatar`, `DropdownMenu`, `LinkButton`); no hardcoded colours, bracket values or `style` props.

## Decision: server-resolved header slot

The shared UI package cannot import Supabase or app code. `RootHeader` therefore exposes a slot, and `apps/web` fills it with the result of a server-side session check.

Rejected alternative: a client hook subscribing to `onAuthStateChange`. It keeps pages cacheable but flashes the signed-out state on load and fetches claims in the browser. Accepted trade-off of the chosen option: reading cookies in the root layout makes every page dynamic.

Why this reflects current status without client state: `signInWithPassword`, `signUp` (when a session exists), `updatePassword` and `signOut` already call `revalidatePath('/', 'layout')`. OAuth sign-in completes in `/auth/callback`, which must be checked to confirm the layout re-renders afterwards (see Risks).

## Components

### `packages/frontend/ui`

| Piece         | Behaviour                                                                                                                                                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `RootHeader`  | New optional `actions` prop, rendered beside `ModeToggle`.                                                                                                                                                                                             |
| `RootShell`   | New optional `headerActions` prop, passed to `RootHeader`.                                                                                                                                                                                             |
| `UserMenu`    | Presentational. Props: `name`, `email`, `imageUrl`, `children` (menu items). Avatar button trigger opens a `DropdownMenu` with a label (name and email) and the children. `initialsOf` moves here from `apps/web`. The trigger has an accessible name. |
| `AuthButtons` | Props: `variant: 'header' \| 'hero'`. Renders `LinkButton`s to `/auth/login` (Sign in) and `/auth/register` (Sign up). Header is compact (ghost and default); hero is larger.                                                                          |

### `apps/web`

| Piece                           | Behaviour                                                                                                                                                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AuthStatus` (server component) | Reads `getClaims()`. Signed in: `UserMenu` (name from `full_name` or `name`, email, `avatar_url`) with `SignOutButton`. Signed out: `AuthButtons`. Takes a `variant` prop. In the hero variant, signed-in shows a "Go to home" link. |
| `SignOutButton`                 | `<form action={signOut}>` with a pending state via `useFormStatus`. The only sign-out path.                                                                                                                                          |

## Wiring and cleanup

- `app/layout.tsx`: pass `<AuthStatus variant="header" />` to `RootShell` as `headerActions`.
- `app/page.tsx`: replace the "Get Started" stub with `<AuthStatus variant="hero" />`.
- `app/home/page.tsx`: use `SignOutButton` instead of the inline form.
- Delete `components/auth/logout-button.tsx` and remove the `logout` type from `AuthLinkButton` (client-side sign-out and a link to a nonexistent `/auth/logout`).
- `CurrentUserAvatar` and `useCurrentUserProfile` are left in place (still used on `/home`); revisit separately.

## Data flow

Request, then proxy refreshes the session, then the root layout runs `AuthStatus`, which calls `getClaims()` (verified JWT claims, per ADR-0006), then renders the signed-in or signed-out UI. Claims are used for display only; protected routes still authorize on their own.

## Testing and verification

- Storybook stories (with a11y checks): `UserMenu`, `AuthButtons` (header and hero), `RootHeader` with a filled slot.
- Unit test for `initialsOf`.
- Run `pnpm format:check`, `lint`, `typecheck`, `deps`, `test`, `test:storybook`, `build` and report exactly what ran.
- Not verifiable without Supabase env: the live sign-in, sign-out and header-update flow. This will be reported as not verified, or checked manually if env is available.

## Risks and open items

- OAuth callback: confirm `/auth/callback` leads to a fresh render of the layout so the header updates.
- Every route becoming dynamic: accepted trade-off.
- `AuthLinkButton` and `LogoutButton` removal must not break existing imports (check with typecheck and `deps`).
