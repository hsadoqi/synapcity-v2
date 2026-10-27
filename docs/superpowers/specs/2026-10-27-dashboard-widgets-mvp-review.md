# Review: Dashboard and Widget MVP design

**Status:** Review record (report-only, 2026-10-27). Not a decision. The owner's decisions that followed are recorded in the [Dashboard page and composition design](2026-10-27-dashboard-page-composition-design.md), section 2.
**Reviewed:** [`2026-10-27-dashboard-widgets-mvp-design.md`](2026-10-27-dashboard-widgets-mvp-design.md) at commit `dcb58ca4`.
**Provenance:** an AI-assisted review session on 2026-10-27, saved here verbatim apart from removed teaching notes and repository-relative links. Findings describe the repository at `dcb58ca4`; later commits may change them.

**Verdict: it needs revision, and it should be split in two.** The Dashboard page and composition-persistence half is close to approvable once a few claims are fixed and an ADR is written. The widget-data and first-widget-set half rests on capabilities the glossary marks **Deferred**. It also skips three gates: an ADR-0013 amendment, the change to the first slice, and the persisted-schema approval.

**Where I looked.** The spec exists, identical, in two worktrees: `feat/create-records` and this review worktree, both at commit `dcb58ca4`. I reviewed it here.

**Checks I ran.**

- Unit tests for `domain-grids`, `domain-prototypes`, `domain-dashboards`, `features-dashboards` and `dev-fixtures`: **277 passed**, 0 failed.
- I read the installed `react-grid-layout@2.3.0` package and its README, all 18 dashboard stories and their storage, the dashboards migration, and every importer of the four packages.

**Checks I did not run:** `pnpm test:storybook` (axe), `pnpm test:e2e`, `pnpm verify`, and any SQL/RLS test.

## 1. What is adopted, what is a label, and what is open

| Category                               | Items                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Adopted product requirements**       | Dashboards are spatial composition with product-defined Widgets. React Grid Layout is the layout direction. A Dashboard may own layout, placement, presentation metadata and per-widget configuration, but must not silently own a divergent copy of another capability's information (`PRODUCT.md`). Behaviourally honest claims, so nothing reads "saved" before the server confirms (principle 16). Examples do not become domain types (principle 17). Owner-only records and the route (ADR-0013). Persisted per-breakpoint layouts, the storage port and the page route (owner decisions in the 2026-10-24 canvas spec). |
| **Provisional terminology**            | Dashboard and Widget are strong working terms. Every `domain-prototypes` kind is provisional: metric, goal, habit, project, task, event, activity, note, link, asset. **Task / Goal / Habit are Deferred**, with the guardrail "do not let them dictate the current schema or MVP". "Note" is contaminated. `locked`, `pinned` and widget `status` are working names. "Record" is still an unresolved umbrella term.                                                                                                                                                                                                           |
| **Implementation recommendations**     | Keep the discriminated union with no registry. Store the composition as one JSON document. Add a server adapter behind the existing `DashboardStorage` port. Use Server Actions with `getCallerIdentity` and `logFailure`. Reuse the debounce scheduler.                                                                                                                                                                                                                                                                                                                                                                       |
| **Unresolved owner decisions**         | The widget lifecycle and source/input model. Whether deferred Task/Goal/Habit may enter the MVP. Where composition is stored (an ADR-0013 amendment). Changing the first slice. The archive and deletion semantics that widget `status` implies. Durable table and column names.                                                                                                                                                                                                                                                                                                                                               |
| **Prototype behaviour nobody adopted** | Records shared by all of an owner's Dashboards: the canvas spec's §7 lists this as a call made by Claude "owner to check", made for browser storage only. Also unadopted: the active → hidden → archived → delete widget lifecycle, record-backed `source` versus query widgets, completing a task writing an `activity`, Monday-first weeks, and every agenda event shown as a "meeting".                                                                                                                                                                                                                                     |

## 2. Checking the spec's "exists", "decided", "reusable" and "unchanged" claims

