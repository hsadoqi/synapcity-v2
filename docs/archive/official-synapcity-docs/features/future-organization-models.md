# Future Organization Models

Synapcity may eventually support richer organization models, but V0 should not make them first-class routes or required domain objects.

The current priority is to build the core surfaces:

- documents
- document editor
- dashboards
- widgets
- scoped theming

Once those are stable, the project can decide how information should be organized.

---

## Deferred concepts

These concepts are intentionally deferred:

- Workspace
- Project
- Reference
- Resource
- Runbook
- Folder
- Collection
- Library
- Area

They may later become:

- first-class route objects
- document sections
- dashboard widgets
- metadata panels
- relationship types
- saved views
- organizational labels

---

## Why defer them?

Adding too many first-class objects too early creates architecture pressure before the core product loop is proven.

V0 should avoid answering questions that are not yet forced by implementation:

- Is a project a route, a dashboard template, a collection, or a tag?
- Is a reference a separate object or a section attached to a document?
- Is a runbook a document type, a widget, or a future procedural system?
- Is workspace a collaboration boundary, a local grouping concept, or unnecessary for single-user V0?

---

## Rule

Do not build deferred concepts as V0 routes unless implementation exposes a concrete need.

If a deferred concept is needed temporarily, prefer the smallest representation:

- a document section
- a widget config option
- a relationship type
- a metadata field
- a seed/demo label
