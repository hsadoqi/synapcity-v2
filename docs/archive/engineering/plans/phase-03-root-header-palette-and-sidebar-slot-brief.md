# Phase 3 design brief: root header, command palette, content header and sidebar slot

**Status:** Proposed. Design direction the owner approved in conversation on 2026-10-06. Not canonical. Nothing here authorizes implementation.

**Owns:** the design direction for four concerns only: how the root header hides and returns on `/home` routes, a root-mounted command palette, a content header with breadcrumbs in the home layout, and a provisional seam for context-specific sidebar content. It does not own implementation sequence, tasks, status, or milestones; those stay with [mvp-phase-overview.md](mvp-phase-overview.md). It builds on [phase-03-home-sidebar-ia-brief.md](phase-03-home-sidebar-ia-brief.md), which is also Proposed.

## 1. Summary

The application frame today shows the root header on every route. The owner wants the working area on `/home` routes to be quieter: the root header hides, a small logo handle stays visible, and a content header sits at the top of the content column and is populated through a provisional `@header` slot, with breadcrumbs as its default. The disabled search input becomes a command palette that is available everywhere, including while the header is hidden. The sidebar keeps its frame at root and receives its context-specific content through a slot, so the content can change with the context while the frame and its state persist.

## 2. Decisions made

| Concern | Decision | Source |
| --- | --- | --- |
| Hide scope | The root header hides on every route under `/home`, including `/home` itself, on devices with `(hover: hover)`. It stays visible on other routes and on touch devices. | Owner, 2026-10-06 |
| Header return | The header returns on hover over the logo handle, hover over a thin top-edge strip, keyboard focus entering the header, or a shortcut. | Owner, 2026-10-06 |
| Palette placement | The palette is mounted at root so it works on every route and while the header is hidden. The header button replaces the disabled search input. | Owner, 2026-10-06 |
| Palette contents | Only what exists today: the four existing routes, toggling the sidebar and the global panel, and the theme. This mirrors the sidebar switcher's existing owner-directed exception. | Default stated by the assistant, not contradicted by the owner |
| Content header | It sits at the top of the content column, directly under the Global panel and beside the sidebar, at the root header's height. It is populated through a second provisional parallel-route slot, `@header`; its default shows breadcrumbs. The context switcher keeps indicating the current context. Amended from "in the home layout" by the owner, 2026-10-06. | Owner, 2026-10-06 |
| Sidebar content | The sidebar frame stays at root. Context-specific content arrives through a `@sidebar` parallel-route slot. Only the seam is built first: a neutral `default.tsx`. | Owner, 2026-10-06 |

## 3. Design

### 3.1 Shell structure

- The root layout renders `RootShell` with two inputs: `children` and a `sidebar` slot node. `SidebarProvider`, the frame, the resizable panels and the global panel stay at root, so their state survives navigation.
- The Next 16.3.6 bundled documentation states that slots are passed as props to the parent layout and do not affect the URL; that an unmatched slot renders its `default.js` (or a 404) after a full reload; and that `children` is an implicit slot that also needs a `default.js`. Soft navigation keeps each slot's active state. A `@sidebar/default.tsx` is therefore required, and the design must not rely on slot state being reset.
- Per-context sidebar content is out of this brief. It is added later as the owner defines what each context's sidebar should hold.

### 3.2 Root header hide and return

- The header is hidden when the route is under `/home`, the device matches `(hover: hover)`, and no return trigger is active. Elsewhere it stays visible.
- A logo handle always remains visible. The return triggers are those in section 2. The shortcut key is unresolved (section 6); it must not be the palette's shortcut.
- The header hides again after a short delay when the pointer leaves it. It never hides while keyboard focus is inside it or while a menu opened from it is open; the existing outside-click rules already treat portaled menus as inside.
- **Decision (owner, 2026-10-06), replacing the earlier overlay rule:** the revealed header pushes the content down and resizes it, and sliding away returns the space; it does not overlay. The header keeps its box when hidden, so `--header-height` does not change, and the Global panel keeps its pixel height while the header moves, so only the area below absorbs the change. Transitions use 150 to 250 ms and become instant under `prefers-reduced-motion`.
- The sidebar toggle, the global panel toggle and the skip link must stay reachable while the header is hidden: through keyboard focus entering the header, the shortcut, and the palette actions.

