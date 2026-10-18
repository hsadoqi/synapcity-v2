# Roadmap

This roadmap is an implementation sequence for the first rebuild of Synapcity.

The V0 goal is not to build the full future workspace/productivity platform. It is to ship a coherent core loop around documents, dashboards, widgets, and scoped theming.

---

## Smallest working version

The smallest useful Synapcity V0 includes:

- app shell with direct document/dashboard navigation
- document index and document detail route
- document editor with persistence
- dashboard index and dashboard detail route
- widget registry with a few document-oriented widgets
- dashboard layout persistence
- runtime theme records and theme assignments
- scoped theme application through generated palette variables

Not required for V0:

- workspace CRUD
- project/reference/resource/runbook routes
- permissions
- collaboration
- full search platform
- advanced relationship graph

---

## Phase 0 — Foundation

### Goal

Create the rebuild foundation without locking in a premature organization model.

### Must include

- app shell
- direct V0 route structure
- shared layout primitives
- shared empty/loading/error states
- basic module boundaries
- theme provider scaffold
- seed/demo data approach

### Done when

- `/documents` and `/dashboards` can render placeholder pages
- shared UI primitives are available
- architecture boundaries are visible in folder structure
- no workspace/project/reference/resource/runbook routes are introduced

---

## Phase 1 — Theme runtime contract

### Goal

Implement enough theming infrastructure for scoped palette variables.

### Must include

- `ThemeRecord`
- `ThemeAssignment`
- OKLCH seed persistence or local-storage equivalent
- runtime generation of `--primary-50…950`
- runtime generation of `--accent-50…950`
- scoped application through `data-theme-id`, `data-theme-scope`, and `data-theme-scope-id`
- inheritance behavior when no explicit assignment exists

### Done when

- root/default theme applies palette variables
- dashboard/document scopes can explicitly apply a saved theme
- inherited scopes skip generation and inherit from parent
- semantic tokens remain mapped in `globals.css`

---

## Phase 2 — Documents and document editor

### Goal

Ship the main durable content surface.

### Must include

- document create/read/update/delete
- document detail route
- document editor shell
- content serialization
- plain text projection
- autosave or explicit save
- document context rail stub

### Done when

- a user can create and edit a document without losing content
- document content reloads correctly
- editor state is not mirrored into global Zustand on every keystroke
- the old V0 `Note` terminology has been replaced by `Document`

---

## Phase 3 — Dashboard composition

### Goal

Ship the first dashboard composition surface.

### Must include

- dashboard create/read/update/delete
- dashboard detail route
- view/edit mode
- dashboard layout persistence
- responsive breakpoint layout model
- selected widget UI state
- inspector rail stub

### Done when

- a dashboard can be created and saved
- layout changes can be saved and reloaded
- view mode renders without builder chrome
- dashboard state is separate from document/editor state

---

## Phase 4 — Widget registry and core widgets

### Goal

Allow dashboards to surface documents through registered widgets.

### Must include

- widget registry
- widget definition contract
- widget instance persistence
- Document Card widget
- Document List widget
- Text Block widget
- Quick Links or Placeholder widget
- widget inspector contract

### Done when

- widgets can be added, configured, and persisted
- document widgets reference source documents by ID
- widgets do not duplicate document content
- widget renderer does not use a dashboard switch statement

---

## Phase 5 — Minimal relationships and discovery

### Goal

Make document/dashboard connections visible enough to support the core loop.

### Must include

- relationship record model
- document-to-document link relationship, if needed
- dashboard/widget surfaces-document relationship, if needed
- context rail surface for linked/related items
- simple title search or command navigation stub

### Done when

- a user can see why a document appears in a dashboard
- linked documents can be surfaced in the document context rail
- relationships are explicit where visible behavior depends on them

---

## Phase 6 — Stability and polish

### Goal

Make V0 coherent before expanding the product model.

### Must include

- accessibility pass
- performance pass
- seed/demo scenarios
- error-state coverage
- route/state cleanup checks
- visual consistency pass

### Done when

- the product feels calm and structured
- the main V0 flows are reliable
- adding future organization models would not require rewriting the core surfaces

---

## Future expansion

After V0 is stable, decide whether to introduce:

- workspace as a collaboration/account boundary
- projects as first-class objects or dashboard templates
- references/resources as objects or document sections
- runbooks as procedural documents or widgets
- collections/folders/libraries as organization surfaces
- richer search and command layers
