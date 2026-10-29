# Widget data and functional widgets (spec B)

**Status:** Blocked (2026-10-27) on the owner decisions in section 2. Not approved, not planned, not implemented.
**Date:** 2026-10-27
**Splits:** [Dashboard and Widget MVP](2026-10-27-dashboard-widgets-mvp-design.md) (superseded). Its page and composition half is [spec A](2026-10-27-dashboard-page-composition-design.md), which this spec depends on.
**Evidence:** the [MVP review](2026-10-27-dashboard-widgets-mvp-review.md), sections 3 and 4 (D1, D3).
**Governing:** `PRODUCT.md` (open decision "widget lifecycle and source/input model"); `docs/glossary.md` (Task, Goal and Habit are **Deferred**: "do not let them dictate the current schema or MVP"; "Note" is semantically contaminated); [`non-goals.md`](../../product/non-goals.md) (specialized Tasks, Goals and Habits are deferred product directions).

## 1. Question

The superseded spec proposed four interactive widgets: Task list, Agenda, Goal tracker and Habit tracker. They create and change their own data, so the open question is who owns that data and in what shape. Deciding it also decides part of the open source/input model and whether deferred capabilities enter the product.

## 2. Decisions this spec waits on

1. **Whether Task, Goal or Habit may enter the product now.** That would override the glossary's Deferred status. It is a product and terminology decision, and it comes first.
2. **D1, widget data ownership** (options in section 3).
3. **Widget lifecycle.** Spec A removes a widget by deleting it. Whether data outlives its widget, and how a person finds or deletes it, depends on D1.
4. **Durable names** for any new table or column (the glossary's naming process). The working names "widget data" and "records" are not acceptable as durable names: the glossary defines a Widget as an interface, and "record" is an unresolved umbrella term.

## 3. D1 options (from the review)

| Option                                                                                  | Ownership and schema                                                                                                                                                                                        | Reversibility                                                           | Cost                |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------- |
| **A1.** Owner-level JSON document of provisional records (the superseded spec's choice) | A new durable table becomes the owner of task, goal, habit and event content. Data outlives every Dashboard. Adopts shared records and the record-backed source model.                                      | Medium: promoting a kind means extracting it from every user's document | Low now, high later |
| **A2.** Per-Dashboard content inside the composition                                    | The Dashboard owns its content, honestly, since no other capability owns tasks yet. Cascades with the Dashboard, so there are no orphans. No reuse across Dashboards; a duplicated Dashboard becomes a fork | High                                                                    | Small port change   |
| **A3.** Per-instance rows keyed by Dashboard and widget                                 | Per-widget writes, but removing a widget from the JSON doesn't remove its row                                                                                                                               | Medium                                                                  | Medium              |
| **A4.** Typed tables per kind                                                           | Makes deferred capabilities product records, with their names and lifecycles                                                                                                                                | Low                                                                     | Highest             |
| **A5.** Defer                                                                           | No widget-owned data until decision 1 is made. Spec A ships query widgets only                                                                                                                              | n/a                                                                     | None                |

**The review recommends A5.** If interactive widgets are wanted before decision 1, it recommends A2, labelled as a preview and recorded as _not_ the Task/Goal/Habit decision. A1 needs an explicit override of the glossary's deferral and an ADR.

## 4. Work needed whichever option is chosen

These gaps from the review apply to any choice that keeps widget data:

- **Concurrency.** Conditional writes with a revision, as in ADR-0016. The browser adapter's merge by `updatedAt` must not be lost; a whole-document overwrite loses user content across tabs and devices.
- **Size and growth.** A cap, and a rule for the `activity` entries that task completion writes; today they are never pruned.
- **Functional gaps:**
  - tasks and events can't be deleted;
  - events have no end time and can't be edited, and every event renders as a "meeting";
  - habits hard-code Monday-first weeks (ignoring the `firstDayOfWeek` preference) and key days by local date, so they shift across timezones;
  - the goal tracker is two typed numbers.
- **Kinds involved.** The four widgets touch six provisional kinds: project, task, goal, habit, event and activity. A persisted document would carry keys for all ten, including `note`.
- **Honesty.** Until these are fixed, the widgets are demonstrations, and principle 16 requires them to say so.

## 5. Relationship to Quick Capture

The accepted first slice (`first-slice.md`) still has to decide what a captured "task to remember" becomes. Storing tasks inside widgets first would pre-empt that. Whatever D1 decides should be checked against the capture lifecycle before it is accepted.

## 6. Next step

The owner decides section 2, item 1. Then this spec is revised to a single chosen option, with its schema, ADR and phases. Until then, nothing in this spec is built.
