# Forms schema-driven engine implementation plan

> **Status: approved by the owner on 2026-10-24 (plan and steps), not yet executable because the preconditions below are unmet.** A review the same day then changed D7 (verified against the installed Zod), fixed a markdown defect, corrected statements about the earlier implementations, corrected the test commands, moved the file layout to the workspace conventions, and verified most open assumptions (see Evidence); those corrections have not been re-confirmed by the owner. **Progress:** Tasks 1 to 4 are implemented on `feat/frontend-forms-engine`; what that taught the plan is folded into the tasks below. Builds on the forms extraction plan and ADR-0015 (React Hook Form, package `frontend-forms`), which arrive in the same change. This plan does not repeat them. Steps use checkbox syntax so a later run can track them.
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Give `frontend-forms` a declarative form engine: a caller supplies a Zod object schema and describes how each key is presented and when it applies, and gets a rendered, validated, accessible form.

**Architecture:** Pure TypeScript modules first (definition checking, condition evaluation, schema narrowing), then a scoped renderer registry, then React Hook Form bindings and the renderer. The caller's Zod object schema, normally from `domain`, is the single source of truth for validation. Each field is presentation and behavior keyed by a schema key. The validation schema is the caller's schema narrowed to the fields visible at validation time. The engine owns no product schema (ADR-0015 decision 4).

**Tech Stack:** React 19.3.0, Zod ^4.6.7 (as declared in the repo), React Hook Form and `@hookform/resolvers` (versions pinned by extraction Part B), `@synapcity/frontend-ui` primitives, Vitest and Testing Library, Storybook 10.6.3.

**Spec:** None separate. The Design section below is the spec. The evidence sources are the forms example in the responsive-grid prototype and the forms components of the earlier dashboard implementation (quarantined reference copy); evidence, not authority (`AGENTS.md` §1).

## Preconditions

- [x] Tasks 1 to 4 do not wait for extraction Part A. Task 1 creates `packages/frontend/forms` with the engine's pure modules as its first code, so the package is never an empty skeleton (D16). Part A later adds the moved form units to the existing package, and its task A2 changes from creating the package to extending it.
- [ ] Extraction Parts A and B are merged: the moved form units exist, React Hook Form is pinned and the package has its binding. Tasks 5 to 9 start here.
- [ ] The owner approves decision D1 below (engine scope inside `frontend-forms`).

The plan relies on these decisions of ADR-0015, restated here so it stays readable if that draft moves: React Hook Form is the form-state library; the package is `frontend-forms` at `packages/frontend/forms`; only that package imports React Hook Form; validation schemas stay in `domain` and the package owns none; primitives stay in `frontend-ui` and are composed, not forked; extraction (Part A) lands before library adoption (Part B).

## Global constraints

- Package path `packages/frontend/forms`, name `@synapcity/frontend-forms`. Root `.` entry plus `./testing`. Entries point at TypeScript source. No build step.
- Only this package imports `react-hook-form` (ADR-0015 decision 3).
- One package, `frontend-forms`. The engine, the bindings, the renderers, the containers and `./testing` share one runtime, one set of dependencies and one set of consumers, so none earns its own boundary. the definition types (`types/field-config.ts`, `types/form-definition.ts`) and the pure `utils/` units (`define-form`, `describe-schema-field`, `is-empty-value`, `resolve-field-states`, `build-schema`, `define-form-from-schema`) import neither React nor React Hook Form, so they can move to a domain package if a server consumer appears (see the roadmap).
- Dependencies: `@synapcity/frontend-ui` and `zod` only inside Tasks 1 to 5; no new third-party dependency in this plan.
- UI is built from `frontend-ui` primitives and semantic classes. No raw `<button>` or `<label>`, no palette colours, no `style={{}}`, no bracket values, no `!important`.
- No `any`. `unknown` is narrowed with guards.
- `'use client'` goes at the start of the client subtree, not on every file (workspace conventions, entry rule 6). `frontend-ui` is imported through its `./core/*` entries, for example `@synapcity/frontend-ui/core/input`.
- Field identity is one string, `name`. There is no separate `id`.
- Product copy is not owned here. Default messages are overridable options.
- Errors and messages name field names and types, never field values, so nothing a user typed reaches error reporting.
- Commits use conventional-commit subjects and carry no attribution trailer.
- Checks per task: `pnpm --filter @synapcity/frontend-forms test`, then at the end `pnpm verify`. Pass a file as `test <file>`, never `test -- <file>`: pnpm forwards the `--` and vitest then ignores the filter and runs every file (observed in this repo).

## Design

What the prototype gets right and this plan keeps: a registry scoped by context rather than global; cloning so one provider cannot mutate another; cycle detection; dependency evaluation as pure functions; the idea of schema-driven fields.

Problems in the prototype that shape the design. Each has a test below.

1. Two `FieldConfig` types disagree (an interface in `types.ts`, a `z.infer` type in the schema file). `FormRenderer` uses `FormSchema<T>` as a generic, but the only live `FormSchema` is not generic (the generic one is commented out). `formSchema` uses `formSectionSchema` before it is defined, which fails at module load. One definition, derived once.
2. Each field has its own `schema` and the form has a second top-level `schema`. They drift. The caller's object schema owns validation (see the dashboard-era idea below); fields carry no schema.
3. Only visibility is evaluated; `enable`, `disable` and `require` are declared and ignored. A hidden required field still fails the form-level schema, so the form cannot be submitted.
4. A dependency on an id that is not a field never resolves, and the evaluation loop re-queues it forever. Unknown references and cycles must fail when the form is defined, not while rendering.
5. `isEmpty` treats `0` and `false` as empty. `contains` on `undefined` matches the text "undefined".
6. The async validator hook is passed `form.watch` (the function) and not the values, creates a new filtered array on every render so its effect reruns every render, aborts every validator on every keystroke, and keys state by `id` while the form keys errors by `name`. Async validation is deferred (see Not in this plan).
7. `form.watch()` subscribes the whole form on every keystroke. Use `useWatch` with the narrow set of names that conditions read.
8. Unknown field types fall back silently to a text input, and `'slider'` and `format: 'oklch'` are used by the example but missing from the types. Unknown types fail loudly.
9. Raw HTML controls and hardcoded `text-red-500` and `text-gray-500`. Use `Field`, `FieldLabel`, `FieldDescription`, `FieldError` and `Button` from `frontend-ui`.

### Ideas taken from the dashboard-era implementation

- **Schema first, presentation separate.** Its form is built from a Zod object's `shape`: the keys come from the schema, and a separate per-key config says how to show each one. This matches ADR-0015 (schemas such as `nameSchema` and `profileSchema` already live in `domain-identity`), so the engine accepts the caller's schema instead of defining its own per field. It replaces the prototype's per-field `schema`.
- **Behavior apart from presentation.** It splits `meta` (required, disabled, show-if) from `config` (label, type, options). Here that split is the field's own properties versus its `dependencies`.
- **Form options.** `resetOnSuccess` and `resetOnError` become one `afterSubmit: 'keep' | 'clear'` option; Settings keeps values, create flows clear them.

Problems in that implementation that the tests below rule out:

1. `finally { if (resetOnSuccess) form.reset() }` runs after a failure too, so a failed submit clears the form. `onSubmit` is also not awaited inside the `try`, so a rejection bypasses the `catch` and its error display, and the reset in `finally` runs before an async submit settles.
2. Each caller of `useInlineError()` gets its own state. The error display calls its own copy, so it never sees the error the wrapper sets. Form-level error state lives in one place here: the form's `root.serverError`.
3. Field ids are `${key}-${index}`: unique within one form, but two forms with the same keys on one page share ids (the hardcoded `input-field` and `checkbox-field` defaults are overridden and dead). Ids come from `useId` plus the field name.
4. An unsupported type renders nothing, and an unknown one falls back to a text input, both silently apart from a development warning.
5. The per-key config is a global catalog imported from an app path, so the same key means the same thing in every form and the package depends on the app. The catalog is passed in per form.
6. `trigger(name)` on every change overrides the form's validation mode.
7. The generic wrapper renders `AuthCTA` and hardcodes `bg-blue-500` and `text-red-500`.

### Evidence gathered on 2026-10-24

