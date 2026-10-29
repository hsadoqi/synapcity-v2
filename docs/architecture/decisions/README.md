# Architecture Decision Records

**Status:** Canonical ADR index and template

An ADR records one consequential, durable architecture decision: its context, what was decided, what was explicitly not decided, who governs it, what integration/verification is expected, and what would justify revisiting it. ADRs are how a founder-confirmed _technical direction_ becomes a scoped, governed decision rather than an ambient assumption.

An ADR is not required for every implementation choice. It is required before:

- adopting a consequential piece of architecture, behavior, or code from the previous implementation (see `docs/engineering/preservation-policy.md`);
- committing to a technology, schema, or persistence model that would be costly to reverse;
- resolving an item this index's candidate list, `PRODUCT.md`, or `docs/glossary.md` currently marks UNRESOLVED, where the resolution has architectural consequences.

## Numbering and status

ADRs are numbered sequentially (`0001-*.md`, `0002-*.md`, ...) and never renumbered or deleted. An ADR's status is one of:

- **Proposed** — drafted, not yet approved.
- **Accepted** — approved and currently governing.
- **Superseded by ADR-NNNN** — replaced; the old ADR remains readable for lineage.
- **Rejected** — considered and declined; kept for lineage, not deleted.

## Index

| ADR                                                   | Title                                                        | Status   |
| ----------------------------------------------------- | ------------------------------------------------------------ | -------- |
| [0001](0001-workspace-topology-and-toolchain.md)      | Workspace topology and toolchain                             | Accepted |
| [0002](0002-styling-foundation.md)                    | Styling foundation (Tailwind v4, shared tokens, shadcn)      | Accepted |
| [0003](0003-typography-roles-and-font-preferences.md) | Typography roles and font preferences                        | Accepted |
| [0004](0004-class-merging-with-cn.md)                 | Class merging with the `cn` package                          | Accepted |
| [0005](0005-testing-foundation.md)                    | Testing foundation (Vitest and Playwright config packages)   | Proposed |
| [0006](0006-authentication-with-supabase.md)          | Authentication with Supabase Auth                            | Accepted |
| [0007](0007-app-local-auth-and-account-ownership.md)  | Auth responsibility boundaries and package layout evaluation | Accepted |
| [0008](0008-auth-actions-and-server-operations.md)    | Auth actions and server operations                           | Accepted |
| [0009](0009-caller-owned-auth-navigation.md)          | Caller-owned auth navigation                                 | Accepted |
| [0010](0010-preference-persistence.md)                | Preference persistence (account and device preferences)      | Accepted |
| [0011](0011-collection-browse-feature.md)             | Collection, an app-local feature for browse mechanics        | Accepted |
| [0011](0011-resizable-global-panel-shell.md)          | Resizable global panel in the authenticated shell            | Accepted |
| [0012](0012-owned-space-records.md)                   | Owned Space records and serializable icon identifiers        | Accepted |
| [0013](0013-document-and-dashboard-persistence.md)    | Document and dashboard persistence boundary                  | Accepted |
| [0014](0014-multi-app-package-boundaries.md)          | Multi-app package boundaries and staged reorganization       | Accepted |
| [0015](0015-forms-package-and-form-state.md)          | Forms package and form state (React Hook Form)               | Accepted |
| [0016](0016-dashboard-composition-storage.md)         | Dashboard composition storage                                | Accepted |
| [0017](0017-breadcrumb-trail-ownership.md)            | Breadcrumb trail ownership and composition                   | Proposed |

**Lineage.** The ADRs in `docs/archive/architecture/decisions/` (0001-0016) belong to the previous implementation. They are evidence under `docs/engineering/preservation-policy.md`, not authority, and their package layout must not be assumed to describe this repository (`packages/ui/core`, for example). This index restarted at 0001 for the current repository. When a current ADR needs an archived decision, it restates the decision it adopts rather than citing the archived number.

ADR-0014 amends placement statements in earlier accepted records without replacing their behavior or security decisions. Both pre-existing ADR-0011 filenames remain intact and must be cited by full filename. Category labels and migration handles do not finalize product terminology.

## Candidate decisions

Not decided. Each needs an ADR, and the owner's approval, before it is treated as settled.

