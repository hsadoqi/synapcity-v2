# Forms package extraction plan

> **Status: draft, scheduled after M5 and before M6, not yet approved for execution.** [ADR-0015](../../architecture/decisions/0015-forms-package-and-form-state.md) is accepted and fixes the name and slot. It still needs a task scope and the owner's go-ahead to start. Nothing here has been implemented. Steps use checkbox syntax so a later run can track them.

**Goal:** Move the form interaction foundations out of `apps/web` into one frontend package with no behavior change, then adopt React Hook Form behind that package with a single pilot form.

**Package:** `frontend-forms` at `packages/frontend/forms` (name confirmed by the owner, 2026-10-24).

**Slot:** after M5 and before M6 (owner decision, 2026-10-24). Settings (M6) is the first draft-heavy consumer and Auth (M7) is the largest existing one.

## Global constraints

- A package is created by the change that first moves code into it, never as an empty skeleton (workspace conventions).
- Two separate changes. Part A moves code and changes no behavior. Part B adds the dependency and the pilot. Part A merges before Part B starts.
- No change to messages, ARIA wiring, focus behavior, redirects or action results in Part A.
- Versions of `react-hook-form` and `@hookform/resolvers` are re-read from the registry in Part B and pinned exactly then. Nothing about their API is assumed in this plan.
- Existing tests keep their assertions on observable results. A test may change its import path or mocks, or gain cases.
- Version-sensitive work follows `AGENTS.md` §7a: repository-declared versions first, then current upstream documentation for those versions, then the accepted ADRs.

## Preconditions

- [x] Owner accepts ADR-0015 (2026-10-24).
- [x] Package name confirmed by the owner (2026-10-24).
- [x] Milestone slot chosen: after M5, before M6 (2026-10-24).
- [ ] Storybook discovery of stories in new packages is settled (decisions index, expected by M5). If it is not, the package ships with unit tests and its stories wait.
- [ ] Task scope written for the extraction, naming exact creates and updates.

## Part A: Extraction, no behavior change

### Task A1: Inventory and characterization

- [ ] List every importer of `@/components/forms/*` and `@/hooks/use-focus-first-error`. At the time of writing: `form-field` and `form-message` and `form-feedback` are imported by 15 components (auth, account, `components/account/delete-account-card.tsx`) and referenced by `apps/web/src/architecture.test.ts`.
- [ ] Confirm each of the three form units and the hook has tests that pin observable behavior: label and id wiring, hint versus message precedence, `aria-invalid`, `aria-describedby`, password reveal, focus target order (empty marked field, first marked field, form alert). Add missing cases before moving anything.
- [ ] Decide whether `form-field` is absorbed by the existing `field` component in `frontend-ui` or composes it. Record the answer in the task scope. Do not build a second implementation beside `field`.

### Task A2: Create the package with its first code

- [ ] Create `packages/frontend/forms` following the M3 conventions (manifest, `exports`, tsconfig, eslint config, README, per-unit folders with `index.ts`).
- [ ] Move `form-field`, `form-message`, `form-feedback` and `use-focus-first-error` with their tests, history preserved where git allows.
- [ ] Declare dependencies on `frontend-ui` and the minimum React peer. No new third-party dependency in Part A.
- [ ] Register the package where the inventory, the boundary checker, Knip, Turbo and Vitest projects need it, following how M4 added its packages.

### Task A3: Rewire consumers

- [ ] Point the 15 components and the architecture test at the package entries. Delete the app-local copies. Leave no re-export shim.
- [ ] Update the ownership map and the package inventory rows for the forms units in the same change.

### Task A4: Verify

- [ ] `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm deps`, `pnpm boundaries`, `pnpm test`, `pnpm test:coverage`, `pnpm test:e2e`, `pnpm test:storybook`, `pnpm build`, or `pnpm verify` for the chain.
- [ ] Manual check of one auth form and one account form: keyboard order, focus after a failed submit, screen-reader announcement of the message.
- [ ] Report what ran, what did not and what the tests do not cover.

## Part B: React Hook Form behind the package

### Task B1: Verify before adding

- [ ] Re-read the registry for `react-hook-form` and `@hookform/resolvers`; read each version's documentation for Zod 4 resolver usage, controlled versus uncontrolled inputs, and form-level errors.
- [ ] Verify an approach for React 19 `useActionState` and Next.js 16 server actions with React Hook Form. Mark anything not verifiable as NOT VERIFIABLE.
- [ ] Resolve the progressive-enhancement question from ADR-0015 against a concrete pilot.
- [ ] Owner approves the exact versions and the dependency addition.

### Task B2: Binding and pilot

- [ ] Add the dependencies to the forms package only. Pin exact versions. Confirm no peer-dependency warning is silenced.
- [ ] Add the binding (schema in, field and form state out, server result mapped to errors). Name it when this task is written.
- [ ] Migrate one pilot form. Forgot-password is the smallest consumer; the owner may choose another. Keep user-visible behavior identical.
- [ ] Tests: validation, server-error mapping, first-error focus, pending state. Story with axe checks. Manual keyboard and screen-reader check.
- [ ] Add a boundary rule that only the forms package imports `react-hook-form`, or record why review is enough.

### Task B3: Hand off

- [ ] Record which features migrate in their own milestones (Settings M6, Auth and Account M7) and what they must not redo.

## Risks

- **Native submit versus client submit.** A React Hook Form flow can lose pre-hydration submit. This is the main design risk and is settled by the pilot, not assumed.
- **Double validation.** Client and server validation can drift. One shared domain schema is the mitigation; the mapper question in ADR-0015 covers server-side issues.
- **A thin package.** If Part A leaves only a few components, the boundary may not earn its keep. ADR-0015 lists folding back into `frontend-ui` as a reconsideration condition.
- **Resolver major version.** `@hookform/resolvers` 6.0.0 is a recent major; its behavior with Zod 4.6.7 is unverified here.

## Not in this plan

Server action result contracts, draft persistence, autosave, multi-step flows, file upload, and migrating Settings, Auth or Account forms. Those belong to their feature milestones.
