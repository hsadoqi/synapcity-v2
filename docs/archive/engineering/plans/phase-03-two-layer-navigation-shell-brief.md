# Phase 3 design brief: two-layer navigation shell (global sidebar and space sidebar)

**Status:** Proposed. Design direction the owner described in conversation on 2026-10-06. Not canonical. Nothing here authorizes implementation, and the open decisions in section 7 are not made by this document.

**Owns:** the layout and responsibilities of a two-layer navigation shell only: a global offcanvas sidebar, a space-specific icon sidebar, and how the root header, Global panel and content header sit beside them. It does not own implementation sequence, tasks, status, or milestones; those stay with [mvp-phase-overview.md](mvp-phase-overview.md). It does not decide product terminology, which stays with [docs/glossary.md](../../glossary.md): "Space" is a provisional handle and every label here is a working label.

**Relationship to other briefs.** [phase-03-home-sidebar-ia-brief.md](phase-03-home-sidebar-ia-brief.md) owns the `/home` empty state and the contents of a single sidebar, and treats shell mechanics as out of scope. This brief changes the shell around that sidebar. If the owner approves it, the single-sidebar contents in that brief would split between the two layers below; this document does not edit that brief, and the owner decides how the two reconcile. [phase-03-root-header-palette-and-sidebar-slot-brief.md](phase-03-root-header-palette-and-sidebar-slot-brief.md) owns the palette, the header hide behavior and the `@sidebar` and `@header` slots, which this layout keeps.

## 1. Summary

