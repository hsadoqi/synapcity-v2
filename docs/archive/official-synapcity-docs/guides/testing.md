# Testing Guide

Testing should follow Synapcity's V0 layers.

---

## Unit Tests

Use for:

- pure utilities
- palette scale generation
- relationship helpers
- validators
- reducers
- registries

Examples:

- generated primary/accent scales pass contrast checks through globals.css semantic mappings
- relationship helper creates correct inverse view
- widget registry rejects duplicate ids

---

## Component Tests

Use for:

- document editor shell
- widgets
- cards
- toolbar controls
- context rails
- empty states
- theme editor sections

Focus on behavior and accessibility, not implementation details.

---

## Integration Tests

Use for:

- document create/edit/save flow
- dashboard widget add/configure/remove flow
- dashboard layout save/reload flow
- theme scope inheritance
- route sync behavior

---

## E2E Tests

Use sparingly for critical workflows:

- create document
- create dashboard
- add document widget
- edit theme assignment
- reload and confirm data persists

---

## Visual / Storybook Coverage

Important surfaces should have stories:

- dashboard grid states
- widget states
- document editor shell
- context rail
- theme editor
- command surface stubs

Each story should include loading, empty, and error states where relevant.

---

## Test Checklist

- [ ] Critical logic has unit tests.
- [ ] Interactive UI has component tests.
- [ ] Core workflows have integration tests.
- [ ] Important reusable components have Storybook stories.
- [ ] Accessibility is checked for keyboard/focus behavior.