| Spec claim                                                                                             | What the repo shows                                                                                                                                                                                                                                                                | Verdict                                                                   |
| ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Dashboards are created from Quick Create (§1)                                                          | Commit `bf6280d3`                                                                                                                                                                                                                                                                  | ✅                                                                        |
| "Path decided; no page"                                                                                | True. But the index cards **already link** to `dashboardPathFor` ([collection-item.ts](../../../apps/web/src/features/dashboards/lib/collection-item/collection-item.ts)), so today they lead to a 404. Only the sidebar's `itemHref` is `null`.                                   | ⚠️ Item 7 is half done already, and the half that's done is a broken link |
| Strict zod schema: unique ids, layouts reference widgets, integer placements, every breakpoint present | Confirmed in [composition.ts](../../../packages/domain/dashboards/src/schemas/composition.ts). It does **not** require every active widget to have a layout entry, and it has no version field.                                                                                    | ✅ with gaps                                                              |
| `react-grid-layout` 2.3.0 is already installed                                                         | Confirmed in the lockfile and `features-dashboards`. The installed README says nothing about keyboard or ARIA, so keyboard support is all repo code.                                                                                                                               | ✅                                                                        |
| "Eight widget bodies"                                                                                  | 8 bodies. The package README still says "seven widget types".                                                                                                                                                                                                                      | ✅ (the README is stale)                                                  |
| "Works in Storybook against **browser storage** only"                                                  | 17 stories use the **in-memory** storage and 0 use `browserDashboardStorage`.                                                                                                                                                                                                      | ❌                                                                        |
| "No app consumer"                                                                                      | The only importers are `dev-fixtures`, stories and tests.                                                                                                                                                                                                                          | ✅                                                                        |
| Task list reads project and task                                                                       | It also **writes `activity`** on every completion (`toggleTask`), and nothing ever prunes it.                                                                                                                                                                                      | ⚠️                                                                        |
| Keyboard: arrows move, Shift+arrows resize; "keyboard parity is already there"                         | Edit mode only, after selecting with Space. There is no `aria-live` region anywhere in the package, no focus assertions, and no non-spatial alternative.                                                                                                                           | ❌ This is not parity                                                     |
| §3.2 "Unchanged"                                                                                       | `WIDGET_CATALOG` lists all 8 types and the schema accepts all 8. A four-widget MVP has to change the catalog.                                                                                                                                                                      | ❌                                                                        |
| §3.3(a) "same shape as `user_preferences`"                                                             | ADR-0010 is a **separate per-user table**, and it justifies last-write-wins only for "single-user, low-frequency settings". A column on `dashboards` also fires `set_updated_at` on every debounced drag.                                                                          | ⚠️ A loose precedent                                                      |
| §3.4(a) "exactly what `saveRecords` already models"                                                    | The port, yes. But the browser adapter does a **read, merge by `updatedAt`, write** to protect other tabs. The proposed `saveWidgetData(client, records)` overwrites the whole document, which drops that protection.                                                              | ❌ The server adapter would behave worse                                  |
| §3.4(a) "promoting [a kind] later is a migration of one document"                                      | It means one document **per user**, each holding all ten kinds, `note` included.                                                                                                                                                                                                   | ❌                                                                        |
| §3.4(c) "four provisional kinds"                                                                       | The four proposed widgets touch **six**: project, task, goal, habit, event, activity.                                                                                                                                                                                              | ❌                                                                        |
| §2.6 "a failed save says so and retries, using `save-scheduler`"                                       | It retries once automatically and then only calls `console.error`. The store has no save-status state.                                                                                                                                                                             | ❌ This is new work                                                       |
| §3.7 "each [widget] creates its own data in place"                                                     | True for creation. But tasks and events cannot be deleted, and events cannot be edited.                                                                                                                                                                                            | ⚠️                                                                        |
| Governing section cites ADR-0013 for "the dashboards record"                                           | ADR-0013 explicitly does **not** decide "dashboard widget and layout storage". Extra columns need the owner's approval. The `domain-dashboards` README and the accepted canvas spec both say "server storage still needs an ADR-0013 amendment". The new spec doesn't propose one. | ❌ The governance step is missing                                         |
| "Requested by the owner, who moved Dashboards ahead…"                                                  | Nothing in the repo records this. `first-slice.md` and `PRODUCT.md` still name Quick Capture as the accepted first slice, and `first-slice.md` excludes Dashboards.                                                                                                                | ❌ It needs to be recorded                                                |

## 3. The fifteen questions

