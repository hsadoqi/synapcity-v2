# Architecture principles

Package topology and responsibility boundaries are now selected separately in [ADR-0014](decisions/0014-multi-app-package-boundaries.md). The scope statement below describes what this principles document itself selects, not an assertion that topology remains undecided throughout the repository.

**Status:** Canonical architecture principles
**Scope:** Principles only. No package topology, database, API, routing, or state-management technology is selected here. See `PRODUCT.md`'s "Open product decisions", `docs/glossary.md`, and `docs/architecture/decisions/README.md`'s candidate list for what remains open, and `docs/architecture/decisions/README.md` for the ADR process that resolves consequential choices one at a time.

These principles are drawn from direct experience with the previous implementation and from the governing rule that concept adoption never implies implementation adoption. They do not invent new architecture beyond what that experience supports.

## 1. Explicit ownership

Every durable concern — a piece of canonical information, a persisted preference, a compiled artifact, a UI state slice — must have an identifiable, stated authority. "Who owns this" must be answerable without inspecting which component happens to render it first.

## 2. No silent second owner

A representation (a Dashboard, a Widget, a contextual surface, a live embed) may legitimately own its own presentation configuration — layout, placement, filters, local view state. It must never silently acquire a divergent copy of information that is canonically owned elsewhere. This is the architectural expression of the product principle "representations do not silently become second owners" (`docs/product/principles.md` #8).

## 3. UI hierarchy is not domain ownership

Route nesting, layout containment, component composition, and navigation grouping are interaction-structure decisions. None of them, by themselves, establishes canonical ownership, lifecycle authority, or domain identity. Do not infer that a resource is "owned by" whatever route or component currently contains it. Route restructuring is not itself evidence that ownership was decided either way.

## 4. Creation context is not permanent ownership

Creating information within a context may supply useful defaults (organization, presentation, initial configuration). It must not permanently bind that information to the context that happened to be active at creation time. Removing information from a context is a different operation from deleting the canonical information itself.

## 5. Initial authority is not the same question as durability authority

A single flag or boolean must never collapse the following into one decision:

- **initial source of truth** — which value is authoritative when the system first loads;
- **hydration/reconciliation precedence** — how a freshly loaded value is reconciled against a previously stored one;
- **post-hydration write authority** — who may change the value once the system is running, and where that change goes;
- **durable destination** — where the current value is actually persisted;
- **migration** — how a persisted shape evolves across versions;
- **validation** — where malformed persisted data is caught and repaired;
- **failure-recovery behavior** — what happens, and what the user sees, when persistence or validation fails;
- **scope and lifetime** — how long a value should live and at what granularity (global, per-context, per-session, per-device).

A single boolean collapsing "which value wins on load" and "does a later user change survive a reload" into one flag is a real, previously-observed failure mode, not a hypothetical one. This is preserved as a cautionary architecture lesson, not a pattern to imitate. Any future persistence design must state each of the bullets above separately and explicitly.

## 6. Responsibility boundaries before package boundaries

Separate concerns by what actually differs in change rate, testability, and coupling — not by a pre-drawn package diagram:

- **pure semantics** — validation, transformation, and domain logic with no framework or browser dependency;
- **stateful runtime/orchestration** — state machines, hooks, providers, lifecycle coordination;
- **presentation** — components, layout, interaction, accessibility;
- **framework/platform adapters** — DOM, cookies, `matchMedia`, Next.js request APIs, concrete storage;
- **external effects** — network calls, third-party services, side effects with consequences outside the process;
- **application composition** — the composition root that wires concrete providers and adapters together.

This is a responsibility model, not a mandate for five packages, five directories, or one package per capability. A small module that never needs independent testing or reuse does not need its own package. Package count and boundaries should follow demonstrated dependency and change boundaries, evaluated case by case — including for the theme/panel-style domain→runtime→ui→adapter split, which is a reusable pattern (ADAPT), not a rule that every future core/strategic module must reproduce package-for-package.

## 7. Structural ownership before retry machinery

When a lifecycle race condition appears — a component querying for a DOM node, a store, or a resource that may not exist yet — first ask whether the component should own the resource it needs to coordinate with, rather than reaching for polling, `setTimeout`, `MutationObserver`, or other retry machinery. Changing ownership can eliminate an entire failure class; retry logic usually only papers over it. In practice, giving a component ownership of the resource it needs to coordinate with has eliminated races that polling/observer machinery had been added to paper over. This is a review heuristic, not a universal prohibition on asynchronous coordination; some races are genuinely unavoidable and need real async handling.

## 8. Preserve uncertainty

An architecture document must not resolve a question the founder or a canonical product document has left open, merely because resolving it would make the document feel more complete. If a decision is unresolved, architecture documents should say so explicitly and point to where it will eventually be decided (an ADR, a later decision process, a product-owner decision), rather than picking a default silently through package structure, a schema, or a route.

## 9. Experimental evidence is evaluated, not inherited

The previous implementation is real, exercised evidence about what was tried, what worked, what broke, and why — not a conformance reference and not something that migrates by default. Every adoption from it requires an explicit evaluation of the concept, the terminology, and the implementation independently (see `docs/engineering/preservation-policy.md`), and consequential adoption requires an ADR. "Implemented," "tested," "exercised in the application," "product-required," "product-validated," and "canonical" are six different claims; none of them substitutes for another (see `docs/engineering/documentation.md` and `docs/engineering/definition-of-done.md`).

## Applying these principles

- Before creating a new package, ask which responsibility (§6) actually needs to be isolated, and from what.
- Before persisting anything, write down each bullet in §5 separately.
- Before treating a route, folder, or component tree as evidence of ownership, re-read §3.
- Before adopting anything from the previous implementation, re-read §9 and `docs/engineering/preservation-policy.md`.
- When in doubt whether something is already decided, check `docs/architecture/decisions/README.md`'s candidate list and each accepted ADR's own scope first.
