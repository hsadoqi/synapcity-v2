# @synapcity/domain-prototypes

Owns: the record kinds carried over from the responsive-grid prototype, and the pure rules that read and change them. Each kind extends the base record contract from [`domain-records`](../records/README.md) with its own fields.

**Status: provisional.** These kinds are not in the [glossary](../../../docs/glossary.md), have no database tables and are not product-approved records. The package name says so on purpose: import them as prototypes, and expect them to be renamed, merged into real record modules or removed. Approving any one of them as a product record is a separate decision.

Runtime: portable TypeScript. Runtime dependencies: `zod` and `@synapcity/domain-records`. Category rules: [domain README](../README.md) and [ADR-0014](../../../docs/architecture/decisions/0014-multi-app-package-boundaries.md).

## Kinds

| Kind       | Own fields                                                | Prototype field it replaces |
| ---------- | --------------------------------------------------------- | --------------------------- |
| `metric`   | `value`, `unit`, `note`                                   | none                        |
| `goal`     | `current`, `target`, `unit`                               | `title` is now `name`       |
| `habit`    | `completedDays` (YYYY-MM-DD)                              | `title` is now `name`       |
| `project`  | none                                                      | none                        |
| `task`     | `projectId`, `done`, `order`                              | `title` is now `name`       |
| `event`    | `startsAt` (ISO)                                          | `title`; epoch number       |
| `activity` | `occurredAt` (ISO), `subject?`                            | `label`; epoch number       |
| `note`     | `body`                                                    | `title`; own `updatedAt`    |
| `link`     | `url` (normalized http or https)                          | `title` is now `name`       |
| `asset`    | `slot`, `dataUrl` (base64 PNG, JPEG, WebP or GIF; no SVG) | none                        |

Every kind also has the ten base fields: `id`, `ownerId`, `name`, `description?`, `icon`, `tags`, `createdAt`, `updatedAt`, `pinnedAt`, `lastViewedAt`. Rules that change a record move its `updatedAt`. The prototype's `simulation` field is gone: mock live data lives in `dev-fixtures`, beside the records rather than on them.

## Public interface

`@synapcity/domain-prototypes` (root entry):

| Export                                                                                          | Meaning                                                                                  |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `metricSchema` … `assetSchema`, `prototypeRecordSchemas`, `PROTOTYPE_RECORD_KINDS`              | One schema per kind, and the kind list. Use them to validate records loaded from storage |
| `prototypeRecordsSchema`                                                                        | Zod contract for every table saved together; each record must sit under its own id       |
| `Metric` … `Asset`, `PrototypeRecordKind`, `PrototypeRecordKindMap`                             | The types the schemas produce                                                            |
| `EntityRef`, `entityRefSchema`                                                                  | `{ kind, id }`; the kind narrows what `getRecord` returns                                |
| `PrototypeRecords`, `emptyRecords`, `getRecord`, `putRecord`, `removeRecord`, `touchRecord`     | One table per kind keyed by id, and immutable reads and writes on it                     |
| `RecordContext`, `newRecord`, `DEFAULT_ICONS`, `createId`                                       | Base fields for a new record: prefixed id, owner, ISO timestamps, a Lucide icon per kind |
| `toggleTask`, `tasksForProject`                                                                 | Completing a task also records an activity about it                                      |
| `toggleHabitDay`, `habitWeek`, `HabitDay`                                                       | Habit days, and the Monday-first current week (day labels are the feature's copy)        |
| `updateNoteBody`, `ensureNote`, `addLink`, `normalizeLinkUrl`, `setSlotAsset`, `clearSlotAsset` | Notes, links (http and https only) and one image per vision-board slot                   |
| `eventsThisWeek`, `eventsOnDay`, `recentActivity`, `goalPercent`                                | Reads used by the calendar, agenda, feed and progress widgets                            |
| `dayKey`, `startOfWeek`, `weekDayStarts`, `weekdayIndex`, `isSameWeek`                          | Local-time calendar helpers; weeks start on Monday                                       |

## Scripts

`lint`, `check-types`, `test`, `test:coverage`. Tests sit beside each unit.
