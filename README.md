# Synapcity

Architecture reorganization: the selected multi-app boundaries are recorded in [ADR-0014](docs/architecture/decisions/0014-multi-app-package-boundaries.md), with a [current-to-target ownership map](docs/architecture/reorganization-ownership-map.md). These are the target direction. `pnpm boundaries` enforces the workspace import rules (Milestone 3); source migrations follow in later milestones.

**A connected workspace for thinking, planning, and doing.**

Synapcity brings documents, dashboards, tasks, and focused work into one adaptable environment. Capture something while it’s fresh, give it context as it develops, and bring the useful parts into your day.

Build a workspace around how you think and work—with room for quick notes, structured plans, and everything in between.

> **In development.** Synapcity is actively evolving. This README describes the product direction; individual capabilities may be implemented, experimental, or planned.

## Why Synapcity?

Ideas, information, and actions often end up in separate places. A note holds the context, a task holds the next step, and a calendar holds the time. Keeping those pieces connected becomes another job.

Synapcity is being built to make those connections easier to maintain. Your workspace should help you move between thinking and doing while keeping the context that makes your work meaningful.

## The workspace

### Capture

Make room for thoughts, tasks, and information as they arrive. Start with what you know, then organize and develop it when you’re ready.

### Documents

Write, explore, and build understanding with a rich text editor powered by Lexical. Use documents for quick notes, ongoing thinking, reference material, and more structured work.

### Dashboards

Arrange widgets into spatial views that bring useful information and tools together. Build a dashboard around a project, an area of life, or the things you want close at hand.

### Tasks and planning

Connect the work you intend to do with the information behind it. Bring next steps into view alongside the notes and plans that give them context.

### Focus

Create space for the work you choose to do now. The direction is a focused experience that connects your priorities with the wider workspace.

## Make it yours

Personalization is part of the product’s foundation:

- **Appearance:** themes, typography, and visual preferences.
- **Layout:** flexible dashboards and adaptable workspace surfaces.
- **Organization:** structure that can develop as your work grows.

The aim is to support a workspace that feels personal while keeping everyday interactions clear and familiar.

## Technology and architecture

Synapcity is being developed with a modular TypeScript architecture.

| Area                   | Direction                              |
| ---------------------- | -------------------------------------- |
| Web application        | Next.js and React                      |
| Document editor        | Lexical                                |
| Spatial dashboards     | React Grid Layout                      |
| Styling and themes     | Tailwind CSS and shared UI foundations |
| Shared interface state | Zustand                                |
| Repository tooling     | pnpm and Turborepo                     |

The persistence direction under consideration uses Supabase/PostgreSQL for durable workspace records, TanStack Query for fetching and caching, and local storage for device preferences.

The intended model is online first, with a clear separation between saved workspace data, cached data, and interface state. Offline support remains a longer-term goal.

## Development direction

Current work is centered on the application foundation, shared interface components, and the core workflows that connect capture, documents, dashboards, and action.

Longer-term possibilities include:

- Richer connections between workspace content and planning.
- More widgets and ways to compose dashboards.
- Import and integration workflows.
- Offline capabilities.
- Collaboration.

These are areas for development and exploration, rather than a dated release commitment.

---

**Synapcity is being built around a simple idea: keep your thinking connected to what you do with it.**
