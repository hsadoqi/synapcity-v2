# ADR-0015: Forms package and form state

**Status:** Accepted
**Date:** 2026-10-24 (drafted and accepted)
**Deciders:** Hanaa Sadoqi (repository owner), by direct approval on 2026-10-24 of: React Hook Form as the form-state library; the package name `frontend-forms`; the milestone slot after M5 and before M6; and this record as drafted.

## Context

The owner expects forms to be a large part of the product. Today the form layer is small and app-local:

- `apps/web/src/components/forms` held three units (they moved to [`packages/frontend/forms`](../../../packages/frontend/forms) in extraction Part A): `form-field` (label, input, hint, invalid wiring), `form-message` (form-level error or status) and `form-feedback` (`fieldErrorProps` and the `FieldFeedbackState` shape). `apps/web/src/hooks/use-focus-first-error` moves focus after a failed submit. About 280 lines in total; 15 components and one architecture test import the form units.
- Forms are native HTML forms with `noValidate`, submitted to server actions through React's `useActionState`. A failed action returns an `error` message and the `fields` it concerns; the form marks those fields invalid and focuses the first one.
- Validation is Zod 4 (`zod` 4.6.7 in `apps/web`, `frontend-ui` and `domain-identity`). Portable schemas such as `nameSchema` and `profileSchema` live in `domain-identity`.
- No form-state library is installed.

Existing placement rules point at the frontend category but not at a separate package:

- The [ownership map](../reorganization-ownership-map.md) sends generic fields, messages, feedback structure and first-error focus to frontend, and says no separate package is required per form or helper.
- The accepted [package inventory](../workspace-conventions.md#package-inventory) (Milestone 3.1) lists `frontend-ui` as owning "generic components and form pieces".
- [ADR-0014](0014-multi-app-package-boundaries.md) and the workspace conventions say planned consumers count toward a package's boundary and can justify early extraction.

Heavy form use is a planned consumer set: Settings (drafts, dirty guard, import), Auth and Account workflows, and later Document and Dashboard properties. That is the case ADR-0014 allows for.

**Registry evidence (npm registry, read 2026-10-24).** `react-hook-form` 7.91.0 (peer `react` includes 19); `@hookform/resolvers` 6.0.0 (peer `zod` includes `^4.0.0`); `@tanstack/react-form` 1.33.5 (peer `react` includes 19). The repository declares React 19.3.0, Next.js 16.4.3 and Zod 4.6.7. No peer conflict was found for any of the three. Whether `@tanstack/react-form` accepts a Zod schema without an adapter is NOT VERIFIED.

## Decision

1. **Form state: React Hook Form.** Client-side form state for new and migrated forms uses React Hook Form. TanStack Form was considered and is not selected.
2. **A dedicated frontend package for form interaction foundations.** Name `frontend-forms` (`@synapcity/frontend-forms`), location `packages/frontend/forms`, confirmed by the owner. It is a package handle, not a product term. It owns:
   - the form field, message and feedback pieces and first-error focus, moved from `apps/web`;
   - the React Hook Form binding: how a form is created from a schema, how submit and pending state are exposed, and how a server result becomes field and form-level errors;
   - dirty-state and unsaved-changes primitives that more than one feature needs.
3. **React Hook Form is imported only by the forms package.** Features and apps use the package's own hooks and components, so the library stays replaceable behind one boundary. Until `pnpm boundaries` has a rule for it, review enforces this.
4. **Validation stays in `domain`.** The forms package accepts a schema from the caller and owns no product schema. A Zod-issue-to-field-error mapper, if one is shared, goes in `domain` and not in the forms package, unless the first implementation shows it has no portable use.
5. **Product copy and workflows stay in features.** Messages, field choices, form composition and what happens after success belong to the feature that owns the workflow.
6. **Primitives stay in `frontend-ui`.** The forms package composes `input`, `label`, `select`, `switch`, `textarea` and `field`; it does not fork them. Whether `form-field` is absorbed by the existing `field` component is decided during extraction, not here.
7. **Extraction and library adoption are separate changes.** The move of the existing units, with no behavior change, comes first. Adding the dependency and migrating a pilot form comes second.

## Scope

Governs the placement of form interaction foundations, the form-state library, and the dependency direction around them. This amends the M3.1 inventory: form pieces move out of the `frontend-ui` row into a `frontend-forms` row, and the ownership map's forms row points at it. Both were updated with this acceptance.

## What this does NOT decide

- Server action transport, the shape of an action's result, or error codes. Those stay with the host and `server` packages, and any shared result type is a separate decision.
- Whether existing Auth and Account forms migrate to React Hook Form, and when. Each feature migrates in its own milestone and keeps working on `useActionState` until it does.
- Persistence of drafts, autosave, multi-step flows, or file-upload handling.
- Any change to Zod, to the Zod version, or to which schemas exist.
- Accessibility acceptance criteria beyond preserving current behavior. The extraction keeps today's ARIA wiring and focus behavior and does not redefine them.

## Unresolved

- **Server errors into form state.** Server errors are handled: eight existing forms (login, register, forgot password, update password, email change, delete account, name, avatar) show an action's `{ error, fields }` state, and `useActionForm` shows that same state as it is, so the shared field marking, message linking and focus keep working. What stays open is copying a server result into React Hook Form's own error store, which no current form needs because every server error targets one named field. Decide it against the first form that needs React Hook Form to own server errors (for example nested or array fields).
- **The other seven forms.** Only forgot password uses `useActionForm`. Register, update password and delete account have several fields, and the avatar form has a file input, which the binding does not validate (it reads string values only). Each is checked when it migrates; password reveal and focus order across fields are checked on the first multi-field one.
- **A newer `react-hook-form`.** 7.91.0 is the registry's latest but fails the repository's release-age policy until it is old enough; moving off the pinned 7.90.0 is a separate change.

## Implementation notes

Added 2026-10-24 after extraction Parts A and B. They record what was found; they do not change the decision above.

- **Progressive enhancement: resolved.** `useActionForm` keeps the form's `action` and `noValidate`, so the form works before hydration. Once hydrated, the submit handler validates the form's own `FormData` against the same schema the server action uses, shows a refusal at once in the server's shape, and otherwise calls the action unchanged. An end-to-end test with JavaScript off shows the native path still reaches the server action and gets the same refusal. React Hook Form's documented pattern (calling the action dispatcher inside `handleSubmit` on a form with no `action`) needs JavaScript and was not used.
- **React 19 resets a form after its action finishes and React Hook Form does not see that reset,** so values are synced from the form's data just before validating. React Hook Form's `reset()` also resets the DOM form and must not be used on such a form.
- **Versions.** `react-hook-form` 7.90.0 and `@hookform/resolvers` 6.0.0, pinned exactly in the forms package only. Their peer ranges cover React 19.3.0, Zod 4.6.7 and each other. `@hookform/resolvers` 6.0.0 was run against Zod 4.6.7: messages come through and `.trim()` applies to the parsed values.
- **Boundary.** Only `packages/frontend/forms` can resolve `react-hook-form`, because nothing is hoisted; no boundary rule was added.
- **Storybook discovery** of stories in new packages was settled in M5.3; the forms package lists its stories there.
- **Verification.** Unit and DOM tests, end-to-end tests with JavaScript on and off, and Storybook stories with the a11y addon's axe checks pass. The manual keyboard and screen-reader check of the pilot has not been done.

## Governance boundary

The repository owner approves a change to this ADR, a rename of the package, the dependency introduction, and any change to the dependency direction. Features may consume the package without further approval once it exists.

## Integration expectations

- `frontend-forms` depends on `frontend-ui` for primitives and may depend on `domain` packages only through the entries ADR-0014 permits for frontend. It depends on no `server` package and imports no Next.js module outside an explicit framework adapter entry.
- `features-*` and `apps/web` consume it. No `domain` or `server` package imports it.
- It receives schemas, messages and handlers from callers. It does not read product copy or call server actions itself.

## Verification expectations

- Extraction: the existing unit tests move unchanged and pass; the 15 consuming components and the architecture test pass; `pnpm verify` is green; user-visible behavior is identical.
- Library adoption: the pilot form has tests for validation, server-error mapping, first-error focus and pending state, and a Storybook story with the a11y addon's axe checks. Keyboard and screen-reader behavior is checked manually for the pilot.
- Report what the tests do not reach, as `docs/engineering/definition-of-done.md` requires.

## Reconsideration conditions

- The progressive-enhancement question cannot be answered without dropping native submit for forms that must work without JavaScript.
- A verified comparison shows `@tanstack/react-form` fits Server Actions and Zod 4 materially better.
- The package stays a thin wrapper around two or three components after the first two feature migrations, so a separate boundary is not earning its keep. Fold it back into `frontend-ui`.
- `react-hook-form` or `@hookform/resolvers` stops supporting the repository's React or Zod major.
