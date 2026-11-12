# Domain layer audit (read-only)

Nothing in the repository was modified. The probes ran from the scratchpad.

## A. Executive assessment

**The structural refactor did what it set out to do and changed no behavior.**

- Public exports are identical. I compared all 33 cases from the split test files line by line; only blank lines differ.
- Every check passes, including the build.
- It fixed the one hard rule violation, identity's types-only `./types` entry.

**What the refactor itself cost:**

- It added about 30 folders and barrel files. The domain layer now has 101 `index.ts` files for about 4,900 lines of source, and 43 of them are one-line `export *` forwards.
- I put three untested units into folders, which goes beyond the convention's own text ("every unit with tests or stories").
- Renaming `values/` to `utils/` lost a name that told you these were form-control codecs.

None of that is harmful, but it's uniformity bought at a small cost in readability.

**The real issues are not structural.** The audit found one user-visible regression, three contract defects and two ownership problems. The refactor didn't cause them, but it doesn't fix them either:

|     | Finding                                                                                              | Severity |
| --- | ---------------------------------------------------------------------------------------------------- | -------- |
| F1  | New email registrants get a `null` display name (verified)                                           | **High** |
| F2  | Two `initialsOf` functions disagree, and identity's breaks on emoji (verified)                       | Medium   |
| F3  | The dashboard persist check silently drops unknown keys while documenting "never trimmed" (verified) | Medium   |
| F4  | The dashboard widget contract is written twice; the TS ⇄ Zod check only works in one direction       | Medium   |
| F5  | Persisted `dashboards` depends on provisional `prototypes`                                           | Medium   |
| F6  | `zod` is only a devDependency of `identity`, although its code imports it at runtime                 | Medium   |

## B. Package by package

### **identity** (629 lines of source, 1,103 of tests)

- _Role:_ credential, name and avatar rules, plus the display-user projection from claims.
- _Structure:_ good after the refactor.
- _Tests:_ strong, including the registration edge cases.
- _Problems:_
  - F1 and F2.
  - F6, the `zod` dependency (dates back to M4, `c3cd87a6`).
  - F7: some functions encode Supabase details (error codes, the storage path, the `user_metadata` and `identity_data` shapes). There's also a `user_metadata.profile_confirmed` flag that now overlaps the new `profiles.profile_completed_at` column: two sources of truth for one fact.
  - The transitional `signUpSchema`, `name` and `profileSchema` belong to the old display-name model. `profileSchema` has no consumers.

### **records** (581 / 830)

- _Role:_ the base record contract and text-safety rules. This is the best-modeled package: lengths counted in code points as Postgres does, shared limit vectors, and refusals rather than silent cleaning.
- _Problems:_
  - F12: `editableFieldsOf` re-declares `BaseRecordMetadata` by hand to avoid an import cycle through `types/` → `schemas/` → `utils/`.
  - F14: an empty tag gets Zod's default English message instead of a `RECORD_MESSAGES` entry.
  - F10: I over-applied unit folders here.

### **spaces** (79 / 263)

- Thin and correct.
- F8: a comment says the Space messages apply to the read schema, but `spaceSchema = baseRecordSchema` doesn't use them.
- `create`/`updateSpaceSchema` have no consumers yet; Space writes don't exist. That's fine as a contract waiting for the write path.

### **dashboards** (942 / 614)

- _Role:_ composition and widget operations, all immutable and well documented.
- _Problems:_ F3, F4 and F5.
- _Naming:_ `LinkSourceKind` is plural (`'spaces'`) while `RecordKind` is singular (`'space'`), for the same concept (F16).

### **prototypes** (881 / 633)

- Provisional, as its README says, and internally consistent.
- The problem is what it exports. `createId` and `entityRefSchema` are general-purpose, and they're what pulls `dashboards` into depending on it (F5).
- Many exports are used only inside the package; that's expected for a prototype.

### **preferences** (1,357 / 1,541)

- _Role:_ real policy (scope, consent, legacy import migration), with good tests.
- _Problems:_
  - F18: `utils/scope` holds four responsibilities: the scope map, the account document schema, the account reader, and the transfer-file format.
  - `isDefaultAccount` compares with `JSON.stringify`, so it depends on key order.
  - F17: `isPlainObject` also accepts `Date` and `Map`.
