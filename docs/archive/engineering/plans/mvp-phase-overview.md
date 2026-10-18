# MVP phase overview

**Status:** Proposed. Candidate for owner review. Not canonical; nothing here authorizes implementation.

This is a high-level sequence of phases toward the MVP, written as phases with gates and exit evidence. It is not a feature plan: the first vertical slice is an open product decision (`PRODUCT.md` "Open product decisions", `docs/product/mvp.md`), so this document cannot list MVP features. Each phase is enhanced and broken down at its own start, after its entry gate is met.

## Direction

The owner's direction is frontend first. State and persistence are not handled now; they are sized later to the chosen slice rather than to a neutral probe. Phase numbers and task codes (`P3-01`, ...) below are proposed labels.

## Phases

| Phase                         | Goal                                                                                                                                                                                     | Entry gate                                                                                        | Exit evidence                                                                                                                                                                                   |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **3. Frontend foundation**    | `apps/web` and Storybook render one token system. A neutral application frame, core route states (loading, error, empty, not-found), and feedback elements (toast, alert, dialog) exist. | Owner approves this overview. Design-system review and reconciliation with ADR-0011 decided; this also resolves the token vocabulary (ADR-0011 "Unresolved").                   | `pnpm verify` green. Storybook accessibility tests cover the shell, feedback elements, and route states. Smoke test loads the shell. Manual light/dark check on both surfaces recorded.         |
| **4. Design system**          | Slice-independent primitives only: form/input, data display, feedback/overlay layer with a motion and reduced-motion standard, theming mechanics, Storybook docs, contrast tests.        | Phase 3 exit. Accent decision made. Package topology stays gated.                                 | Each primitive has a story, an accessibility test, and reduced-motion behavior. Contrast tests pass. The `docs/product/principles.md` §15 customization requirement has a stated mechanism. |
| **Gate G1: first slice**      | Owner selects the first vertical slice using the `docs/product/mvp.md` criteria and records a first-slice decision.                                                                      | None from engineering. Must not presume a repository topology.                                    | Accepted first-slice decision record. This is a product decision, not agent work.                                                                                                               |
| **5. Application foundation** | Persistence and state sized to the chosen slice.                                                                                                                                         | G1 accepted. Storage, API, routing, and state-management ADRs are proposed and approved after G1. | Defined by those ADRs at phase start.                                                                                                                                                           |
| **6. First vertical slice**   | The chosen slice end to end, with real persisted behavior.                                                                                                                               | Phase 5 exit.                                                                                     | Defined by the first-slice decision record.                                                                                                                                                     |

Phases 5 and 6 are intentionally thin. They cannot be enhanced until G1 selects the slice.

## Boundaries

- **Component layer:** already decided in ADR-0011. shadcn CLI is the source-acquisition mechanism and Base UI (`@base-ui/react`) is the primitive base; both land in `@synapcity/frontend-ui/core`. Phase 3 and 4 work follows this and does not reopen it.
- **Application frame:** placeholder regions plus provisional navigation, as described in the [Home and sidebar IA brief](phase-03-home-sidebar-ia-brief.md). Owner decision, 2026-10-05: this amends the earlier "neutral, no product navigation" boundary. The context switcher and the Home, Documents and Dashboards entries are provisional display copy and stay disabled until each has a model. Global Home's relationship to Dashboards, resumption and recency semantics, and the final name of contextual environments remain open decisions. Route segments in `apps/web` are placeholder scaffolds, not naming decisions; `docs/glossary.md` governs the labels.
- **"Protected" routes:** out of scope. Authentication is a non-goal and needs an identity model. At most a documented placeholder seam.
- **Lexical and React Grid Layout UI:** not before G1.
- **Dependencies:** any new dependency (for example a toast library) is verified per `AGENTS.md` §7a at the start of the phase that needs it. This overview selects none.

## Open decisions this overview does not resolve

- The token vocabulary and file names (ADR-0011 "Unresolved").
- The brand accent.
- The first vertical slice and product positioning.
- Any storage, API, routing, state-management, auth, or deployment architecture.
- Package topology changes.

## Prior Phase 3 plan set

The earlier Phase 3 plans (3A application foundation, 3B shell and UI) are on `feat/phase-03-architecture-ui-foundation` and are unchanged by this document. Their decisions are inputs to Phase 5, not commitments. Archiving them is a separate, separately approved change under `docs/engineering/preservation-policy.md`.
