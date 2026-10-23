# ADR-004: Separate State by Responsibility

## Status

Accepted.

---

## Context

Synapcity V0 contains documents, a rich editor, dashboards, widgets, layout builders, context rails, command stubs, and theme editors.

These systems have different state lifecycles.

---

## Decision

Use focused Zustand stores for shared UI/application state, while keeping local state local, editor state inside the editor, generated theme variables in the theme runtime, and persisted data in services/repositories.

---

## Rationale

- Avoids one global store for unrelated concerns.
- Makes route-scoped cleanup clearer.
- Prevents editor state from flooding global state.
- Allows dashboard UI state to evolve independently from persisted layouts.
- Keeps theme records/assignments separate from generated runtime variables.
- Reduces accidental coupling.

---

## Tradeoffs

More stores means more naming and boundary decisions.

Selectors must be written carefully to avoid unstable references.

---

## Consequences

- Store names should describe ownership.
- Selectors must return stable values.
- Persistence should not be hidden inside random UI stores.
- Route sync should be explicit and reusable.
- Live document editor state should not be mirrored into Zustand on every keystroke.