Verified by running or reading, with the version noted:

- **Zod 4.6.7 (run).** `.pick()` and `.partial()` throw on an object schema with refinements; rebuilding from `.shape` drops them silently; `def.checks` is present for `refine` and `superRefine`; the introspection facts in Task 1; a `default()` key reports optional; `z.string()` accepts an empty string.
- **React Hook Form and `@hookform/resolvers` (current documentation as indexed by Context7; the installed 7.91.0 and 6.0.0 were not read directly).**
  - `handleSubmit` receives the resolver's output, so with the Zod resolver's default (non-raw) mode the submitted values are the parsed output, and a narrowed object leaves hidden keys out. The third `useForm` generic types that output.
  - `shouldUnregister` defaults to `false`: a removed field's value is retained.
  - `useWatch` takes `control` and a `name` array.
  - `shouldFocusError` defaults to `true`, works only when the field's ref is attached to a DOM element, and follows registration order.
  - `handleSubmit` does not swallow errors thrown by the submit callback.
  - `setError('root.serverError', ...)` sets a form-level error that does not persist across submissions.
  - The names `type`, `root`, `ref`, `types`, `message` and `form` collide with internal error shapes and must not be field names.
  - `zodResolver(schema, schemaOptions?, { mode?, raw? })` detects Zod 3 versus 4 and returns `(values, context, options) => Promise<result>`, so a custom resolver can call it on each validation.
- **Repository.** The pre-push hook runs `pnpm verify` (`.githooks/pre-push`). The ADR-0014 matrix allows frontend to frontend ("Conditional": explicit public interface, named responsibility, acyclic) and bars server to frontend. `frontend-ui`'s `field` exports `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldGroup`, `FieldLegend`, `FieldSeparator`, `FieldSet`, `FieldContent` and `FieldTitle`. The React test environment is jsdom 30.1.2.

Still unverified:

- The `compute` option of `useWatch` (used only if render isolation needs it).
- The installed `@hookform/resolvers` 6.0.0's exact behavior, as opposed to the documentation checked.
- Zod's documentation for `def` and introspection: the behavior was observed, the API's stability was not read.
- Whether the repo uses the React Compiler, and any interaction with React Hook Form.
- The owner's acceptance of ADR-0015: it is stated in the ADR and in a task-scope entry that was written in another worktree, and neither was on `main` before this change. It has not been confirmed independently.

### Decisions for owner review

- **D1. Scope.** ADR-0015 covers extraction and the React Hook Form binding only. A declarative engine is a larger commitment. Approve it as an amendment to ADR-0015 or a new ADR before Task 1. Recommended: a new ADR, so the extraction stays reviewable on its own.
- **D2. One name.** Drop the prototype's separate `id`. `name` is the identity and the React Hook Form path.
- **D3. Hidden fields.** A hidden field counts as empty when other conditions read it. Its value stays in form state, so it returns if the field reappears. It is not validated and is not in the submitted values.
- **D4. Client-only.** Engine forms run in the browser and do not work before hydration. That suits Settings drafts. Auth keeps its native-action forms until the progressive-enhancement question in ADR-0015 is settled.
- **D5. Not the theme example.** The prototype's theme form is a Settings editor. It belongs in `features-settings` (M6), built from `domain-preferences`. It is not ported here, and it needs field types (colour, slider) that `frontend-ui` does not have.
- **D6. ADR number.** The decisions index restarted at 0001 for this repository, and the archived 0001 to 0016 belong to the previous lineage, so the next free active number is 0015 and there is no collision with the archive. Another branch may still claim 0015; check when the ADR is committed. While checking I found two active files numbered 0011 (`0011-collection-browse-feature.md` and `0011-resizable-global-panel-shell.md`), a pre-existing numbering defect that this plan does not touch.
- **D7. Schema source.** The caller passes a Zod object schema and the engine validates only the keys that have a field, narrowed to the visible ones. **Verified by running the installed Zod 4.6.7 (2026-10-24):** `.pick()` and `.partial()` throw on an object schema that has refinements, and rebuilding an object from `.shape` works but silently drops the refinements. So the engine builds the narrowed schema from `.shape`, and `defineForm` rejects a schema with object-level refinements (detectable through `schema.def.checks`) instead of dropping them. Cross-field rules are passed separately as `rules`, each naming the fields it reads and the field its message lands on; a rule runs only while all of its fields are visible. This revises the earlier assumption and needs the owner's confirmation.
- **D8. After submit.** The default is `afterSubmit: 'keep'` (values stay, dirty state resets). `'clear'` is opt-in.
- **D9. Containers.** The engine offers a closed set of containers (plain, card, section, dialog, sheet) plus a custom component, chosen by one optional `container` prop, built only from `frontend-ui` primitives. `FormRenderer` stays container-agnostic. Buttons may sit outside the `<form>` element through the `form` attribute, which was checked in jsdom 30.1.2. Closing a dialog or sheet, and any unsaved-changes guard on close, stay with the caller.
- **D10. Initial values.** `initialValues` seeds the form once. A later change to it is ignored so a refetch cannot overwrite what the user typed. The caller changes `resetKey` to reload the form, which discards unsaved edits.
- **D11. Submit result.** `onSubmit` may return `{ fieldErrors?, formError? }` for expected failures such as a taken name; throwing stays for unexpected ones. This is local to the engine. It is not the server-action result contract, which ADR-0015 leaves to a separate decision.
- **D12. Groups.** A group is a run of adjacent fields sharing a declared `group` id, rendered as a fieldset with a legend, using `frontend-ui`'s `FieldSet` and `FieldLegend`. Collapsible groups stay out.
- **D13. Schema-only forms.** A caller may pass just a Zod object schema and labels. The explicit field list stays the primary form; inference covers strings, numbers, booleans and enums only, and anything else needs an override or an exclusion. Labels are never derived from key names. Requiredness comes from the schema (`baseRequired`), not only from the `require` effect.
- **D14. Error display.** Field errors always show under their field. A summary of all errors is on by default and can be turned off, but never replaces the inline messages. The form-level error may carry a title. It clears on the next edit or submit. The engine renders no toast; `onInvalid` and the submit result let the caller route errors elsewhere.
- **D15. Category.** `frontend`, not `features`. The workspace conventions give `frontend` presentation and interaction foundations and `features` product composition and workflows. The engine has no product vocabulary, no workflow and no server work. A form definition for a product screen belongs to the feature that owns the screen, or to the domain schema it validates with. A `features-forms` package would imply a product capability that does not exist, would carry the `./contracts`, `./frontend` and `./server` shape for no reason, and would make every feature that needs a generic form reach into a sibling feature. The only other placement considered is the `domain-forms` extraction in the roadmap, and only if a server consumer appears.
- **D16. Package creation order.** The first draft waited for extraction Part A to create the package. To start now, Task 1 creates `frontend-forms` with the engine's pure modules as its first code, and Part A later extends the existing package. This reorders the sequence in the extraction plan; ADR-0015's rule that extraction comes before library adoption still holds, because React Hook Form arrives no earlier than Part B. It was chosen as the recommended default when the owner asked to proceed, and the owner confirmed it on 2026-10-24. The extraction plan's task A2 is updated to match: it extends the existing package instead of creating it.

## Review Focus

- A required field that is hidden does not block submit and is absent from the submitted values. Pinned in Tasks 3 and 6a.
- A condition that names an unknown field, or a cycle, fails when the form is defined. It never loops during render. Task 1.
- `0`, `false` and `""` are handled deliberately: `0` and `false` are values, `""`, `null`, `undefined` and `[]` are empty. A cleared number input yields `undefined`, never `NaN`. Tasks 2 and 5.
- A field type with no renderer throws an error that names the type. It does not render a text input. Tasks 4 and 6a.
- `onSubmit` is awaited. A rejection shows a form-level error and keeps what the user typed, even with `afterSubmit: 'clear'`. A second submit while one is pending is ignored. Tasks 6a and 6b.

---

## File structure

All under `packages/frontend/forms/src/`, in kind folders directly under `src/` (a one-module package), with one folder per unit holding its source, tests and an `index.ts`, and an `index.ts` per kind folder (workspace conventions, Internal organization).

