# Guide: Create a Feature

Use this guide when adding a new domain feature.

Important: V0 should not add new first-class organization features casually. Projects, references, resources, runbooks, and workspaces are deferred until documents, dashboards, widgets, and theming are stable.

---

## Strict implementation checklist

### 1. Prove the feature needs to be first-class

Before building, answer:

- Why can this not be a document section?
- Why can this not be a widget?
- Why can this not be metadata?
- Why can this not be a relationship type?
- Why does it need its own route?

If the ownership is unclear, do not build the feature yet.

### 2. Define ownership first

Document:

- what entities this feature owns
- what data it only references
- what relationships it creates
- which routes it exposes
- which public components or hooks other features may use

### 3. Create the feature module structure

Use this folder shape:

```text
modules/example/
├── index.ts
├── README.md
├── components/
├── hooks/
├── stores/
├── services/
├── repositories/
├── pages/
├── types/
└── utils/
```

### 4. Define the public API

Expose only stable entry points from the module barrel.

```ts
export { ExamplePage } from './pages/example-page'
export { useExample } from './hooks/use-example'
export type { IExampleSummary } from './types'
```

Other features must import from the module barrel, not from deep internal paths.

### 5. Keep routes thin

Route files should mount feature pages and compose shell/layout behavior.

They should not:

- contain large UI trees
- own dashboard canvas logic
- implement data access directly

### 6. Keep state boundaries explicit

- local state stays local
- shared UI state belongs in a focused store
- persisted data belongs in services/repositories
- editor state belongs in the editor system

### 7. Use relationships for meaningful links

If the feature connects to documents, dashboards, widgets, or future organization objects, create explicit relationship records rather than relying on placement or text parsing alone.

### 8. Add documentation and tests

Create a feature README and add tests for:

- core domain logic
- data access behavior
- key UI interactions
- route-level behavior where relevant

---

## Boundaries

- feature modules may not import another feature's internal components directly
- shared packages must stay free of app-specific imports
- UI code must not import Prisma directly
- future organization features must not force a rewrite of documents/dashboards/widgets