1. **Who owns composition, and is JSON on `dashboards` the right envelope?** Composition is presentation, so it belongs to the Dashboard and JSON is right; see D2. The objection is to its location: on the record row, every drag bumps the row's `updated_at`, and ADR-0013's columns change without an amendment. A 1:1 composition table, created on first save, costs almost nothing. The spec's "second row to keep in step" objection is weak, because `load` already treats a missing composition as empty.
2. **Widget instance identity versus data identity.** The model is sound: a widget `id` (`wgt_…`) is an instance, and `source` is a record reference. But `duplicateWidget` and `duplicateComposition` quietly adopt "a duplicate is a second view, not a fork". That copy/fork meaning is still unresolved in the glossary. Under D1(a), deleting the last view leaves the data alive with no surface that can show it.
3. **Where widget data should live.** See D1. It is the real open product question, and the spec answers it with storage.
4. **Validation and schema evolution.** Validating on the server with zod is right. Missing pieces:
   - a version marker the zod preprocess can migrate (ADR-0010 uses `schema_version`);
   - a plan for `strictObject` layouts if a breakpoint is ever added (old documents will fail to parse);
   - a rule for stored widget types that leave the catalog.

   Size: 64 KB is fine for a composition. `widget_data` has **no stated cap**, and its `activity` table only grows. Any cap eventually turns into permanent write failures.

5. **RLS and owner authorisation.** The direction is right: owner-only policies, column grants, `getCallerIdentity`, `requireOwner(userId)`. What's missing:
   - **Zero-row updates.** PostgREST returns success when RLS filters out every row. A save to another user's Dashboard, or a deleted one, would "succeed". Each write must require exactly one affected row and map anything else to `ProviderFailure` (principle 16).
   - No client-supplied owner id.
   - A SQL test for `widget_data`, not only for the composition.
6. **Cross-Dashboard reuse.** The proposed MVP does **not** need it. No UI can pick an existing record. `duplicateComposition` has no feature consumer, and duplicating a widget only works within one Dashboard. The only widget that is truly cross-Dashboard is Agenda, because it is a query over _all_ events. "The same tasks could not appear on two Dashboards" is the spec's argument against option (b), but nothing in the MVP exercises it.
7. **Concurrency across tabs and devices.** Last-write-wins on the composition loses layout, which is tolerable. Last-write-wins on `widget_data` loses **user content**: a task added on a phone is overwritten when a stale laptop tab ticks a box. Add a `revision` column and a conditional update (`where revision = :expected`). On conflict, reload and say "changed elsewhere". It's cheap and removes the need to accept data loss.
8. **Debounce, optimism, failure, retries, unsaved changes.** There is:
   - no visible save state, and only one automatic retry;
   - a `pagehide` flush that calls an async Server Action, which is unreliable during unload, unlike synchronous `localStorage`;
   - two non-atomic writes per flush (records, then composition);
   - no `beforeunload` guard while unsaved.

   ADR-0014 requires a feature to define its reconciliation and failed-write handling. The spec says the store stays authoritative and the server is read once, which is not enough.

9. **Removal semantics and orphaned data.** Persisting `status: hidden | archived` adopts an archive lifecycle while "history, restoration, deletion, archival" is still an open product decision. The delete dialog says "the data it showed is kept". Under D1(a) nothing can show that data, so it's true but useless. Users would also believe it's gone, which is a privacy concern. Deleting a Dashboard cascades its composition but leaves `widget_data` behind.
10. **Responsive layouts and breakpoint migration.** There are three independently saved layouts, which is fine. But the breakpoint is resolved **once** from `window.innerWidth` and afterwards changes only through the toolbar, so resizing or rotating doesn't switch layouts. "Responsive layout" in §2.3 overstates this. Migration (changing breakpoints or column counts) needs the version marker from item 4.
11. **Keyboard, announcements, focus, touch, non-spatial use.** Missing:
    - announcements of position or size after a move;
    - focus tests, and a defined destination for focus after a widget is removed;
    - a single small `se` resize handle as the only touch target;
    - any non-spatial alternative, such as "Move earlier / later" in the widgets panel.

    Phase 3 treats this as polish. `first-slice.md` makes keyboard and screen-reader use a requirement of the slice, and the same bar should apply here.

12. **Are the four widgets functional products?** They are demonstrations.
    - Task list needs a hidden `project` record and writes `activity`; tasks can't be deleted.
    - Agenda events have no end time, no edit, no delete, and every one renders as a "meeting".
    - Habit tracker hard-codes Monday weeks, ignoring the `firstDayOfWeek` account preference, and keys days by local date, so it shifts when devices are in different timezones.
    - Goal tracker is two hand-typed numbers.

    The glossary defers all three capability names. Principle 17 applies, and principle 16 requires prototypes to say what they are.