- Cookie strings and `Intl` formatting are presentation-ish. They stay in domain legitimately, because browser, server and docs all import them and domain is the only layer they all share.

### **time** (182 / 202)

- The schemas are correct and well documented.
- F9: `date-value` and `time-value` (`stepShowsSeconds`, the `<input>` value codecs) have one consumer, `frontend-forms`. They're UI codecs, not domain rules.
- A year below 100 returns `undefined`. That's a minor edge case.

### **grids** (278 / 205)

- Clean, pure layout math, with no correctness defects found.
- Pixel metrics and viewport breakpoints are presentational, but ADR-0014's table assigns them here.

## C. Cross-package findings

- **Dependency direction** is correct throughout: `time` ← `records` ← `spaces`/`prototypes` ← `dashboards`, with `grids` standalone and no cycles (boundaries R9 passes). The one weak edge is the persisted package depending on the provisional one (F5).
- **Duplication:**
  - `initialsOf` is accidental duplication with diverging behavior, so it should be consolidated (F2).
  - The dashboard type and schema duplication is a drift risk (F4).
  - Grids' `LayoutItem` is re-declared as a Zod schema in dashboards. That's acceptable but should come from one source, which F4 covers.
  - `isPlainObject`-style checks are written inline in several places. That's simpler than a shared helper, so leave it.
- **Provider vocabulary in domain** (F7) is a deliberate trade-off. `isUploadedAvatar` and `isRateLimited` are used from frontend and server code, and domain is the only layer both can import. The real risk is the `profile_confirmed` flag overlapping the new column.
- **Dead public exports go undetected.** Knip doesn't check entry-file exports (`includeEntryExports` isn't set). My scan was word-based, so treat its list as leads to confirm, not proof. The clearest candidates are `profileSchema`, `duplicateComposition`, `NEW_ACCOUNT_DAYS` and `isNewAccount`.

## D. Findings register

V = verified (probe or trace), C = credible risk, O = optional improvement.