| Path                                                                                                                                                | Responsibility                                                                                                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `types/field-config.ts`                                                                                                                             | `FieldConfig` union, `FieldDependency`, `FieldCondition`, `FieldOption`, `FieldGroup`, `FormRule` types             |
| `types/form-definition.ts`                                                                                                                          | `FormDefinition`, `FieldState`, `FormDefinitionIssue` types                                                         |
| `utils/define-form/`                                                                                                                                | `defineForm`, `FormDefinitionError`                                                                                 |
| `utils/describe-schema-field/`                                                                                                                      | `describeSchemaField`                                                                                               |
| `utils/is-empty-value/`                                                                                                                             | `isEmptyValue`                                                                                                      |
| `utils/resolve-field-states/`                                                                                                                       | condition evaluation and field states                                                                               |
| `utils/build-schema/`                                                                                                                               | `buildSchema`, `createSchemaBuilder`                                                                                |
| `utils/define-form-from-schema/`                                                                                                                    | schema-only forms (Task 10)                                                                                         |
| `utils/create-form-resolver/`                                                                                                                       | the React Hook Form resolver                                                                                        |
| `providers/field-renderer-provider/`                                                                                                                | `FieldRendererRegistry`, `UnknownFieldTypeError`, the provider, `useFieldRendererRegistry`, `createDefaultRegistry` |
| `providers/form-builder-provider/`                                                                                                                  | `FormBuilderProvider`                                                                                               |
| `hooks/use-form-builder/`                                                                                                                           | `useFormBuilder`                                                                                                    |
| `components/field-frame/`, `components/text-renderer/`, `components/number-renderer/`, `components/select-renderer/`, `components/toggle-renderer/` | the built-in renderers                                                                                              |
| `components/form-renderer/`                                                                                                                         | `FormRenderer` and its stories                                                                                      |
| `components/field-view/`, `components/form-group/`, `components/error-summary/`, `components/form-error/`                                           | pieces of the renderer                                                                                              |
| `components/form-container/`                                                                                                                        | the containers: plain, card, section, dialog, sheet                                                                 |
| `testing/`                                                                                                                                          | the `./testing` entry: a fixture form and test helpers; no shipped code imports it                                  |
| `index.ts`                                                                                                                                          | the root entry, re-exporting the public surface                                                                     |
| `purity.test.ts`                                                                                                                                    | checks that the pure units import neither React nor React Hook Form                                                 |

---

### Task 1: Field definition and form checking

**Files:**

- Create the package: `packages/frontend/forms/package.json` (exports `.` only for now), `tsconfig.json`, `eslint.config.mjs`, `vitest.config.mts`, `README.md`. Register it in the root `vitest.config.ts` `projects`. `pnpm install` adds its importer to `pnpm-lock.yaml`, using only versions already in the lockfile. Declare `"types": ["node"]` in the tsconfig: TypeScript 7.0.2 does not include `@types/node` on its own, and the purity test reads files.
- Create: `types/field-config.ts`, `types/form-definition.ts`, `types/index.ts`, `utils/define-form/` and `utils/describe-schema-field/` (source, test and `index.ts` each), `utils/index.ts`, `src/index.ts`.

**Interfaces:**

- Produces:
  - `type FieldConfig<TName extends string = string>`, a discriminated union on `type`:
    - `TextFieldConfig`: `type` is `'text'`, `'email'` or `'textarea'`; `props?: { placeholder?: string; maxLength?: number; autoComplete?: string }`.
    - `PasswordFieldConfig`: `type: 'password'`; `props: { autoComplete: 'current-password' | 'new-password'; placeholder?: string }`, and `props` is required.
    - `NumberFieldConfig`: `type: 'number'`; `props?: { min?: number; max?: number; step?: number }`.
    - `SelectFieldConfig`: `type: 'select'`; `options: readonly FieldOption[]`; `props?: { placeholder?: string }`.
    - `ToggleFieldConfig`: `type` is `'checkbox'` or `'switch'`.
    - `CustomFieldConfig`: `` type: `custom:${string}` ``; `props?: Readonly<Record<string, unknown>>`.
    - Every member also has `name: TName`, `label: string`, `description?: string`, `group?: string` and `dependencies?: readonly FieldDependency<TName>[]`. `defineForm` binds `TName` to the schema's keys, so a name that is not a schema key is a compile error. There is no per-field schema (D7).
  - `interface FieldCondition<TName extends string = string> { field: TName; operator: 'equals' | 'notEquals' | 'contains' | 'gt' | 'lt' | 'isEmpty'; value?: unknown }`
  - `interface FieldDependency<TName extends string = string> { conditions: readonly FieldCondition<TName>[]; match: 'all' | 'any'; effect: 'show' | 'hide' | 'enable' | 'disable' | 'require' }`
  - `interface FieldGroup { id: string; title: string; description?: string }`
  - `interface FormRule<TName extends string = string> { fields: readonly TName[]; path: TName; check(values: Readonly<Partial<Record<TName, unknown>>>): string | undefined }`
  - `interface FormDefinition<TSchema extends z.ZodObject = z.ZodObject> { schema: TSchema; rules: readonly FormRule<Extract<keyof z.infer<TSchema>, string>>[]; fields: readonly FieldConfig<Extract<keyof z.infer<TSchema>, string>>[]; groups: readonly FieldGroup[]; baseRequired: Readonly<Record<string, boolean>>; evaluationOrder: readonly string[] }`
  - `defineForm<TSchema extends z.ZodObject>(input: { schema: TSchema; fields: readonly FieldConfig<Extract<keyof z.infer<TSchema>, string>>[]; groups?: readonly FieldGroup[]; rules?: readonly FormRule<Extract<keyof z.infer<TSchema>, string>>[] }): FormDefinition<TSchema>`
  - `describeSchemaField(schema: z.ZodObject, key: string): { kind: 'string' | 'number' | 'boolean' | 'enum' | 'other'; optional: boolean; nullable: boolean; format?: 'email'; enumValues?: readonly string[] }`. It reads Zod 4.6.7's schema definitions. Observed by running Zod 4.6.7 (documentation not read): `schema.shape[key].def.type` is `'optional'`, `'nullable'`, `'default'`, `'string'` and so on; `.isOptional()` is true for optional and default keys and `.isNullable()` is true for nullable keys; `.def.innerType` is the wrapped schema; `.def.format` is `'email'` for `z.email()` but is absent for the legacy `z.string().email()`; `.options` lists an enum's values. `baseRequired[name]` is `!(optional || nullable)` for each field: a key that accepts `undefined` or `null` is not required. It reflects acceptance of those values only: `z.string()` accepts an empty string, so a caller who wants non-empty input writes `.min(1)`.
  - `class FormDefinitionError extends Error { issues: readonly { code: 'duplicate-name' | 'unknown-field' | 'unknown-reference' | 'unknown-group' | 'split-group' | 'schema-has-refinements' | 'reserved-name' | 'cannot-infer' | 'cycle'; name: string; path?: readonly string[] }[] }`

A group is a run of adjacent fields that share a `group` id, rendered later as a fieldset with a legend. Fields keep the order they are given in.

