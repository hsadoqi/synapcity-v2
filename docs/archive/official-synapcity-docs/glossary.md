# Glossary

This document defines the vocabulary used throughout Synapcity V0.

---

## Document

The primary durable rich content object in V0. Documents own editor content, plain text projection, title, and document metadata.

## Note

Reserved for future lightweight use cases such as quick notes, annotations, margin notes, or comment-adjacent fragments. `Note` should not be used as the V0 main content object.

## Dashboard

A configurable composition surface that arranges widgets and views over existing information. Dashboards do not own the documents they display.

## WidgetDefinition

A registry definition describing an available widget type: label, category, default config, default size, renderer, and optional inspector.

## WidgetInstance

A persisted widget placed on a dashboard. A widget instance owns widget config and source references, not source document content.

## Relationship

An explicit connection between two V0 objects, such as a document linking to another document or a dashboard widget surfacing a document.

## Theme

A persisted theme record stores canonical OKLCH seed values, such as `primaryOklch` and `accentOklch`, plus metadata. Runtime code generates palette scale variables from those seeds. Semantic variables are mapped in `globals.css`.

## Theme Assignment

A link between a scope owner, such as a dashboard, document, panel, or widget, and a persisted theme record. `data-theme-id` refers to the saved theme record. `data-theme-scope-id` refers to the object being themed.

## Scope

A level at which configuration may be inherited or overridden.

V0 theme scopes:

```text
Root → Dashboard → Document → Panel/Widget
```

Workspace may become a scope later, but it is not a required V0 domain object.

## Registry

A typed map of available extension points, such as widgets, editor plugins, modals, commands, or theme panels.

Registries keep extensible systems from becoming large switch statements.

## Context Rail

A secondary panel that shows information related to the current object or selection. Examples include inspector controls, linked documents, outline, activity, and theme settings.

## Composition Surface

A page or region where users arrange reusable objects. Dashboard show pages are the main V0 composition surfaces.

## Source of Truth

The layer or object responsible for owning data. For example, a dashboard can display a document, but the document system remains the source of truth for document content.

## Future Organization Model

A deferred concept such as workspace, project, reference, resource, runbook, folder, collection, or library. These may later become first-class objects, but V0 should not assume their final shape.