- **Testing strategy.** Partly addressed by Proposed [ADR-0005](0005-testing-foundation.md): shared Vitest and Playwright config packages and a few smoke tests. The tests now run in `pnpm verify` and CI, pending the owner's approval of that chain change. Still open: coverage thresholds, accessibility gating, browser matrix, and how much of the code the tests must reach (coverage is thin today).
- **Boundary enforcement implementation.** Category ownership, runtime dependency direction, grouping principles, and migration rules are accepted in [ADR-0014](0014-multi-app-package-boundaries.md). The mechanism is selected (owner decision, 2026-10-23): a custom checker on `oxc-parser` and `oxc-resolver` in `dev-boundaries`, run as `pnpm boundaries` inside `pnpm verify` ([3.4 design](../../superpowers/specs/2026-10-23-m3-boundary-enforcement-design.md)). It is implemented and runs in `pnpm verify`, with each rule proven by a failing probe; 16 pre-existing violations (Next.js imports in shared UI and barrel-induced module cycles) are named exceptions with removal milestones. The web lexical import test remains for the web app's internal feature layering until those features migrate. Milestone 3 (conventions 3.1–3.3, enforcement 3.4, integration 3.5) is complete as of 2026-10-23, apart from the two 3.5 items below that wait for their first consumer.
- **Boundary enforcement: items carried out of Milestone 3.** Owner decision 2026-10-23 ("go with all ur recommendations"):
  1. _R11 for feature frontend graphs:_ decided and implemented. A feature keeps Next.js imports under `src/frontend/next/`.
  2. _Frontend-to-domain condition:_ decided and implemented. Frontend imports a domain package only through its root, `./contracts` or `./rules` (R2). Whether such an entry holds only pure rules remains a review judgement. The sibling-feature condition is covered by R5 and R9.
  3. _Vitest `react-server` condition and Storybook discovery of stories in new packages:_ the server-entry half is settled in M4 (2026-10-23). Tests map only the `server-only` specifier to an empty module (`@synapcity/dev-vitest-config/server-only`) instead of setting the `react-server` condition, which would also give `react` its server build; `server-only@0.0.1`'s exports were read from the registry tarball. Storybook discovery is settled in M5.3 (2026-10-24): `apps/storybook/.storybook/main.ts` lists each package's stories by a glob relative to the config directory, `'../../../packages/frontend/collection/src/**/*.stories.@(ts|tsx)'` beside the existing three, and the Vitest addon runs them with the a11y checks. The glob form was checked against the Storybook 10 documentation; the 10.6.3 documentation itself was not reachable, and the new stories are discovered and pass on 10.6.3.
  4. _Approvals given on one-word replies_ (the ADR-0014 frontend-to-domain widening, the base record contract, the glossary amendment, `server-only` 0.0.1): ratified by the owner.

- **Forms package: open questions.** Decided by [ADR-0015](0015-forms-package-and-form-state.md) (`frontend-forms`, React Hook Form, slot after M5 and before M6). Progressive enhancement and exact versions are settled (see the ADR's implementation notes). Server errors are shown as the actions return them. Still open: copying them into React Hook Form's error store (no current form needs it), and migrating the six other forms (forgot password and register use the binding). Extraction plan: [forms package extraction](../../superpowers/plans/2026-10-24-forms-package-extraction.md).
- **Component catalogue governance.** `apps/storybook` exists and exercises stories. Its presence does not resolve the wider catalogue ownership, publishing, and acceptance policy.
- **Theme editor and preference persistence** (what writes `--font-preference-*` and the other overrides). Preference storage is decided by [ADR-0010](0010-preference-persistence.md); the theme editor is still open.
- **Persistence, API, routing and state management.** Open per `PRODUCT.md`; the README's technology table is direction, not decision. Authentication is decided separately by [ADR-0006](0006-authentication-with-supabase.md) (Supabase Auth, for identity only). [ADR-0012](0012-owned-space-records.md) adopts owned Space records; [ADR-0013](0013-document-and-dashboard-persistence.md) adopts document/dashboard persistence and contextual participation within its scope. Preference persistence is scoped by ADR-0010. Hosted migration state must be checked separately; broader persistence/API decisions remain open.
- **Deployment topology.** Includes the production domain, which does not exist yet. Until it does, `apps/web` takes `metadataBase` from each environment's `SITE_URL` (`docs/engineering/setup.md`), and `apps/docs` sets none: on Vercel, Next resolves social image URLs to the deployment's own address, and elsewhere it falls back to `http://localhost:<port>` and warns. Revisit both once the domain is chosen.
- **Documentation site content and tooling** for `apps/docs`.
- **Notifications delivery.** Storage, live updates, email provider, consent, push delivery and scheduling. Recommendations are in [the notifications spec](../../superpowers/specs/2026-10-17-notifications-design.md) (D0 to D6); none is decided.

## Template

```markdown
# ADR-NNNN: <short title>

**Status:** Proposed | Accepted | Superseded by ADR-NNNN | Rejected
**Date:**
**Deciders:**

## Context

What situation, evidence, and constraints led to this decision. Cite the prior decision, product document, or governance rule this ADR resolves — self-contained, without requiring a reader to open Phase 0 discovery material or the previous implementation.

## Decision

What was decided, stated as narrowly as the decision actually is.

## Scope

What this decision governs. Be explicit about the boundary — a technology direction is not the same decision as a schema, a package topology, or a persistence model.

## What this does NOT decide

Explicitly list adjacent questions this ADR leaves open, so a reader does not assume more was decided than was.

## Unresolved

Open questions inside this ADR's own scope that remain deliberately unresolved.

## Governance boundary

Who owns changes to this decision going forward, and what approval is required to change it.

## Integration expectations

How this decision is expected to integrate with the rest of the system — dependencies, boundaries it must respect, packages/layers it may touch.

## Verification expectations

What must be true, and how it will be checked, before this decision is considered correctly implemented (tests, accessibility checks, manual verification, etc.). See `docs/engineering/definition-of-done.md`.

## Reconsideration conditions

What evidence or change in circumstances would justify revisiting this decision.
```