| ID  | Sev      | Type                  | Where                                                                                 | Evidence                                                                                                                                                                                      | Fix                                                                                                                                                                                                                 | Migration impact                                               | Regression test?     |
| --- | -------- | --------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | -------------------- |
| F1  | **High** | V, regression         | `identity/src/utils/current-user/current-user.ts` (`profileFromClaims`)               | Probe: claims with only `first_name`/`last_name` give `name: null`. Path: `getCurrentUser` → header, welcome page, settings page. Caused by the registration change dropping `full_name`.     | Apply the decided fallback, `display_name ?? first_name` (owner confirms whether `last_name` is joined in), or read the `profiles` row.                                                                             | Must land before or with the register UI task.                 | Yes                  |
| F2  | Med      | V, defect + duplicate | `identity/.../initials/initials.ts` and `records/.../initials-of/initials-of.ts`      | Probe: identity gives `"\ud83dA"` (a lone surrogate) for "😀 Ada"; records gives `"AD"`. They also differ on "Ada" (A vs AD) and three-word names (AB vs AL).                                 | One grapheme-aware algorithm that accepts `[first, last]`; owner picks which package owns it.                                                                                                                       | `features-account` avatar initials change visibly.             | Yes                  |
| F3  | Med      | V, contract           | `dashboards/.../persistable/persistable.ts`, `schemas/composition`                    | Probe: extra keys at top level, in settings and in widgets → `ok: true`, extras dropped. Doc says "refused whole, never trimmed".                                                             | Persist with strict object schemas, or correct the doc if stripping is intended.                                                                                                                                    | Stricter persisting could refuse clients that send extra keys. | Yes                  |
| F4  | Med      | C, drift              | `dashboards/src/types/widget.ts`, `composition.ts`, `schemas/composition`             | `satisfies z.ZodType<DashboardComposition>` checks only the schema's output against the type. A new optional field added to the type but not the schema compiles, then gets stripped on read. | Infer the widget and composition types from the schema.                                                                                                                                                             | Type names stay the same.                                      | Type test            |
| F5  | Med      | C, boundary           | `dashboards` → `prototypes` (`createId`, `entityRefSchema`, `newRecord`, `putRecord`) | Prototypes are "free to change or go away" while Slice 4 persists dashboards.                                                                                                                 | Move `createId` to a stable owner and keep the prototype-widget creation clearly provisional, or record the edge as a bridge with a removal condition. Owner decision; the `EntityRef` name needs a glossary check. | Import moves                                                   | No                   |
| F6  | Med      | V, manifest           | `identity/package.json`                                                               | `zod` appears only in devDependencies, yet `schemas/*` import it at runtime. Since M4.                                                                                                        | Move it to dependencies.                                                                                                                                                                                            | None                                                           | No                   |
| F7  | Low–Med  | C, ownership          | `identity` utils for profile-confirmed, rate limit, avatar URL, provider image        | Supabase codes, storage path and metadata keys live in domain; the `profile_confirmed` flag duplicates `profile_completed_at`.                                                                | Decide on a single source of truth for profile completion (owner); document the deliberate provider knowledge.                                                                                                      | Depends on the decision                                        | When changed         |
| F8  | Low      | V, docs               | `spaces/.../space.ts`                                                                 | The comment contradicts `spaceSchema = baseRecordSchema`.                                                                                                                                     | Fix the comment, or apply the Space wording to reads.                                                                                                                                                               | None                                                           | No                   |
| F9  | Low      | C, ownership          | `time/src/utils/{date,time}-value`                                                    | Only consumer is `frontend-forms`; `stepShowsSeconds` is `<input>` behavior.                                                                                                                  | Move them to `frontend-forms`, with approval.                                                                                                                                                                       | One consumer                                                   | Tests move with them |
| F10 | Low      | V, self-inflicted     | `records` `record-kind/`, `code-point-length/`, `no-case-insensitive-duplicates/`     | Folders without tests, beyond the convention's wording.                                                                                                                                       | Optional: leave them. Not worth more churn on its own.                                                                                                                                                              | none                                                           | No                   |
| F11 | Low      | V, overhead           | 101 `index.ts`, 43 one-line forwards                                                  | R7 requires folder indexes, yet `export *` hides nothing.                                                                                                                                     | See section E.                                                                                                                                                                                                      | none                                                           | No                   |
| F12 | Low      | V, design             | `records/.../editable-fields-of.ts`                                                   | Hand-written duplicate of an inferred type, there to dodge an import cycle.                                                                                                                   | Export inferred types next to their schema.                                                                                                                                                                         | None                                                           | No                   |
| F13 | Low      | O                     | `no-case-insensitive-duplicates.ts`                                                   | Default `import z` used only as a type; a Zod refinement sits in `utils/`.                                                                                                                    | `import type { z }`; consider moving it into `schemas/base-field`.                                                                                                                                                  | none                                                           | No                   |
| F14 | Low      | C                     | `records/.../base-field.ts` (tags `.min(1)`)                                          | No message, so an empty tag shows Zod's default English text.                                                                                                                                 | Add a `RECORD_MESSAGES` entry.                                                                                                                                                                                      | Wording changes                                                | Yes                  |
| F15 | Low      | C, dead API           | entry exports in several packages                                                     | Knip blind spot.                                                                                                                                                                              | Prune confirmed dead exports, or enable `includeEntryExports` for domain.                                                                                                                                           | Possible removals                                              | No                   |
| F16 | Low      | O, naming             | `dashboards` `LinkSourceKind`                                                         | Plural form of the singular `RecordKind`.                                                                                                                                                     | Derive it from `RecordKind`, with a glossary check.                                                                                                                                                                 | Internal rename                                                | No                   |
| F17 | Low      | O                     | `preferences/.../is-plain-object.ts`                                                  | Accepts `Date` and `Map`.                                                                                                                                                                     | Rename it or tighten it with a prototype check.                                                                                                                                                                     | none                                                           | Yes if tightened     |
| F18 | Low      | O, cohesion           | `preferences/src/utils/scope/scope.ts`                                                | Four responsibilities; key-order-dependent equality.                                                                                                                                          | Split out a transfer module; compare structurally.                                                                                                                                                                  | none                                                           | Existing tests       |

## E. Convention evaluation

