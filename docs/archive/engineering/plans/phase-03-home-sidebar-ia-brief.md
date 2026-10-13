# Phase 3 design brief: `/home` empty state and sidebar information architecture

**Status:** Proposed. Design direction the owner approved in conversation on 2026-10-05. Not canonical. The conflict with the overview that this brief used to record was resolved on 2026-10-05 by amending the overview (see below). Nothing here authorizes implementation.

**Owns:** the design direction for the `/home` empty state and the sidebar information architecture only. It does not own implementation sequence, tasks, status, or milestones; those stay with [mvp-phase-overview.md](mvp-phase-overview.md).

## Conflict with the overview: resolved

[mvp-phase-overview.md](mvp-phase-overview.md), under **Boundaries**, used to say the application frame has "no product navigation", because navigation items would presume answers about Global Home and Dashboards. This brief adds navigation items (Home, Documents, Dashboards) and a "Global" context switcher.

On 2026-10-05 the owner amended that boundary to allow this brief's provisional navigation: display copy only, disabled until each entry has a model. Both documents are still Proposed. The decisions the old boundary protected are still open and are not made here: Global Home's relationship to Dashboards, resumption and recency semantics, and the final name of contextual environments.

## What the approval covers and does not cover

- The owner approved the five visible strings below as **provisional display copy only**: "Home", "Documents", "Dashboards", "Global", "Create a Document".
- The strings, by themselves, create no routes, types, tables, packages, APIs, or component names. [docs/glossary.md](../../glossary.md) still governs their status. "Space" is a provisional handle and does not appear in visible copy.
- Placeholder route scaffolds now exist in `apps/web`: `/home`, `/home/documents`, `/home/dashboards` and `/home/spaces`, each with an `[id]` child, and `/` redirects to `/home` with a temporary 307. They are scaffolds, not naming decisions. The segment names stay working labels under the glossary, and the glossary's `Space` row records its own exception.
- Still open and not decided here: the first slice, Global Home's relationship to Dashboards, resumption/recency semantics, capture lifecycle, and the final name of contextual working environments (`PRODUCT.md` "Open product decisions").
- Shell mechanics stay as they are: panel, lock, resize, and outside-click/Escape dismissal are out of scope.

## 1. Summary

`/home` becomes an honest first-run orientation surface. The sidebar stops showing an AI-console template and shows the product's own model: a visible context, plus Documents and Dashboards. It is for the single founder-user returning to their own work, and it defines no recency, persistence, or Home semantics.

## 2. Primary user action

Understand in five seconds where they are (the Global context, Home) and that the next step is to create a Document.

## 3. Design direction

- **Color strategy:** Restrained, per [DESIGN.md](../../../DESIGN.md). Graphite only, no accent.
- **Scene:** one person at a desk, mid-focus, in ordinary room light, opening the app to continue their own work. Theme follows the OS.
- **Anchors:** Linear (quiet, dense chrome), Notion (sidebar context switcher and Home), Things 3 (calm empty states). These are references, not requirements.

## 4. Scope

Mid-fidelity: real component states and layout, with nothing wired. The primary action is visible but disabled. This is not a committed slice and defines no routes, schemas, or persistence.

## 5. Layout strategy

- **`/home`:** remove the three demo tiles and the `min-h-screen` slab. Use one centered column capped at about 65ch, sitting slightly above vertical center, with `h1`, one sentence, then the primary button. The `h1` belongs to `/home`, not to the collapsible top panel.
- **Sidebar, top to bottom:** context switcher in the header slot (replacing "Acme Inc"); three primary items (Home, Documents, Dashboards); Settings in the footer area (removing the header duplicate); the user row. Remove Playground, Models, Projects, Support, Feedback, and the raw "Content" and "User" strings.
- **Decision-point count:** the sidebar drops from about 14 visible options to 4.

## 6. Key states

| State                          | What the user sees                                                                  |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| Default                        | Empty state as above; Home is the active item with `aria-current="page"`            |
| Primary action                 | Disabled but focusable, with a tooltip explaining it is not available yet           |
| Documents and Dashboards items | Disabled with an explanatory tooltip, no `href`                                     |
| Context switcher open          | Menu with one entry, "Global", checked                                              |
| Sidebar closed, mobile Sheet   | Existing behavior, unchanged                                                        |
| Loading, error                 | Not applicable; there is no data yet                                                |

## 7. Interaction model

- The switcher opens a menu; Escape and outside-click already treat open menus as "inside".
- The disabled button and nav items stay keyboard-focusable and say why they are unavailable.
- Sidebar open/close, panel, lock, and resize behavior is not touched.

## 8. Content

- **Visible vocabulary (provisional):** Home, Documents, Dashboards, Global, Create a Document.
- **`h1`:** "Home"
- **Body:** "Create a Document to get started. Work you come back to will show up here."
- **Tooltip:** "Documents aren't available yet."

The body copy avoids "Continue", "Recent", and "Space" so it commits to no resumption semantics or contextual-environment noun.

## 9. Implementation notes

- Reuse existing components: `Empty`, `Button` (with `focusableWhenDisabled`), `DropdownMenu`, `SidebarMenu*`, `Tooltip`. Do not build parallel versions.
- Component and file names for the switcher and nav items are deferred to the implementation plan and must not be derived from the provisional labels.
- Suggested impeccable sequence: `onboard /home`, `layout` (sidebar structure and default), `harden` (disabled states, search form, `<nav>` landmark, `aria-current`), then `polish`.

## 10. Implementation status (2026-10-05)

What is in the code today, checked against the files and not against this brief's intent:

| Brief element | State |
| --- | --- |
| `/home` empty state: one `h1` "Home", one sentence, disabled but focusable "Create a Document" with a tooltip | Done (`EmptyHomeContent` in `@synapcity/frontend-uiontend-ui-core`) |
| The `h1` belongs to `/home`, not to the top panel | Done. The top panel titles itself with an `h2` |
| Demo navigation (Playground, Models, Projects, Support, Feedback) removed | Done. Archived at `refs/archive/p3-sidebar-demo-nav` |
| Context switcher in the sidebar header with one checked "Global" entry | Stub only. `SidebarContextSwitcher` is wired with placeholder items (`1.0`, `1.1`, `1.2`), not "Global" |
| Home, Documents, Dashboards entries (Home active with `aria-current="page"`, the others disabled with tooltips) | Not built. The sidebar body is an empty placeholder region |
| Settings in the footer area, plus the user row | Not built. The footer holds the appearance (theme) control. Settings and User menu are still disabled header actions |
| `<nav>` landmark | Pending. There is no landmark until the entries exist, so it does not announce navigation that is not there |
| Shell mechanics (panel, lock, resize, dismissal) untouched | Held |

The next implementation step is the three entries and the "Global" switcher entry. It also changes the browser test that currently asserts the sidebar is an empty placeholder.

## 11. Source evidence

The 17/40 critique of `apps/web/app/home/page.tsx` (2026-10-05) found: scaffold strings rendered as UI, a hidden-by-default sidebar that dismisses on content click, dead header controls and `#` links, no exposed `h1`, and no `<nav>` landmark. This brief addresses the first of those and part of the others, within the scope above.