13. **Does it complement or displace Quick Capture?** As written, it **displaces** it: Quick Capture drops to fourth, behind Documents. Changing the first slice is an approval gate, and nothing in the repo records it. Worse, D1(a) stores "tasks" before the capture lifecycle decides what a captured "task to remember" becomes (`first-slice.md` §1). That pre-empts the open "direct instance of another capability" question. There is a precedent to follow: in `non-goals.md`, notifications became a **separate track** without touching the first slice.
14. **Does it adopt unresolved terms or lifecycles too early?** Yes:
    - `widget_data` is a durable name built from a working label, and it implies Widgets own data, though the glossary defines them as interfaces;
    - `records jsonb` uses an unresolved umbrella term;
    - the persisted document has keys for all ten kinds, `note` and the deferred `task`/`goal`/`habit` included;
    - widget `status`, `pinned` and `locked` would be persisted;
    - D1 partly decides the open "source/input model", which the spec admits.
15. **Are the phases independently usable?** No.
    - Phase 1 persists composition but not records. A user could add a Task list whose tasks vanish on reload, unless the catalog is hidden, and then Phase 1 is an empty page that can't do anything.
    - Save feedback sits in Phase 2, but Phase 1 saves already fail.
    - Accessibility sits in Phase 3.

## 4. The three decisions, with alternatives

### D1: Widget data

