# ADR-003: Use a Widget Registry

## Status

Accepted.

---

## Context

As dashboards add more widget types, switch statements become brittle and hard to extend.

A registry allows new widgets to be added without editing dashboard renderer internals.

---

## Decision

Use a typed widget registry for widget definitions, renderers, default config, metadata, categories, and optional inspector panels.

---

## Rationale

- Supports extension by registration.
- Keeps dashboard renderer generic.
- Improves discoverability in widget palette.
- Gives each widget a consistent contract.
- Makes widget testing easier.

---

## Tradeoffs

Widget authors must follow registry conventions.

The registry abstraction adds upfront structure.

---

## Consequences

- Widgets need stable IDs.
- Registry should reject duplicate IDs.
- Widget config should be typed and validated.
- Palette, renderer, and inspector should all consume the same definition.