- [ ] **Step 1: Write the failing tests** in `define-form.test.ts`:
  - `rejects duplicate field names` → throws `FormDefinitionError`, issue `{ code: 'duplicate-name', name: 'a' }`.
  - `rejects a field whose name is not a key of the schema` → issue `{ code: 'unknown-field', name: 'nope' }`.
  - `baseRequired is false for optional and nullable keys and true for the rest`.
  - `describeSchemaField reports kind, optional, nullable, email format and enum values`.
  - `a password field without autoComplete is a compile error` (`// @ts-expect-error`).
  - `rejects a schema with object-level refinements` → issue code `'schema-has-refinements'` (`refine` and `superRefine` both).
  - `rejects a rule that names an unknown field` → issue code `'unknown-reference'`.
  - `accepts an empty field list`.
  - `rejects a field named type, root, ref, types, message or form` → issue code `'reserved-name'` (these collide with React Hook Form's internal error shapes).
  - `rejects a field whose group is not declared` → issue `{ code: 'unknown-group', name: 'x' }`.
  - `rejects a group whose fields are not adjacent` → issue `{ code: 'split-group', name: 'g' }`.
  - `a field name, or a condition's field, that is not a schema key is a compile error` (lines marked `// @ts-expect-error` in the test file; `check-types` enforces them).
  - `rejects a condition that names an unknown field` → issue `{ code: 'unknown-reference', name: 'b' }` where `b` depends on missing `zzz`.
  - `rejects a two-field cycle` → issue code `'cycle'`, `path` `['a', 'b', 'a']`.
  - `rejects a field that depends on itself`.
  - `evaluationOrder lists dependencies before dependents` → input `[b, a]` with `b` reading `a` gives `['a', 'b']`, while `fields` keeps the input order.
  - `reports every problem, not only the first` → two issues from one call.
- [ ] **Step 2: Run** `pnpm --filter @synapcity/frontend-forms test define-form` → FAIL, module not found.
- [ ] **Step 3: Implement** the types and `defineForm` as above. Topological order by depth-first search with a visiting set; collect issues, throw once at the end.
- [ ] **Step 4: Run** the same command and `pnpm --filter @synapcity/frontend-forms check-types` → PASS.
- [ ] **Step 5: Commit** `feat(forms): add field definitions and form checking`.

### Task 2: Field state resolution

**Files:** Create `utils/resolve-field-states/` and `utils/is-empty-value/` (source, test and `index.ts` each). Modify `utils/index.ts`.

**Interfaces:**

- Consumes: `FormDefinition`, `FieldDependency`, `FieldCondition` (Task 1).
- Produces: `interface FieldState { visible: boolean; enabled: boolean; required: boolean }`; `resolveFieldStates(definition: FormDefinition, values: Readonly<Record<string, unknown>>): Readonly<Record<string, FieldState>>`; `isEmptyValue(value: unknown): boolean`.

Semantics to implement exactly: a field with no `show` dependency is visible; with `show` dependencies it is visible only when every `show` dependency is met. It is hidden when any `hide` dependency is met. `enable` and `disable` follow the same rule for `enabled`. `required` is true when the schema does not let the field be undefined or null (`baseRequired`) or any `require` dependency is met. A dependency is met per its `match`: `all` or `any` of its conditions. A hidden field's value reads as `undefined` in other fields' conditions (D3). Evaluate in `evaluationOrder`.

- [ ] **Step 1: Write the failing tests:**
  - `shows a field only while its show condition is met` (flips when the value changes).
  - `hides a field while its hide condition is met`.
  - `match any needs one condition, match all needs every condition`.
  - `disable and enable set enabled`.
  - `a field the schema does not mark optional is required without any dependency`.
  - `require makes a field required only while met`.
  - `a hidden field reads as empty to its dependents` (`c` shown when `b` is empty, `b` hidden by `a` → `c` visible).
  - `isEmptyValue` is `false` for `0` and `false`, `true` for `''`, `null`, `undefined`, `[]` and `NaN`.
  - `gt and lt are false for non-numeric values` (including `NaN` and `undefined`).
  - `contains works on strings and arrays and is false for undefined`.
  - `resolves generated acyclic definitions without looping` (a small seeded generator written in the test file, no new dependency; 200 definitions, each resolved against random values).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** the signatures above as pure functions.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(forms): resolve field visibility, enablement and requirement`.

### Task 3: Derived validation schema

**Files:** Create `utils/build-schema/` (source, test and `index.ts`) and `src/purity.test.ts`. Modify `utils/index.ts`.

**Interfaces:**

- Consumes: `FormDefinition`, `FieldState`, `isEmptyValue`.
- Produces:
  - `buildSchema(definition: FormDefinition, states: Readonly<Record<string, FieldState>>, messages?: { required?: string }): z.ZodObject`. Default `required` message: `'This field is required'`.
  - `createSchemaBuilder(definition: FormDefinition, messages?: { required?: string }): (states: Readonly<Record<string, FieldState>>) => z.ZodObject`, which caches by a signature of the visible and required field names, so typing does not rebuild a schema while visibility is unchanged.

- [ ] **Step 1: Write the failing tests:**
  - `omits hidden fields, so a hidden required field does not fail parsing`.
  - `strips hidden fields from the parsed output`.
  - `keeps disabled fields in the output and validates them`.
  - `fails an empty value for a field whose require effect is met`, with the issue at that field's `name` and the `required` message.
  - `uses the caller's required message when given`.
  - `passes the caller's schema messages through unchanged` (e.g. `z.string().min(3, 'Too short')` yields `'Too short'`).
  - `fails a required field whose key is absent from the values, not only an empty one`.
  - `an empty required field reports only the required message, not also the schema's own rule for a non-empty value`.
  - `validates only keys that have a field` (a schema key with no field does not fail the form).
  - `createSchemaBuilder returns the same schema instance for states with the same visible and required fields`.
  - `createSchemaBuilder returns a new schema when a field's visibility or requirement changes`.
  - `definition, state and validation modules import neither react nor react-hook-form` (a test that reads those folders' sources and checks their import specifiers).
  - `a rule runs only while all of its fields are visible` (hide one of its fields and the rule no longer fails the parse).
  - `a rule's message lands on its path field`.
  - `the narrowed schema is built from shape, so a schema with plain checks per key (min, regex) keeps them`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** `buildSchema` by building a new object from `definition.schema.shape` for the visible keys (never `.pick()`, which throws on a refined schema), applying each applicable rule as a refinement; a field required only by a `require` dependency is built as `z.unknown().refine(not empty).pipe(base)`. Starting from `unknown` makes Zod validate the key even when it is absent from the values (Zod skips an optional key that is absent, so a plain refinement on the schema never runs for an untouched field), and checking emptiness before piping into the schema means an empty field reports only "required", not also the schema's own rule.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(forms): derive the form schema from visible fields`.

### Task 4: Renderer registry and provider

**Files:** Switch the package to the React tooling: `package.json` (`react`, `react-dom`, `@testing-library/react`, `@testing-library/dom`, `jsdom`, `@types/react`, `@types/react-dom`; versions as in `frontend-collection`), `tsconfig.json` (extend `react-library.json`), `eslint.config.mjs` (`react-internal`), and `vitest.config.ts` renamed to `vitest.config.mts` with the React test config. Create `providers/field-renderer-provider/` with `field-renderer-registry.ts`, `field-renderer-provider.tsx`, a test for each, and `index.ts`; `providers/index.ts`.

**Interfaces:**

- Consumes: `FieldConfig`.
- Produces:
  - `interface FieldRendererProps { field: FieldConfig; id: string; value: unknown; onChange(value: unknown): void; onBlur(): void; invalid: boolean; disabled: boolean; required: boolean; describedBy?: string }`
  - `type FieldRenderer = React.ComponentType<FieldRendererProps>`
  - `class FieldRendererRegistry { register(type: string, renderer: FieldRenderer): this; has(type: string): boolean; resolve(type: string): FieldRenderer; clone(): FieldRendererRegistry }`
  - `class UnknownFieldTypeError extends Error { type: string }`
  - `FieldRendererProvider(props: { children: ReactNode; registry?: FieldRendererRegistry; extend?(registry: FieldRendererRegistry): void })`; `useFieldRendererRegistry(): FieldRendererRegistry`.

The default registry comes from Task 5. Until then the provider's default is an empty registry; Task 5 swaps in `createDefaultRegistry`.

- [ ] **Step 1: Write the failing tests:**
  - `resolve returns what register stored`.
  - `resolve throws UnknownFieldTypeError naming the type` (message contains `custom:swatch`).
  - `clone isolates later registrations in either direction`.
  - `extend adds a renderer for one provider and leaves the base registry unchanged`.
  - `useFieldRendererRegistry throws outside a provider`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** the registry over a `Map<string, FieldRenderer>`; the provider clones once in `useState`, then applies `extend`. Render a component that comes from the registry with `createElement(registry.resolve(type), props)`: JSX on a resolved component trips the `react-hooks/static-components` lint rule.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(forms): add the scoped field renderer registry`.

### Task 5: Built-in renderers and default registry

**Files:** Create `components/field-frame/`, `components/text-renderer/`, `components/number-renderer/`, `components/select-renderer/` and `components/toggle-renderer/` (source, test and `index.ts` each), and `providers/field-renderer-provider/create-default-registry.ts` with its test. Modify `providers/field-renderer-provider/field-renderer-provider.tsx` to default to `createDefaultRegistry()`.

**Interfaces:**

- Consumes: `FieldRendererProps`, `FieldRendererRegistry`; `frontend-ui` `input`, `textarea`, `select`, `checkbox`, `switch`, `field`; whatever the extraction decided for `form-field` (task A1) in place of `field-frame` if it absorbs it.
- Produces: `createDefaultRegistry(): FieldRendererRegistry` registering `text`, `email`, `password`, `textarea`, `number`, `select`, `checkbox`, `switch`. `FieldFrame` renders label, description and error with the ids `describedBy` points to.

Colour, date, slider, radio, multiselect, file and tags renderers are deferred until `frontend-ui` has the primitives. `custom:*` is the escape hatch meanwhile.

**Done 2026-10-24.** As built, differing from the plan above:

- `FieldRendererProps` gains `focusRef?: Ref<HTMLElement>`, attached to each renderer's focusable control, so Task 6a can move focus to the first invalid field. Base UI's checkbox, switch and select are not native inputs, so React Hook Form cannot attach a ref to them on its own.
- `FieldFrame` renders the label, the control (as `children`), the description and the error; `fieldIds(id)` and `fieldDescribedBy(id, …)` give the ids. Renderers render the control only, and the frame is placed around them by Task 6a.
- Base UI checkbox and switch put `id` on a hidden native input and name the visible control themselves from the label that targets it. Their names are checked by role and name in the tests.
- The number renderer keeps `type="number"` and adds `inputMode="decimal"`; a cleared or unparsable entry emits `undefined`.
- The test that two forms never share an id moves to Task 6a, which generates the ids.
- `FieldRenderer` and `FieldRendererProps` live in `types/field-renderer.ts`, not in the provider folder: renderers importing them through the provider made a module cycle (renderer, provider, default registry, renderer) that `pnpm boundaries` reported. They import React types, so `types/field-renderer.ts` is not in the purity test's set; the provider still re-exports them.
- Widened afterwards, at the owner's request, to cover the inputs the app's forms use: `text-renderer` became `input-renderer` (`InputRenderer`) and handles text, email, tel, url, search, password and textarea; `minLength` joins `maxLength` on text and password fields; a `file` field type (`FileFieldConfig`, `props.accept` and `props.multiple`) is rendered by `FileRenderer`; `describeSchemaField` reports `z.file()` as kind `file`. Email, URL and password text is never autocapitalised, autocorrected or spellchecked. A file input cannot be controlled, so `FileRenderer` reports the choice (a `File`, or a list when `multiple`, `undefined` when cleared) and empties the input when the form value returns to nothing. Task 10 should infer `file` for `z.file()` keys.
- Not done here: a story for each renderer (Task 8), and a `hidden` input, `date`, `color` and `range` inputs (see the roadmap).

- [x] **Step 1: Write the failing tests:**
  - `text renderer wires the label, aria-invalid and aria-describedby`.
  - `two fields, and the same form rendered twice, never share an id`.
  - `number renderer emits a number, and undefined (not NaN) when cleared`.
  - `select renderer emits the chosen option's value`.
  - `toggle renderers emit booleans`.
  - `createDefaultRegistry resolves every built-in type`.
  - `a provider with no registry prop resolves 'text'`.
- [x] **Step 2: Run** → FAIL.
- [x] **Step 3: Implement** the renderers over the primitives. `className` only for layout, per the design-system rules.
- [x] **Step 4: Run** → PASS.
- [x] **Step 5: Commit** `feat(forms): add built-in field renderers`.

### Task 6a: React Hook Form integration and the core renderer

**Files:** Create `utils/create-form-resolver/`, `hooks/use-form-builder/` and `components/form-renderer/` (source, test and `index.ts` each); kind-folder indexes.

**Interfaces:**

- Consumes: everything above, and `useActionForm` from extraction Part B (`hooks/use-action-form/`). Decide at the start of this task whether `FormRenderer` builds on `useActionForm` (keeping the form's `action`, so engine forms work before hydration) or uses React Hook Form's `handleSubmit` alone (client-only, D4). Building on it would make D4 unnecessary for forms that submit to a server action; the two must not grow separate submit, refusal and focus logic.
- Produces:
  - `createFormResolver(definition: FormDefinition, messages?: { required?: string }): Resolver<FieldValues>`, resolving field states from the incoming values, then validating with a schema from `createSchemaBuilder` (created once per definition), using the resolver package's Zod mapping: it returns `(values, context, options) => zodResolver(schemaFor(values))(values, context, options)`.
  - `useFormBuilder(options: { definition: FormDefinition; initialValues?: Readonly<Record<string, unknown>>; mode?: 'onBlur' | 'onChange' | 'onSubmit' }): { form: UseFormReturn; states: Readonly<Record<string, FieldState>> }`, using `useWatch` for only the names that conditions read; default mode `'onBlur'`.
  - `FormRenderer<TSchema extends z.ZodObject>(props: { definition: FormDefinition<TSchema>; initialValues?: Readonly<Partial<z.infer<TSchema>>>; onSubmit(values: Partial<z.infer<TSchema>>): void | Promise<void>; onCancel?(): void; submitLabel?: string; cancelLabel?: string; afterSubmit?: 'keep' | 'clear'; messages?: { required?: string } })`. Values are `Partial` because hidden fields are omitted. It checks every field type against the registry and throws one `UnknownFieldTypeError` listing the unknown types.

**Done 2026-10-24.** The owner chose one core with two submit modes. As built:

- `FormRenderer` takes either `onSubmit` (the browser submits to a handler; needs JavaScript, D4) or `action` with optional `state` and `pending` (the form keeps its `action`, so it works before hydration; once hydrated it validates and posts the form's own `FormData` only when valid, and shows one refusal at a time, the way the server does). D4 therefore no longer applies to forms that submit to a server action.
- Fields are controlled by React Hook Form, so the engine does not need `useActionForm`'s `FormData` sync: React 19's reset after an action does not touch controlled inputs. `firstRefusal` is shared between the two.
- `disabled` goes to the renderer only: passed to the controller, React Hook Form would leave the field's value out of what is submitted, and disabled fields are kept and validated.
- `useFormBuilder` stays internal for now; it returns React Hook Form's form object, and Task 6c decides the public shape of hand-laid-out forms.
- Without a `FieldRendererProvider`, `FormRenderer` uses the built-in renderers.
- The default submit-failed message never contains the thrown error's text.
- Not covered by a test: that the dirty state resets after a successful submit (it is not observable from outside yet).
- Five deliberate breakages (focus order, double submit, action without validation, `afterSubmit: 'clear'`, leaking the thrown text) were each caught by a test.

- [x] **Step 1: Write the failing tests** (Testing Library, user-event):
  - `submits only visible values` (hidden field absent from the payload).
  - `a hidden required field does not block submit`.
  - `a field shows no error before it is touched or the form is submitted`.
  - `shows a schema error under the field and moves focus to the first invalid field`.
  - `focuses the first invalid field in definition order even when a conditional field registered later` (the library's own focus follows registration order).
  - `a nullable key that is not optional starts as null, so an untouched field validates` (Zod fails such a key when it is absent).
  - `a field that becomes required shows the required message on submit`.
  - `a cross-field rule's message shows under its path field on submit, and not while one of the rule's fields is hidden`.
  - `a field shown by a later change appears and its value is submitted`.
  - `ignores a second submit while the first is pending`.
  - `awaits an async onSubmit and stays pending until it settles`.
  - `shows a form-level error when onSubmit rejects and keeps the typed values`.
  - `keeps the values and resets the dirty state after a successful submit by default`.
  - `clears the form after a successful submit when afterSubmit is clear`.
  - `does not clear the form after a failed submit, even when afterSubmit is clear`.
  - `a definition with no fields renders only its buttons and submits an empty object`.
  - `throws naming the type when a field type has no renderer`.
- [x] **Step 2: Run** `pnpm --filter @synapcity/frontend-forms test form` → FAIL.
- [x] **Step 3: Implement** the three units. Type the form with the three generics, `useForm<Input, unknown, Output>`, so `handleSubmit` receives the parsed output. Leave `shouldUnregister` at its default (`false`) and say so in a comment: D3 relies on hidden values being retained. Wrap the caller's `onSubmit` in `try/catch` and call `setError('root.serverError', ...)` on a throw, with a message that never contains field values, because the library does not swallow submit errors. Controllers forward the field `ref`. Buttons are `frontend-ui` `Button`; the form-level error uses the message piece from the extraction.
- [x] **Step 4: Run** → PASS.
- [x] **Step 5: Commit** `feat(forms): add the schema-driven form renderer`.

### Tasks 5b to 5h: what the responsive-grid prototype covers and this plan had deferred

Added 2026-10-24 after a full comparison with the owner's prototype (`synapcity-responsive-grid/packages/forms`). The prototype is a sketch, but it covers more kinds of field and behaviour than this plan scheduled. Each item below was "eventually" and is now a task. They follow Task 6a, because every field renders through `FormRenderer`.

- **5b. More native inputs.** _(Done 2026-10-24: `DateTimeFieldConfig` for `date`, `time`, `datetime-local`, `month`, `week` and `color`, rendered by `InputRenderer` with `min`, `max` and `step`; `range` joins `number` in `NumberRenderer`; `pattern` on text fields; a `range` field starts undefined, not `''`, which a test caught.)_ `date`, `time`, `datetime-local`, `month`, `week`, `color` and `range` through `frontend-ui`'s `Input` (no new primitive is needed; the earlier reason for deferring them was wrong). Text fields gain `pattern`. String values for the date and time types, a number for `range`.
- **5c. Choice fields.** `radio` (add `frontend-ui`'s radio group with `pnpm ui:add radio-group`), a checkbox group for several values (`multiselect`), and select `multiple`, `clearable` and `searchable` (searchable uses `frontend-ui`'s combobox). `tags` waits for a tags input component.
- **5d. Async validation.** A field may declare `validateAsync(value, values, signal)`. Debounced (300 ms default), aborted when the value changes again, given up after a timeout (5 s default), deduplicated by value, keyed by field `name`, shown as "checking" on the field, and run again before submit. Fixes the prototype's bugs (it was passed `form.watch` rather than the values, keyed state by `id`, and aborted every validator on every change).
- **5e. Nested names.** A field `name` may be a dot path into a nested object schema (`address.city`); names, conditions and errors use paths, and `describeSchemaField` walks them. Array paths stay with field arrays.
- **5f. Collapsible sections.** A group may be `collapsible` (and `defaultOpen`), using `frontend-ui`'s accordion; a section with an invalid field opens on submit.
- **5g. Reading other values from a custom renderer.** `useFieldValues(names)` from the package, so a `custom:*` renderer can depend on other fields without importing React Hook Form (ADR-0015 decision 3); this replaces the prototype's `FormProvider`.
- **5h. Opt-in virtualization.** `virtualized` on `FormRenderer` for very long forms, with measured row heights, and focus and tab order checked for fields scrolled out of the DOM. A new dependency (`@tanstack/react-virtual`) needs the owner's approval first.

### Task 6b: Submit results and error display

**Files:** Create `components/error-summary/` and `components/form-error/` (source, test and `index.ts` each). Modify `components/form-renderer/` and its test.

**Interfaces:**

- Consumes: `FormRenderer` (Task 6a).
- Produces:
  - `interface FormErrorMessage { title?: string; message: string }` and `interface SubmitResult { fieldErrors?: Readonly<Record<string, string>>; formError?: string | FormErrorMessage }`
  - `FormRenderer` gains: `onSubmit` may also return `SubmitResult | Promise<void | SubmitResult>`; `messages?: { required?: string; submitFailed?: string }`; `errorDisplay?: 'inline' | 'both'`; `onInvalid?(names: readonly string[]): void`.
  - `errorDisplay` defaults to `'both'`: each field shows its own error and a summary lists them all. `'inline'` omits the summary. There is no summary-only mode, because it would leave a field's message out of the field's own description. `onInvalid` receives field names only, never values, so a caller can route to a toast or analytics itself. A returned `SubmitResult` with any error counts as a failed submit.

- [ ] **Step 1: Write the failing tests:**
  - `shows returned field errors under their fields and focuses the first one`.
  - `shows a returned formError at the form level`.
  - `a structured formError renders its title and message in an alert region`.
  - `a returned error does not clear the form, even when afterSubmit is clear`.
  - `a returned field error for a name that is not a field becomes a form-level error` (default message from `messages.submitFailed`).
  - `a form-level error clears on the next edit and on the next submit`.
  - `after a failed submit an error summary lists each invalid field and each entry moves focus to its field` (focus otherwise stays on the first invalid field).
  - `errorDisplay inline shows field errors under their fields and renders no summary`.
  - `onInvalid receives the invalid field names and no values`.
  - `the form-level error and the summary are announced through an aria-live region`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** the summary and the form-level error as small components over `frontend-ui` pieces; keep the form-level error in the form's own `root.serverError`, in one place. Focus the first invalid field with `form.setFocus(name)` in definition order, since the library's own first-error focus follows registration order.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(forms): add submit results and error display`.

### Task 6c: Groups, initial values, hand-laid-out forms and render isolation

**Files:** Create `providers/form-builder-provider/`, `components/field-view/` and `components/form-group/` (source, test and `index.ts` each). Modify `components/form-renderer/`, `hooks/use-form-builder/` and their tests.

**Interfaces:**

- Consumes: `FormRenderer`, `useFormBuilder` (Tasks 6a and 6b); `FieldSet`, `FieldLegend` and `FieldGroup` from `frontend-ui`'s `field`.
- Produces:
  - `FormRenderer` gains `resetKey?: string | number`. The reset runs in an effect keyed only by `resetKey`, never by `initialValues` (D10).
  - `FormBuilderProvider(props: { builder: ReturnType<typeof useFormBuilder>; children: ReactNode })` and `FieldView(props: { name: string })`, which renders one field of the definition with its label, error, state and registry renderer. Names are provisional until the extraction's naming is settled. `FormRenderer` is optional: this keeps definition, validation and rendering available to features whose screens a declarative container cannot express, without letting them import React Hook Form (ADR-0015 decision 3).

- [ ] **Step 1: Write the failing tests:**
  - `ignores a changed initialValues until resetKey changes` (typed edits survive).
  - `resets to the current initialValues when resetKey changes, discarding unsaved edits`.
  - `renders a group as a fieldset named by its legend`.
  - `omits a group whose fields are all hidden`.
  - `renders ungrouped fields outside any fieldset`.
  - `a hand-laid-out form built from useFormBuilder, FormBuilderProvider and FieldView validates, hides fields and submits like FormRenderer`.
  - `FieldView throws naming the field when its name is not in the definition`.
  - `typing in one field does not re-render the other fields` (render counts via a test renderer).
  - `a keystroke that leaves every field state unchanged does not re-render the field list`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** the provider, `FieldView` and group rendering; subscribe each field through its own controller so only that field re-renders.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(forms): add groups, resetKey and hand-laid-out forms`.

### Task 7: Form containers

**Files:** Create `components/form-container/` with `form-container.tsx`, `plain-container.tsx`, `card-container.tsx`, `section-container.tsx`, `dialog-container.tsx`, `sheet-container.tsx`, a test for each, and `index.ts`. Modify `components/form-renderer/` and its test.

**Interfaces:**

- Consumes: `FormRenderer` (Tasks 6a to 6c); `frontend-ui` `card`, `dialog`, `sheet`.
- Produces:
  - `interface FormContainerProps { formId: string; title?: string; description?: string; children: ReactNode; footer: ReactNode }`. `children` is the fields and the form-level error. `footer` is the submit and cancel buttons.
  - `type FormContainerComponent = React.ComponentType<FormContainerProps>`
  - `type FormContainer = { kind: 'plain' } | { kind: 'card' } | { kind: 'section' } | { kind: 'dialog'; open: boolean; onOpenChange(open: boolean): void } | { kind: 'sheet'; open: boolean; onOpenChange(open: boolean): void; side?: 'top' | 'right' | 'bottom' | 'left' } | { kind: 'custom'; component: FormContainerComponent }`
  - `FormRenderer` gains `container?: FormContainer` (default `{ kind: 'plain' }`), `title?: string`, `description?: string`.

`FormRenderer` stays container-agnostic: it builds the fields, the error and the buttons, and hands them to the chosen container. The `<form>` element carries an `id` and the submit button uses the `form` attribute, so the buttons can sit in a dialog or sheet footer outside the `<form>` element without breaking submit. Closing a dialog or sheet is the caller's job (`onOpenChange(false)` after `onSubmit` resolves). An unsaved-changes guard on close is out of scope.

- [ ] **Step 1: Write the failing tests:**
  - `plain renders the fields and buttons with no surrounding chrome`.
  - `card renders the title as a heading and the description beneath it`.
  - `section is a labelled region named by its title`.
  - `dialog is named by its title and described by its description` (role `dialog`, accessible name and description).
  - `dialog and sheet call onOpenChange(false) on Escape`.
  - `submitting from a button in the dialog footer submits the form` (the button is outside the `<form>` element).
  - `pressing Enter in a field submits the form in every container`.
  - `a custom container receives the title, description, fields and footer`.
  - `a dialog that is closed renders no fields`.
- [ ] **Step 2: Run** `pnpm --filter @synapcity/frontend-forms test containers` → FAIL.
- [ ] **Step 3: Implement** the containers over the primitives. Dialog and sheet get no `z-index`. A button's `form` attribute was checked in jsdom 30.1.2, the repo's React test environment: the button resolves its form, a click submits it, and an unrelated button does not.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(forms): add form containers`.

### Task 8: Stories and a consumer proof

**Files:** Create `src/testing/index.ts`, `src/testing/fixture-form.ts`, `src/testing/form-test-helpers.tsx`, `src/testing/form-test-helpers.test.tsx`, `src/components/form-renderer/form-renderer.stories.tsx`. Modify `apps/storybook/.storybook/main.ts` (glob for the new package, following M5.3) and `package.json` (`./testing` export).

**Interfaces:** Produces `fixtureForm: FormDefinition` and the Zod object schema it is built from (a generic form: text name, number scale, switch, select, and a note field shown when the switch is on, in one declared group; no product vocabulary). Also produces the test helpers `renderForm(definition, options?)`, `fillField(label: string, value: string): Promise<void>`, `submitForm(): Promise<void>` and `expectFieldError(label: string, message: string): void`. Only tests, stories and dev hosts import the `./testing` entry. Testing Library is declared as a peer of the package for this entry; the repo already uses it, so no new dependency enters the lockfile.

- [ ] **Step 1: Write the stories:** default, with initial values, with a field-level error, with a conditional field, submitting, and rejected submit; each with a play function and the a11y addon enabled. Add one story each for the card, section, dialog and sheet containers, one with a group, and one for each built-in renderer showing its invalid and disabled states. Test the helpers with the fixture form: `fillField` then `submitForm` yields the typed values, and `expectFieldError` fails when the message is absent.
- [ ] **Step 2: Run** `pnpm test:storybook` → stories discovered and passing.
- [ ] **Step 3: Commit** `feat(forms): add stories and a fixture form`.

### Task 9: Documentation and verification

**Files:** Modify `packages/frontend/forms/README.md`, `docs/architecture/workspace-conventions.md` (inventory row), `docs/architecture/reorganization-ownership-map.md`, `docs/architecture/decisions/README.md`, `.agents/task-scope.md`. Create the ADR from decision D1 once the owner approves it.

- [ ] **Step 1:** Document the public surface, the field-state semantics (D3), the client-only limit (D4), and the deferred list. Add three short guides: when to use the engine and when to keep a native-action form (D4); how a feature registers its own `custom:*` renderers once, through `FieldRendererProvider`'s `extend`; and how to map between a domain value and a form value by wrapping `initialValues` and `onSubmit` in two small mapping functions.
- [ ] **Step 2: Run** `pnpm verify` → all checks pass. `pnpm deps` (Knip) and `pnpm boundaries` both passed for the package with no consumer after Tasks 1 to 4; run them again once the components exist, and settle anything they report with the registration pattern from Part A, not by ignoring it.
- [ ] **Step 3:** Report what ran, what did not run, and what the tests do not cover. A manual keyboard and screen-reader pass on the story form is not covered by the automated checks.
- [ ] **Step 4: Commit** `docs(forms): document the form engine`.

### Task 10: Schema-only forms

Can be built any time after Task 1; it needs no React Hook Form. Task 10 runs after Task 8 only so the stories can show it.

**Files:** Create `utils/define-form-from-schema/` (source, test and `index.ts`). Modify `utils/index.ts`, `src/components/form-renderer/form-renderer.stories.tsx`.

**Interfaces:**

- Consumes: `defineForm`, `describeSchemaField`, `FieldConfig` (Task 1).
- Produces: `defineFormFromSchema<TSchema extends z.ZodObject>(input: { schema: TSchema; labels: Readonly<Record<Extract<keyof z.infer<TSchema>, string>, string>>; fields?: Readonly<Partial<Record<Extract<keyof z.infer<TSchema>, string>, FieldOverride>>>; groups?: readonly FieldGroup[]; rules?: readonly FormRule<Extract<keyof z.infer<TSchema>, string>>[]; exclude?: readonly Extract<keyof z.infer<TSchema>, string>[] }): FormDefinition<TSchema>`, where `FieldOverride` is a field's properties other than `name` and `label` (type, description, props, options, group, dependencies) plus an optional `label`.

The caller passes a schema and a label for each key, and gets a form. Labels are required because they are product copy; the package does not turn key names into labels. Inference, per `describeSchemaField`: `string` becomes `text` (`email` for `z.email()`; the legacy `z.string().email()` is not detectable at the top level, so it infers `text` and needs an override); `number` becomes `number`; `boolean` becomes `switch`; an enum becomes `select` with its values as options (an override supplies display labels); optional and nullable wrappers are unwrapped. Fields follow the schema's key order. Any other kind (arrays, objects, unions, dates) must be given an override or be listed in `exclude`, or `defineFormFromSchema` throws `FormDefinitionError` with code `'cannot-infer'` naming the key. Passwords are never inferred: a password field needs an override that supplies `autoComplete`.

- [ ] **Step 1: Write the failing tests:**
  - `infers text, email, number, switch and select from the schema`.
  - `unwraps optional and nullable keys and marks them not required`.
  - `a missing label is a compile error` (`// @ts-expect-error`).
  - `fields follow the schema's key order`.
  - `an override wins over inference` (type, options, description, group, dependencies).
  - `exclude drops a key from the form and from validation`.
  - `throws cannot-infer naming the key for an array, object, union or date key`.
  - `the result passes defineForm's own checks` (unknown references and cycles in overrides are reported as for an explicit form).
- [ ] **Step 2: Run** `pnpm --filter @synapcity/frontend-forms test define-form-from-schema` → FAIL.
- [ ] **Step 3: Implement** the function as a mapping from `describeSchemaField` results to `FieldConfig`, merged with overrides, then handed to `defineForm`.
- [ ] **Step 4: Run** the same command and `check-types` → PASS.
- [ ] **Step 5: Add one story** that builds a form from a plain schema and labels, then **commit** `feat(forms): build a form definition from a schema`.

## Functionality roadmap

Everything suggested for the engine, sorted by when it is built. The tasks above are the source of truth for the first two groups; this section keeps the rest from being lost. Each "eventually" item names what would start it, so none is built on speculation.

### Right now (Tasks 1 to 4, pure TypeScript)

| Item                                                                                      | Where                            |
| ----------------------------------------------------------------------------------------- | -------------------------------- |
| Typed definitions: field names and condition fields bound to schema keys                  | Task 1                           |
| Password fields must declare `autoComplete`                                               | Task 1                           |
| Groups: declaration and adjacency rules                                                   | Task 1                           |
| Required fields marked from the schema (`baseRequired`), not only by the `require` effect | Tasks 1 and 2                    |
| Schema-only forms: `defineFormFromSchema` with required labels                            | Task 10 (needs only Task 1)      |
| Generated acyclic definitions never loop                                                  | Task 2                           |
| Narrowed schema cached by visible and required fields                                     | Task 3                           |
| Errors name fields and types, never values                                                | Global constraints, Task 1 and 4 |

### Section by section (as each precondition lands, Tasks 5 to 9)

| Item                                                                                                                                                                                            | Where                           |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Number input emits `undefined`, never `NaN`; a short spike at the start of the task decides between `type="number"` and a text input with `inputMode="decimal"` (default stays `type="number"`) | Task 5                          |
| Groups rendered as fieldsets with legends                                                                                                                                                       | Task 6c                         |
| `initialValues` seeds once; `resetKey` reloads                                                                                                                                                  | Task 6c                         |
| Submit result for expected failures                                                                                                                                                             | Task 6b                         |
| Hand-laid-out forms: public `useFormBuilder`, `FormBuilderProvider` and `FieldView`                                                                                                             | Task 6c                         |
| Error summary with links to invalid fields; `aria-live` announcement                                                                                                                            | Task 6b, manual check in Task 9 |
| Structured form-level error (`title` and `message`), `errorDisplay`, `onInvalid`                                                                                                                | Task 6b                         |
| Re-render isolation per field                                                                                                                                                                   | Task 6c                         |
| Containers: plain, card, section, dialog, sheet, custom                                                                                                                                         | Task 7                          |
| Test helpers in `./testing`                                                                                                                                                                     | Task 8                          |
| Guidance to call `defineForm` at module scope, so broken definitions fail in tests and builds                                                                                                   | Task 9                          |

### Eventually (not scheduled)

| Item                                                                                                                                                                                                                                                                                                                                     | What would start it                                                                                                                                                                                            |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Field arrays (repeating rows)                                                                                                                                                                                                                                                                                                            | The first consumer with a repeating list                                                                                                                                                                       |
| Select options that depend on another field                                                                                                                                                                                                                                                                                              | A form that needs them                                                                                                                                                                                         |
| `onValuesChange(values, { valid })` for debounced autosave                                                                                                                                                                                                                                                                               | The M6 Settings design asks for autosave                                                                                                                                                                       |
| Unsaved-changes guard on dialog or sheet close and on page leave                                                                                                                                                                                                                                                                         | The dirty-state primitives that ADR-0015 assigns to the package                                                                                                                                                |
| Collapsible groups                                                                                                                                                                                                                                                                                                                       | A Settings screen with long groups                                                                                                                                                                             |
| Async validation: debounce, abort, timeout, keyed by `name`                                                                                                                                                                                                                                                                              | A consumer needing server-checked values; rewrite, do not port the prototype                                                                                                                                   |
| Wall-time benchmark for a 200-field form, then virtualization                                                                                                                                                                                                                                                                            | The benchmark misses a budget; virtualization only then                                                                                                                                                        |
| Incremental condition evaluation                                                                                                                                                                                                                                                                                                         | Profiling shows full re-evaluation is a cost                                                                                                                                                                   |
| Colour, date, slider, radio, multiselect, file and tags renderers                                                                                                                                                                                                                                                                        | The matching `frontend-ui` primitive exists (no radio group, colour picker, date picker or slider today)                                                                                                       |
| `hidden` field type                                                                                                                                                                                                                                                                                                                      | A hidden-value need                                                                                                                                                                                            |
| Per-field component override                                                                                                                                                                                                                                                                                                             | `custom:*` registry types prove insufficient                                                                                                                                                                   |
| Icons, tooltips, read-only fields                                                                                                                                                                                                                                                                                                        | A consumer asks                                                                                                                                                                                                |
| Multi-step and tab forms                                                                                                                                                                                                                                                                                                                 | A wizard consumer exists                                                                                                                                                                                       |
| Built-in toast routing, dismissible and warning-level form messages                                                                                                                                                                                                                                                                      | A consumer wants them; `onInvalid` is the hook until then                                                                                                                                                      |
| Move the definition types (`types/field-config.ts`, `types/form-definition.ts`) and the pure `utils/` units to a `domain-forms` package, so a server action can apply the same visibility-aware validation                                                                                                                               | A server operation must validate against the same form definition. Not before: today the engine is client-only (D4), and a definition carries presentation properties that would need splitting from its rules |
| Field value adapters (`format` and `parse`) for renderers whose value type differs from the schema's, such as a date string and a `Date`                                                                                                                                                                                                 | A date or colour renderer with a mismatched value type                                                                                                                                                         |
| Virtualization of large forms, if the benchmark demands it: use a maintained virtual list (`@tanstack/react-virtual` 3.14.22 is current on the registry) with measured row heights, not fixed heights; check focus-first-error, tab order and screen-reader order for fields that are not in the DOM; needs approval as a new dependency | The benchmark misses a budget                                                                                                                                                                                  |

### Added after the plan was approved

Items raised while Tasks 1 to 4 and the extraction were built. None is implemented unless the row says so.

| Item                                                                                             | State                                                                             | What would start it                                                                                     |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `useActionForm`: browser validation for forms that keep their server action                      | Implemented (extraction Part B); used by forgot password and register             | Done                                                                                                    |
| Files and repeated names (checkbox groups) in `useActionForm`; absent keys read as not sent      | Implemented                                                                       | Done                                                                                                    |
| Migrate login, update password, email change, delete account, name and avatar to `useActionForm` | Not started                                                                       | Each feature's own milestone (Auth and Account, M7); copy register's browser-versus-server parity tests |
| The avatar form's preview flow with `useActionForm`                                              | Not tried                                                                         | The avatar migration                                                                                    |
| Copy server errors into React Hook Form's error store                                            | Not started; no current form needs it (every server error names one field)        | A form with nested or array fields whose server errors React Hook Form must own                         |
| Reconcile `FormField` with the engine's field frame (Task 5), so there is one field presentation | Not started                                                                       | Task 5                                                                                                  |
| `FormRenderer` and `useActionForm` share one submit, refusal and focus path                      | Not started                                                                       | Task 6a (see its Consumes line)                                                                         |
| A popover container, and an inline expanding panel                                               | Not planned; Task 7's set is closed                                               | A consumer that needs one; until then the `custom` container                                            |
| An option for a dialog or sheet container to close itself after a successful submit              | Not planned; closing stays with the caller                                        | Repetition in Settings dialogs                                                                          |
| Move `react-hook-form` from 7.90.0 to 7.91.0                                                     | Not done; 7.91.0 fails the release-age policy until about 21:37 UTC on 2026-10-24 | The release-age policy accepting it                                                                     |
| Manual keyboard and screen-reader check of the forgot-password and register forms                | Not done; needs a person                                                          | The owner                                                                                               |

Repository issues found along the way, outside forms: the pre-push hook runs `test:e2e` before `build` and Playwright reuses a server already on port 8080 outside CI, so a push can test a stale build; the ownership map links to a `patches` folder that does not exist; two active ADRs are numbered 0011.

Dropped: the prototype's `useOptimizedRendering` stub, which per-field render isolation covers.

### Outside this package

- The theme form (D5): `features-settings`, M6.
- Migrating the Auth and Account forms: their own milestones, M7.
- A server-action result contract: a separate decision (ADR-0015).
- Draft persistence: the feature that owns the draft.
- Password reveal: the extraction (Part A), not the engine.

## Risks

- **Engine before consumers.** Settings (M6) is the first real consumer. If its editors do not fit declarative fields, this package is speculative. Mitigation: build Tasks 1 to 4 (pure, cheap) first and check them against the M6 Settings design before Tasks 5 to 9.
- **Part B is unwritten.** Tasks 6a to 6c depend on a binding not yet named. They are incomplete until B2 exists.
- **Cross-field rules live beside the schema, not on it.** A domain schema that already carries refinements (for example a password confirmation) cannot be passed as is; `defineForm` rejects it. Callers split the rule out into `rules`, which may mean two copies of one rule (domain and form). If that proves painful, the alternative is validating with the full schema on submit and using narrowing only for display, which loses hidden-field behavior. Owner decision.
- **Resolver major version.** The resolver documentation checked is the repository's current documentation; the installed `@hookform/resolvers` 6.0.0 was not read directly. Re-check its Zod 4 behavior against the installed version in Task 6a.
