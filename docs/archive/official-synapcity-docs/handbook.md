# Engineering Handbook

This handbook defines working conventions for Synapcity.

---

## Documentation Rules

Every major system should document:

- purpose
- ownership
- public API
- dependencies
- state boundaries
- persistence behavior
- open questions

Every major architectural decision should have an ADR.

---

## Code Organization Rules

- Keep routes thin.
- Keep features behind public APIs.
- Keep shared packages independent from app internals.
- Prefer registries for extensible systems.
- Prefer semantic design tokens over hardcoded color logic.
- Prefer explicit relationships over hidden coupling.

---

## Component Rules

Components should include:

- loading state
- empty state
- error state
- keyboard behavior
- responsive behavior
- accessible labels where needed

---

## State Rules

- Local state stays local.
- Shared UI state can use focused Zustand stores.
- Editor state stays inside editor systems.
- Persisted data goes through services/repositories.
- Route-scoped state needs cleanup.

---

## Pull Request Checklist

- [ ] Does this preserve feature boundaries?
- [ ] Does this introduce a new dependency direction?
- [ ] Is ownership of data clear?
- [ ] Are relationships explicit where needed?
- [ ] Are theme tokens used semantically?
- [ ] Are loading/empty/error states handled?
- [ ] Are keyboard/focus states preserved?
- [ ] Does documentation need an update?
- [ ] Does this need an ADR?

---

## Design Philosophy

Synapcity should feel like a calm document-and-dashboard composition system, not a generic SaaS dashboard.

Default visual qualities:

- neutral-first
- editorial
- structured
- quiet chrome
- precise metadata
- restrained accents
- clear hierarchy
