# Phase 3 decision brief: keyboard shortcuts and the shortcut menu

**Status:** Proposed. A draft for the owner to decide from. Not canonical. Nothing here authorizes implementation, and no choice below is made until the owner makes it.

**Owns:** the questions to settle before a shortcut menu or a modifier-hold helper is built: which shortcuts exist, where their list lives, how a user discovers them, and which keys are still open. It does not own implementation sequence, tasks, status, or milestones; those stay with [mvp-phase-overview.md](mvp-phase-overview.md). It extends the open shortcut and palette questions in [phase-03-root-header-palette-and-sidebar-slot-brief.md](phase-03-root-header-palette-and-sidebar-slot-brief.md). It does not decide a command registry, which stays an unresolved architecture question (see `docs/architecture/decisions/README.md`).

## 1. Why now

A shortcut menu is only as useful as the list behind it. Today the list is short and scattered across three places in code, one key is undecided, and two of the keys already in use are likely to clash with the rich-text editor. Settling the list first keeps a menu, tooltips and the command palette from drifting apart.

## 2. Shortcuts that exist today

| Action | Keys | Where it is defined | Notes |
| --- | --- | --- | --- |
| Open or close the command palette | `⌘K` / `Ctrl+K` | `apps/web/components/root/root-command-palette.tsx` | Ignores `Shift` and `Alt`. The header triggers show the key and set `aria-keyshortcuts`. |
| Toggle the sidebar | `⌘B` / `Ctrl+B` | `packages/ui/core/src/components/base/sidebar/constants.ts` (`SIDEBAR_KEYBOARD_SHORTCUT`) | Bound by `SidebarProvider`. Not shown anywhere in the interface. |
| Close the global panel, then the sidebar | `Escape` | `apps/web/components/root/root-shell.tsx` | One press closes the panel if it can be dismissed, otherwise the sidebar. An open palette closes first. |
| Return the hidden root header | none | brief, section 2 | Unresolved. It must not be the palette's key. |

## 3. Known risks

- **Editor clashes (likely, unverified):** `⌘K` and `⌘B` are common rich-text keys (insert link, bold). The palette brief already lists the `⌘K` clash as open; `⌘B` has the same exposure. This needs a rule, such as the editor keeping the key while it has focus, decided before the editor ships.
- **Browser clashes:** some browsers use `Ctrl+K` or `⌘K` for their own search or address bar. The page can override this, as it does today, but an override should be a deliberate choice.
- **Modifier-only gestures** (see section 5) collide with ordinary use, because `⌘` and `Ctrl` are held for copy, paste and modifier-click all day.

## 4. Decisions needed

| # | Decision | Options | Recommendation |
| --- | --- | --- | --- |
| 1 | Where the shortcut list lives | (a) one list in the app that the palette, tooltips and any menu read; (b) each feature keeps its own binding, as now | (a). It is a plain list, not a command registry, and does not decide that architecture. |
| 2 | How the user opens a shortcut menu | (a) `?` when focus is not in a text field, plus a "Keyboard shortcuts" item in the palette; (b) a header button; (c) a modifier combination | (a). `?` needs a visible way in, which the palette item provides. It must be ignored while a text field or the editor has focus. |
| 3 | Key that returns the hidden header | owner to choose; candidates need a check against editor and browser clashes first | Left open on purpose. The brief says it must differ from `⌘K`. |
| 4 | Whether `⌘B` stays as the sidebar key | keep; change; make it follow the editor rule from section 3 | Decide with the editor rule. Either way it should be shown in the menu and the sidebar toggle's tooltip. |
| 5 | A hint that appears while `⌘` or `Ctrl` is held | (a) none; (b) opt-in setting, off by default, with a delay of about one second; (c) on by default | (a) or (b). Not (c). |

### Why not (c) for the modifier hint

- The modifier is held during copy, paste and modifier-click, so a default-on hint would appear mid-task.
- Touch screens have no modifier to hold, so a touch user could never reach it.
- Holding a key is hard for some users with motor impairments, and a transient overlay gives screen-reader users little.
- Showing each key where the action already is (the palette's key hints, tooltips, the trigger's `⌘ K`) gives the same discovery with none of these costs.

## 5. What the menu would show

Only shortcuts in section 2 that the owner confirms, grouped by area (Navigation, Panels, Appearance if a theme key is ever added). Each row shows the action and the platform's key (`⌘` on Apple platforms, `Ctrl` elsewhere, using the same check as the palette trigger). It opens as a dialog because it is a short, read-only reference the user dismisses; if the owner prefers a non-modal surface, that is a separate decision.

## 6. Still open, deliberately

- The reveal key for the hidden header (decision 3).
- The editor-versus-global-shortcut rule (section 3).
- Whether shortcuts become user-configurable, and where that setting would live.
- Whether the shared list later grows into a command registry.

## 7. Next safe step

When the owner has answered decisions 1 to 5, an implementation plan can be written against them. Until then the safest work is none; the existing shortcuts stay as they are.