| Part                                                                           | Verdict                                               | Why                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------ | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Root-only `exports` per package                                                | **Keep**                                              | R5 actually enforces it. This is the real encapsulation boundary.                                                                                                                                                    |
| Tests beside the code                                                          | **Keep**                                              | They held up: the split moved every case intact.                                                                                                                                                                     |
| Kind folders at the package top (`types/`, `schemas/`, `utils/`, `constants/`) | **Keep as the default**                               | Packages are small, and kinds make them predictable.                                                                                                                                                                 |
| Inferred types in `types/`, away from their schemas                            | **Modify**                                            | Causes cycle pressure (F12). Let a schema file export its own `z.infer` types, and use `types/` only for hand-written types.                                                                                         |
| A folder per unit                                                              | **Make optional**                                     | Use one when a unit has its own test, story or several files, as the original text says. A small untested helper can be a flat file in its kind folder.                                                              |
| Unit-level `index.ts`                                                          | **Keep for now; revisit R7**                          | R7 requires them, but with `export *` they hide nothing. Their cost is one line and an extra hop when jumping to a definition. Amending R7 to allow importing the unit file directly is a separate tooling decision. |
| Grouping only by kind                                                          | **Make module grouping explicit for larger packages** | The conventions already allow "group by module". `preferences` (scope, transfer, look, formatting) and `dashboards` (composition, persistence) would be more cohesive by capability. Optional, later.                |

## F. Recommended target structure

Only where a change is justified. Everything else stays as it is.

```txt
identity/src/                      records/src/
  schemas/                           schemas/
    credentials/ (+ AuthFieldName)     base-field/
    name/        (+ NameInput)           base-field.ts  ← also exports BaseRecordMetadata etc. (z.infer)
    avatar/                          utils/
  types/identity-result.ts             editable-fields-of/ ← imports BaseRecordMetadata, no copy
  utils/
    current-user/  ← reads display_name ?? first_name (F1)
    initials/      ← one grapheme-aware, [first,last]-capable algorithm (F2)

dashboards/src/
  schemas/composition/   ← single source; types inferred (F4); strict variant for persisting (F3)
  types/                 ← only the hand-written types left
```

## G. Remediation sequence

Items within a step should land together.

1. **Correctness, ships with the register UI task:** F1 (with a test), F6.
2. **Contract defects:** F3, then F4 (same schema file, so do them together); then F2 (algorithm plus its consumer); then F14.
3. **Owner decisions before any code:** F5 (prototypes dependency and `EntityRef` naming), F7 (`profile_confirmed` versus `profile_completed_at`), F9 (moving the time input codecs).
4. **API hygiene:** F15 (prune dead exports, especially `profileSchema`, which conflicts with the new name model), F8, F16.
5. **Structure:** F12 with the "inferred types next to schemas" convention change; F13; optionally F18.
6. **Optional:** a decision on R7 and unit barrels, module grouping for `preferences` and `dashboards`, F17.

## H. Verification summary

| Command                                           | Result                                                                                                                                  |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm --filter <each domain pkg> exec vitest run` | Passed: dashboards 59, grids 19, identity 181, preferences 154, prototypes 67, records 259, spaces 61, time 56                          |
| `pnpm --filter <each> run check-types`            | 0 errors in all 8                                                                                                                       |
| `pnpm typecheck`                                  | 37/37 passed. The earlier `dev-fixtures` failure is fixed by your `21d625f3`.                                                           |
| `pnpm lint`                                       | 32/32 passed                                                                                                                            |
| `pnpm boundaries`                                 | 2,209 files, no violations                                                                                                              |
| `pnpm deps` (Knip)                                | Passed. Doesn't cover entry exports (F15).                                                                                              |
| `pnpm format:check`                               | Passed                                                                                                                                  |
| `pnpm build`                                      | Passed (4/4 Turbo tasks)                                                                                                                |
| Split-test comparison (at `5ea1aa72` vs HEAD)     | Identical apart from blank lines                                                                                                        |
| Behavior probes (scratchpad Vitest)               | F1, F2, F3 confirmed; also year < 100 → `undefined`, repeated inner spaces in names kept, a first name of only a no-break space refused |

**Not run:** e2e, Storybook, the database tests, and `pnpm verify` as a single run.

**Gaps:**

- F4 and F5 are design risks; nothing failed at runtime.
- The dead-export list comes from a word-based heuristic.
- F1 is verified at the domain function and traced to its callers, but not observed in a running app.
- Passing checks show that nothing broke. They don't show the design is right.

Want this as a page you can keep open while working through it? The next step I'd propose is step 1: F1 and F6.
