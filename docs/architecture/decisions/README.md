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

**Lineage.** The ADRs in `docs/archive/architecture/decisions/` (0001-0016) belong to the previous implementation. They are evidence under `docs/engineering/preservation-policy.md`, not authority, and several describe workspaces that do not exist here (`apps/storybook`, `packages/ui/core`). This index restarted at 0001 for the current repository. When a current ADR needs an archived decision, it restates the decision it adopts rather than citing the archived number.

## Candidate decisions

Not decided. Each needs an ADR, and the owner's approval, before it is treated as settled.

- **Testing strategy.** Partly addressed by Proposed [ADR-0005](0005-testing-foundation.md): shared Vitest and Playwright config packages and a few smoke tests. The tests now run in `pnpm verify` and CI, pending the owner's approval of that chain change. Still open: coverage thresholds, accessibility gating, browser matrix, and how much of the code the tests must reach (coverage is thin today).
- **Dependency direction between package categories**, and any tool that enforces it.
- **Component catalogue** (Storybook or another).
- **Theme editor and preference persistence** (what writes `--font-preference-*` and the other overrides). Preference storage is decided by [ADR-0010](0010-preference-persistence.md); the theme editor is still open.
- **Persistence, API, routing and state management.** Open per `PRODUCT.md`; the README's technology table is direction, not decision. Authentication is decided separately by [ADR-0006](0006-authentication-with-supabase.md) (Supabase Auth, for identity only). [ADR-0012](0012-owned-space-records.md) adopts only owned Space records and an unapplied migration draft; content relationships and other persistence/API decisions remain open.
- **Deployment topology.** Includes the production domain, which does not exist yet. Until it does, `metadataBase` is unset in `apps/web/src/app/layout.tsx` and the build warns that social image URLs resolve to `http://localhost:3000`. Set `metadataBase` once the domain is chosen.
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