| Option                                                                                                  | Schema / ownership consequence                                                                                                                                                                                                        | Reversibility                                                                                            | Migration cost                                                                                   |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **A1. Owner-level JSON (spec)**: `widget_data(user_id, records jsonb, schema_version)`                  | A new durable table. It becomes the **owner** of task, goal, habit and event content, under the name "widget data". Adopts shared records and the record-backed source model. Data outlives every Dashboard.                          | Medium. Promoting a kind means extracting it from every user's row and running both formats for a while. | Low now, high later. Activity growth and the contaminated keys become durable.                   |
| **A2. Per-Dashboard content inside the composition** (a `records` section with the Dashboard's widgets) | No new table. The Dashboard owns its content outright. That's honest, because no other capability owns tasks yet, so it isn't a _divergent copy_. Deleting the Dashboard cascades, so there are no orphans. No cross-Dashboard reuse. | High. Data lives in one document per Dashboard, and promotion is a scan.                                 | Small port change (`saveRecords` gains a `dashboardId`). Duplicating a Dashboard becomes a fork. |
| **A3. Per-instance rows**: `dashboard_widget_data(dashboard_id, widget_id, data)`                       | Per-widget writes, cascades on Dashboard delete. But a widget removed from the composition JSON doesn't cascade its row, so data is split across two stores.                                                                          | Medium                                                                                                   | Medium                                                                                           |
| **A4. Typed tables** (tasks, goals, habits, events)                                                     | Makes deferred capabilities product records, with naming and lifecycle decisions attached.                                                                                                                                            | Low                                                                                                      | Highest                                                                                          |
| **A5. Defer (recommended)**                                                                             | No widget-owned data in this MVP. The first widgets read records that are already adopted (D3 C2).                                                                                                                                    | n/a                                                                                                      | None                                                                                             |

**Recommendation: A5.** If the owner wants interactive widgets now anyway, use **A2**, label it as a preview, and write down that it is not the Task/Goal/Habit decision. Choose A1 only with an explicit owner decision overriding the glossary's deferral, and record it in an ADR.

### D2: Composition storage

| Option                                                                                                                                                                                                       | Consequence                                                                                                                                       | Reversibility / cost                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **B1. `dashboards.composition jsonb` (spec)**                                                                                                                                                                | Changes ADR-0013's columns. Bumps `updated_at` on every drag, so the record's "last changed" comes to mean layout fiddling. Needs a column grant. | Easy to reverse; cost near zero (no shipped data in `localStorage` or anywhere else) |
| **B2. 1:1 `dashboard_compositions`** (`dashboard_id` primary key and foreign key with cascade, `owner_id`, `composition`, `schema_version`, `revision`, `updated_at`), owner-only RLS, created on first save | ADR-0013's record stays untouched. The composition gets its own timestamp, and `revision` gives conflict detection.                               | Easy; same cost                                                                      |
| **B3. Normalised widget and placement tables**                                                                                                                                                               | Several writes per drag. The schema's cross-field invariants move into SQL.                                                                       | Hard; high                                                                           |
| **B4. Defer: stay on the accepted browser storage**                                                                                                                                                          | No schema change. Fails the MVP goal of finding it "on another browser".                                                                          | Trivial                                                                              |

**Recommendation: B2 with `revision`**, written up as a new ADR or an ADR-0013 amendment.

### D3: First widget set

| Option                                                                                      | Consequence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **C1. Task list, Agenda, Goal tracker, Habit tracker (spec)**                               | Brings in deferred capabilities, needs D1, and is demonstration-grade (§3 item 12).                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **C2. Query widgets over adopted records (recommended)**: Pinned items, Last opened, Spaces | Uses existing `server-data` reads, needs no data storage, and directly answers the MVP question "can a Dashboard present canonical information without becoming its owner?" (`mvp.md`). Keep them _query-shaped_: ADR-0013 item 8 says a widget that surfaces one specific document needs a relationship record. Label the second widget "Last opened", not "Recent" or "Continue", because relevance semantics are unresolved. Adding query members still extends the source model a little, so flag it. |
| **C3. Zero-input layout widgets only** (a heading, a date)                                  | Proves layout persistence and little else.                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **C4. Defer all of C1** until the Task/Goal/Habit and source-model decisions                | Can be combined with C2.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

## 5. Conclusions

**Blocking design issues**

1. No ADR, or ADR-0013 amendment, for composition storage, even though ADR-0013, the canvas spec and the `domain-dashboards` README all require one.
2. D1 and D3 adopt Task, Goal and Habit against the glossary's Deferred guardrail, and partly decide the open source/input model.
3. The change to the first slice and the move of Quick Capture are not recorded, and that change needs the owner's approval.
4. The server adapter as specified loses data across tabs and devices: it overwrites whole documents and drops the browser adapter's merge.
5. Save failures are invisible (console only), and a write that RLS filters to zero rows looks like a success. Both break principle 16.
6. Phase 1 can't be used on its own.

**Claims that need correcting:** "Storybook against browser storage"; "keyboard parity is already there"; "§3.2 Unchanged"; "four provisional kinds" (it's six, and the persisted document has ten); "exactly what `saveRecords` models"; "migration of one document"; "save-scheduler says so and retries"; "responsive layout" (it's set once at load); "same shape as `user_preferences`"; item 7 (the index cards already link to a missing page); and the unrecorded "requested by the owner".

**Decisions that need the owner**

- Whether the reprioritisation becomes a separate track, as notifications did, or an amendment to `first-slice.md` and `mvp.md`.
- Whether deferred Task/Goal/Habit may enter the MVP at all.
- D1, D2 and D3.
- Whether widget `hidden`/`archived` status may be persisted.
- Durable table and column names (the naming process).
- Whether silently losing data to a concurrent write is acceptable. It shouldn't need to be: detecting conflicts is routine engineering.

**Routine decisions to leave delegated:** debounce timing; how the actions and the adapter are structured; the `server-data/dashboards` module layout; the revision mechanism; error and save-status copy; live-region wording; switching breakpoint automatically from container width; the skeleton, not-found and error handling; test layout; deferring the nested route inside a Space (ADR-0013 item 9, stated explicitly).

**The smallest coherent Dashboard MVP I'd recommend** is one slice, usable on its own:

- The page at the ADR-0013 route: `requireOwner`, `notFound()`, loading and error states.
- Composition stored with option B2, including `revision` and checks that each write affected exactly one row.
- A visible save state: Saving, Saved, Not saved with Retry, and "changed elsewhere".
- Widgets limited to C2: Pinned, Last opened, Spaces.
- Add, move, resize and remove, where remove deletes the instance and offers undo. Don't persist hidden/archived yet.
- Keyboard moves with announcements, a list-order alternative, and axe checks.
- Breakpoints that follow the container width.
- The sidebar `itemHref` turned on.

Task, Agenda, Goal and Habit come after the owner has decided Task/Goal/Habit and the source model.

**Readiness: revise, and split it.**

- **Spec A, "Dashboard page and composition persistence":** fix the claims and write the ADR, and it's nearly ready.
- **Spec B, "Widget data and functional widgets":** blocked on owner decisions.
- Record the roadmap change separately, without touching the accepted first slice.
