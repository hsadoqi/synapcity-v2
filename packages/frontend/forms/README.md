# @synapcity/frontend-forms

Owns: the form interaction foundations ([ADR-0015](../../../docs/architecture/decisions/0015-forms-package-and-form-state.md)) and, in this package, the schema-driven form engine from the [engine plan](../../../docs/superpowers/plans/2026-10-24-forms-schema-driven-engine.md). The caller passes a Zod object schema, normally from `domain`, and describes how each key is presented and when it applies; the package checks that description, works out which fields are visible, enabled and required for the current values, and (in later tasks) builds the validation schema, renders the form and shows its errors. The package owns no product schema, copy or workflow.

Runtime: browser and server rendering, framework-neutral. Dependency: `zod`. Category rules: [frontend README](../README.md) and [ADR-0014](../../../docs/architecture/decisions/0014-multi-app-package-boundaries.md).

History: created by Task 1 of the engine plan, ahead of extraction Part A, with the engine's pure modules as its first code (decision D16 in the plan, awaiting the owner's confirmation). Part A later adds the form pieces that move out of `apps/web`.

## Public interface

`@synapcity/frontend-forms` (root entry):

| Export                                             | Meaning                                                                                                                                                                            |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defineForm`, `FormDefinitionError`                | Checks a definition when it is written and throws one error listing every problem. Call it at module scope so a broken definition fails in a test or build, never while rendering. |
| `describeSchemaField`                              | Describes one key of an object schema: its kind, whether it accepts `undefined` or `null`, an email format, enum values.                                                           |
| `FieldConfig` and its parts, `FormDefinition`, ... | The types: the field union, conditions and dependencies, groups, cross-field rules, field state, and the issues `defineForm` reports.                                              |

## Rules

- Kind folders directly under `src/`, one folder per unit with its tests and an `index.ts`; imports between folders go through the folder's `index.ts`.
- `types/` and the pure `utils/` units import neither React nor React Hook Form, so they can move to a domain package if a server consumer appears.
- A field carries no schema: the caller's schema owns validation. `defineForm` rejects a schema with object-level refinements, because Zod 4.6.7 cannot narrow one; cross-field checks are passed as `rules`.
- Field names must be schema keys and must not be `type`, `root`, `ref`, `types`, `message` or `form`, which collide with React Hook Form's internal error shapes.
- Errors and messages name fields and types, never values.

## Scripts

`lint`, `check-types`, `test`, `test:coverage`. Pass a file as `pnpm test <file>`, not `pnpm test -- <file>`.
