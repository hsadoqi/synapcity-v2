# Architecture Decision Records

**Status:** Canonical ADR index and template

An ADR records one consequential, durable architecture decision: its context, what was decided, what was explicitly not decided, who governs it, what integration/verification is expected, and what would justify revisiting it. ADRs are how a founder-confirmed *technical direction* becomes a scoped, governed decision rather than an ambient assumption.

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

## Index

| ADR | Title | Status | Summary |
| --- | --- | --- | --- |
| [0001](0001-lexical-for-documents.md) | Lexical for Documents | Accepted | Lexical is the founder-confirmed editor direction for the general-purpose Document capability. Schema, envelope, node set, and collaboration model remain unresolved. |
| [0002](0002-react-grid-layout-for-dashboards.md) | React Grid Layout for Dashboards | Accepted | React Grid Layout is the founder-confirmed layout substrate for Dashboard spatial composition. Persistence, accessibility, and widget architecture remain unresolved. |
| [0003](0003-repository-topology.md) | Repository topology and runtime pins | Accepted | Pins pnpm 10.24.0 and Node 24.20.0 and a single private root package. Amended by ADR-0007: the workspace file now exists, and package scope and layout are decided in ADR-0005 and ADR-0007. |
| [0004](0004-toolchain-baseline.md) | Toolchain baseline | Accepted | TypeScript, ESLint with Prettier, Vitest, and Knip form the Phase 1 baseline behind root `pnpm verify`; later ADRs add boundaries, Turborepo, Storybook, Playwright, and the UI/build surfaces without changing the accepted root tool versions. |
| [0005](0005-package-categories-and-dependency-direction.md) | Package categories and dependency direction | Accepted | Four category folders (dev, shared, domain, ui), dependency direction, and the exports-only public-API rule. Twelve dependency-cruiser rules now run over real Phase 2 modules; `dev` was renamed from `foundation`. Some semantic/checklist constraints remain review-enforced. |
| [0006](0006-ci-and-quality-gates.md) | CI and quality gates | Accepted | GitHub Actions runs the canonical `pnpm verify` plus dependency-audit and secret scans, with explicit browser bootstrap, a pre-push hook, squash-only merges, subject-only commits, and a PR template. Branch protection remains unavailable; later ADRs add accessibility/browser gates. |
| [0007](0007-workspace-conventions-and-testing-strategy.md) | Workspace conventions and testing strategy | Accepted | Defines workspace naming/layout, ownership-sensitive runtime rules, and testing strategy. Later ADRs establish Next.js, `@synapcity/frontend-uiontend-ui-core`, Storybook, real builds, axe/browser accessibility evidence, and the application smoke test; incompatible JSX lint remains deferred. |
| [0008](0008-pr-hygiene-checks-and-boundary-rules.md) | PR hygiene checks and additional boundary rules | Accepted | A CI job enforces the PR title format and rejects closing keywords near issue references, plus three boundary rules (`dev` not imported, no framework bindings in domain, no application-runtime coupling in ui). |
| [0009](0009-agent-operational-layer.md) | Agent operational layer | Accepted | A tool-neutral `.agents/` directory with the lifecycle, a task scope template, and eight workflows, plus an executable docs-consistency check in `pnpm verify`. |
| [0010](0010-application-runtime.md) | Application runtime | Accepted | Next.js 16.3.x App Router, React 19.3.x, server-by-default with narrow client boundaries. |
| [0011](0011-ui-and-styling-foundation.md) | UI and styling foundation | Accepted | `@synapcity/frontend-uiontend-ui-core`, Tailwind v4 CSS-first, shadcn CLI as source acquisition, and the current `@base-ui/react` GA package as primitive base. |
| [0012](0012-storybook-surface.md) | Storybook surface | Accepted | `apps/storybook` on Storybook 10.6.x with the Vite/Next integration and `addon-a11y`. Storybook browser-test (`addon-vitest`) runs on an isolated Vitest `^4.1.11` scoped to `apps/storybook` only, since its peer range excludes the repository's accepted root Vitest 5 (ADR-0004, unchanged). Amended by ADR-0015. |
| [0013](0013-task-orchestration-and-verification.md) | Task orchestration and verification | Accepted | Turborepo 2.x under `pnpm verify`; every required unit/component/browser/smoke/boundary/build layer must produce non-zero evidence, with explicit browser bootstrap on fresh checkouts and CI. |
| [0014](0014-deployment-topology.md) | Deployment topology | Accepted | GitHub Actions owns correctness, two Vercel projects (web, Storybook) own deployability; external-state creation still needs its own separate authorization. |
| [0015](0015-storybook-vitest-baseline.md) | Storybook runs on the shared Vitest baseline | Accepted | Amends ADR-0012: `apps/storybook` moves from its isolated Vitest 4.1.11 to Vitest 5.0.2, the version the rest of the repository resolves, now that `@storybook/addon-vitest@10.6.1` supports it. The Storybook Vitest configuration stays in its own file. |
| [0016](0016-theme-shape-and-functionality.md) | Theme shape and functionality | Proposed | Three theme editor sections (Colors, Typography, Display), their controls and value ranges, and per-concern state ownership. Persistence, scoped overrides, font list, and naming remain unresolved. |

## Candidate ADRs — proposed/unresolved only

The items below are candidates for a future ADR. Nothing yet authorizes a decision for any of them, and none should be resolved by writing an ADR body ahead of that decision.

| Candidate | Current status | Why no ADR body exists yet |
| --- | --- | --- |
| Contextual working environment naming and implementation (Space/Workspace/Hub) | Concept adopted (`PRODUCT.md`); naming unresolved (`docs/glossary.md`) | No implementation model exists to record |
| Canonical identity / shared-identity abstraction | Principle-level adoption only (`docs/architecture/principles.md` §2) | No mechanism decided |
| Internal Document addressability and anchor stability | Unresolved | Intentionally left open; no anchor algorithm exists |
| Relationship taxonomy / `EntityRef` / `synapcity://` scheme | Unresolved | No implementation evidence anywhere; conviction without a demonstrated mechanism |
| Widget lifecycle and source/input model | Unresolved; `Data Source` is an explicitly unresolved hypothesis (`docs/glossary.md`) | No implementation exists yet |
| Application-level utility panel architecture ("Global Panel") | Concept adopted (`PRODUCT.md`); package/registry design not decided | No architecture decided yet |
| History, version, and restoration architecture | Concern adopted (`PRODUCT.md`); mechanism unresolved | Adopts the concern, not a mechanism |
| Theme/customization package topology | Requirement adopted; exact topology adaptable, not yet decided | See `docs/architecture/principles.md` §6 |
| Previous-implementation adoption policy (general) | Governed by `docs/engineering/preservation-policy.md` | Individual adoptions still need their own ADR |
| Storage/API/routing/state-management architecture | Explicitly out of scope until real requirements exist | Stop condition per `AGENTS.md` |