The shell gets two navigation layers. A **global sidebar** (offcanvas, the behavior of today's sidebar) runs the full height of the screen and holds the very global things: every space and the global actions. Beside it, a **space sidebar** collapses to icons and shows only the current space: its documents, dashboards, settings and info. Creating a document or dashboard from the space sidebar makes it participate in that space by default. Icons and tooltips let the user tell which space they are in at a glance.

## 2. Layout

```
today                          proposed
┌──────────────────────────┐   ┌────────┬─────────────────────┐
│ root header (full width) │   │ global │ root header         │
├──────────────────────────┤   │ side-  ├─────────────────────┤
│ global panel             │   │ bar    │ global panel        │
├────────┬─────────────────┤   │ (off-  ├───┬─────────────────┤
│ side-  │ content header  │   │ canvas)│ s │ content header  │
│ bar    ├─────────────────┤   │        │ p ├─────────────────┤
│        │ page            │   │        │ a │ page            │
└────────┴─────────────────┘   └────────┴───┴─────────────────┘
                                        (space sidebar, icons)
```

The global sidebar runs the full height of the screen, and the root header sits to its right instead of spanning the whole width. The Global panel, the space sidebar and the content column sit under the root header, in that right-hand area.

## 3. Responsibilities

| Surface | Holds | Behavior |
| --- | --- | --- |
| Global sidebar | All spaces, global actions, global navigation | Offcanvas, the behavior of today's sidebar |
| Space sidebar | The current space's dashboards and documents, plus its settings and info | Collapses to icons; icon and tooltip identify the space and its items |
| Global panel | The application-level utilities PRODUCT.md already assigns it | Unchanged |
| Content header | Breadcrumbs by default; other content supplied per route | Unchanged, populated through the `@header` slot |

**Confirmed by the owner, 2026-10-06:** the surfaces split as in this table.

**Owner's description of Home (2026-10-06):** Home is the user's homepage and the entry point to everything, where they get a summary of all their content. This is the owner's description in conversation. It is not canonical and does not edit `PRODUCT.md`, and it does not settle Global Home's relationship to Dashboards, which stays an open product decision there. The `/home` page today is the first-run empty state from the Home sidebar IA brief, not that summary.

**Owner decision and correction (2026-10-06):** `/home` itself renders no space sidebar. The space sidebar appears only on nested routes, so nothing is defined for it on Home, and the global sidebar is the only sidebar available there. This replaces the earlier decision that the rail shows global entries on Home. Home is a plain homepage. The owner added that a Document, Dashboard or Space can also be created from it, as one place among others, not as where creation canonically happens.

## 4. Creation and relationships

- Creating a document or dashboard from the space sidebar makes it participate in that space by default.
- The relationship is a default and not a permanent binding: the user can change it later, and the same item can appear in other spaces. This follows PRODUCT.md ("Contextual participation is not ownership"; creation within a context may supply useful defaults).
- The owner expects other meaningful defaults to apply at creation. Which defaults exist is open (section 7).
- Removal, deletion and archive semantics stay on the open decisions list and do not block this layout.

## 5. What carries over from today

- The `@sidebar` slot becomes the space sidebar's content seam, and the `@header` slot keeps feeding the content header. Both stay provisional seams, not ADRs.
- The sidebar library already supports `offcanvas`, `icon` and `none` modes with a 3rem icon width, and its menu buttons already show tooltips when the sidebar is collapsed to icons.
- The context switcher's role moves: with a global list of spaces, the current switcher no longer lives inside the space sidebar. Its tile would show the current space's icon.
- The command palette stays root-mounted and keeps listing routes and actions.

## 6. What changes in the shell

- `RootShell` is today a header over a vertical resizable group. The proposed layout needs a left column and a right column, with the root header and Global panel in the right one. This is a restructure of the shell's frame, not only of its contents.
- **Decision (owner, 2026-10-06):** each sidebar gets its own `SidebarProvider`, which keeps their open states scoped. The provider is a plain context, so this needs no new state mechanism. Two things in the current provider would collide and need to be resolved in the implementation plan, most likely with small optional props on the provider:
  - It writes a fixed cookie name (`SIDEBAR_COOKIE_NAME`, `sidebar_state`), so two providers would overwrite each other's saved state.
  - Each provider registers a window-level `⌘/Ctrl+B` listener (`SIDEBAR_KEYBOARD_SHORTCUT`), so one keypress would toggle both. Which sidebar owns that key, or whether it moves, ties to the shortcut questions in [phase-03-keyboard-shortcuts-decision-brief.md](phase-03-keyboard-shortcuts-decision-brief.md).
  - The provider also renders its own layout wrapper, so how two providers nest or sit side by side in the new frame needs checking.
- **Decision (owner, 2026-10-06):** both sidebars push the page when they open; neither overlays it.
- **Decision (owner, 2026-10-06):** only one sidebar is open at a time. Opening one closes the other. The shared hook below is the natural owner of that rule, because it sees both states.
  - Reading to confirm: for the space sidebar, "open" means expanded to full width and "closed" means the icon rail, so the rail stays visible while the global sidebar is open. The global sidebar's closed state is fully hidden. Under this reading, opening the global sidebar collapses the space sidebar to its icons, and expanding the space sidebar closes the global one.
  - The existing rules that assume one sidebar need re-checking: the Escape cascade and focus restoration to the toggle. On mobile both are sheets, and the same exclusivity applies.
- **Decision (owner, 2026-10-06):** the root header still hides on `/home` routes for pointer devices, as the root header, palette and sidebar slot brief decides. It lives in the right-hand column, beside the full-height global sidebar. Opening the global sidebar by any means, including the keyboard shortcut, reveals the header and keeps it revealed while that sidebar is open, because the global sidebar's toggle lives on the header and the two are connected.
- **Decision, as a trial (owner, 2026-10-06):** an outside click closes an unlocked sidebar, and a lock keeps it open, the same rule the Global panel uses. This reverses the current rule that an outside click never closes the sidebar, which the owner has always disagreed with. The sidebar toggles, the header controls, the Global panel, the palette and the other sidebar count as "inside". The icon sidebar's closed state is its rail, so an outside click collapses it back to icons. Both sidebars push the page, so each outside click that closes one reflows the content; the owner wants to try it and revisit after using it.
- **Direction (owner, 2026-10-06):** sidebar state, persistence and shortcut ownership are managed by a shared hook that supplies each provider's props, and content continues to flow through slots and `children`, not through the hook. The provider's cookie write and `⌘/Ctrl+B` listener are hard-wired even in controlled mode, so the provider would gain small optional props (a cookie name that can be turned off, and a shortcut that can be changed or disabled) for the hook to set. Nothing in the repository reads the `sidebar_state` cookie today, so saved sidebar state does not survive a reload yet; where persistence lives (cookie or `localStorage`) is a storage choice and is open (section 7).
- Dismissal rules, focus restoration, the skip link and the header-height measurement all assume the current frame and must be re-checked.

## 7. Open decisions (unresolved)

- Which creation defaults apply beyond the space relationship (for example a default icon, view or template).
- How a space gets its icon, and whether users can change it (the owner has said they intend to allow it).
- The key that returns the hidden header (still the owner's choice; every other reveal trigger works without it).
- Whether this layout supersedes the single-sidebar contents in the Home sidebar IA brief, and how that brief is amended.
- Whether closing on an outside click stays after the trial, given that both sidebars push the page.
- Where sidebar state persists (cookie or `localStorage`), which is a storage choice reserved for the owner.
- The final name of spaces and the labels in the lists, which remain working labels.

## 8. Next safe step

Answer the open decisions in section 7 that block the frame (overlay or push, and the surface split). Then write an implementation plan for the shell restructure. Until then the current shell stays as it is.