### 3.3 Command palette

- A `RootCommandPalette` mounts inside `RootShell` with its own open state, independent of header visibility. `⌘K` and `Ctrl+K` open it from anywhere. The header button is one more trigger and replaces the disabled search input.
- Initial contents are the four existing routes, toggling the sidebar and the global panel, and the theme. No general command registry is introduced; that architecture is not decided.
- On 2026-10-06 the owner added the shadcn `command` and `popover` components to ui-core, with the `cmdk` dependency at `^1.1.1` (registry evidence: latest tag, not deprecated, MIT, peers `react` and `react-dom` `^18 || ^19`, last published 2025-08-27). The palette is built on `command`, which exports `CommandDialog`. `breadcrumb` and `dialog` also exist. No `kbd` component is installed.
- Closing the palette returns focus to the element that opened it.

### 3.4 Content header

- It is rendered by `RootGlobalContent` at the top of the content column, from the `@header` parallel-route slot. It sits outside `<main>` and outside the scroll area, so it needs no sticky positioning, never scrolls away, and the skip link still lands on the page. The sidebar keeps its full height beside it.
- The slot is a provisional seam like `@sidebar`: it is not an ADR, and no per-route header content exists yet. `apps/web/app/@header/default.tsx` supplies the default, which renders breadcrumbs. Routes and contexts will supply other content later (the header is not always breadcrumbs), by adding `@header/...` pages.
- The default shows nothing on `/home` itself, because a single crumb would only repeat the context switcher; whether `/home` shows a bar once the root header can hide is open (section 6).
- Breadcrumbs come from a static route-to-label map using working labels only. Labels are display copy and are not adopted product vocabulary; `docs/glossary.md` treats the final names of contextual environments as unresolved. No data fetching is introduced.

## 4. Testing

- The shell Playwright spec waits for the global panel toggle in its `beforeEach`; that setup must reveal the header first on `/home`.
- New coverage: header hidden on `/home` for a pointer device; each return trigger; header not hidden under touch emulation; `⌘K` opening the palette while the header is hidden; focus return after the palette closes; breadcrumbs for nested routes; reduced motion.
- Component-level accessibility checks run through the existing Storybook and axe gates. Manual checks remain for focus visibility and keyboard behavior that automation cannot establish.

## 5. Out of scope

Per-context sidebar content; a command registry; palette actions beyond section 3.3; breadcrumb data fetching; any persisted preference; changes to the Global panel's behavior; changes to routes, schemas, or persistence.

## 6. Open decisions (unresolved)

- The shortcut that returns the hidden header.
- Whether `cmdk` should be declared only by ui-core, which is the only package that imports it. The owner's uncommitted change also lists `cmdk` and `cn` in `apps/web/package.json`, and `apps/web` imports neither. This is a dependency-boundary question, not a design one.
- Whether auto-hide is later offered as a user setting, which would be a persisted preference.
- The breadcrumb label source and wording for dynamic segments such as a space id.
- The `⌘K` and `Ctrl+K` conflict with rich-text editors, which commonly use it for links, once Documents exists.
- Whether `/home` itself shows a content header bar once the root header can hide.
- Whether the `@sidebar` and `@header` slots are later promoted to an ADR. The ADR index lists routing architecture as out of scope with a stop condition; the owner chose to record the slot here as a provisional seam, not to stop. This brief does not resolve that candidate.
- Whether the root header stays hidden on routes created later outside `/home`.

## 7. Authority notes

- The overview and the Phase 3 brief are both Proposed. Both were amended on 2026-10-05 to allow provisional navigation as display copy. The palette's route list and the breadcrumbs extend that provisional navigation, and they make no claim about Global Home's relationship to Dashboards or the final names of contextual environments.
- Direct owner instruction outranks documents in the hierarchy; the stop condition is surfaced here and not resolved silently.

## 8. Source evidence

- The root-shell critique of 2026-10-06 (26/40, later reconciled with browser evidence) found the search input unreachable by Tab and the header dominated by inert controls.
- The Next 16.3.6 documentation bundled with the installed package supports section 3.1.
