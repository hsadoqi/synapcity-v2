# ADR-0011: Resizable global panel in the authenticated shell

> **Placement amendment — 2026-10-23:** [ADR-0014](0014-multi-app-package-boundaries.md) supersedes the shared UI package as the long-term shell owner. One frontend/shells package will group cohesive shells and their local panel interactions; apps provide route and product composition. Panel persistence, keyboard behavior, focus, and responsive interaction remain in force. See the [ownership map](../reorganization-ownership-map.md) for the selected destinations. The original sections below preserve the decision history; conflicting placement statements or placement-related unresolved questions are superseded by this amendment. Source migration is not completed by this documentation change.

**Status:** Accepted
**Date:** 2026-10-17
**Deciders:** Repository owner (explicit approval of the implementation scope, dependency, and ADR)

## Context

`PRODUCT.md` adopts an application-level, vertically expanding, non-modal utility surface that reflows the current work and is resizable, dismissible, and lockable. "Global Panel" remains provisional terminology in `docs/glossary.md`.

The owner requested implementation in `feat-core-ui-routes`, using the archived `feat-theming-system` worktree as evidence, then approved the bounded implementation and dependency proposal. The current shell already belongs to `packages/frontend/ui`: `RootShell` selects public/authenticated variants and `SidebarShell` composes the authenticated header, sidebar, and scrolling work area. The historical `packages/ui/core` topology is not adopted.

## Decision

- Add `react-resizable-panels@4.14.5` to the existing shared UI package. Registry metadata verified on 2026-10-17 identifies 4.14.5 as latest and supports React/React DOM 18 or 19; this repository declares 19.3.0. No existing dependencies are upgraded. Future upgrades are separate work.
- Keep product-agnostic group/panel/separator wrappers in `components/ui/resizable`. Compose the authenticated utility surface in `blocks/root-shell/global-panel`, integrating it through the existing sidebar shell and header. Apps can supply a `globalPanel` React node; no route or account data enters the resizing primitive.
- Initially collapse the panel. First open is 30 percent of the group below the header. Panel and page each own scrolling; the existing sidebar remains alongside both. The public shell has no panel.
- Use mounted-session React state and refs, with no global store or persistence. Retain panel contents when collapsed, mark them inert and hidden from assistive technology, and restore focus to the toggle before hiding focused panel controls.
- Remember only completed user resizes of at least 15 percent. Retain the measured pixel height for reopening. Ignore intermediate drag sizes, completed drag-to-zero, and automatic viewport recomputations. Without a remembered size, use 30 percent. Resizing the group preserves the open panel's pixel size within available constraints.
- Close on outside primary pointer press or Escape when unlocked. The panel, its toggle, resize handle, portaled menus/dialogs/selects/popovers, and overlay backdrops are exempt from outside dismissal. An open interactive overlay receives Escape before the panel. A sidebar toggle is outside the panel and dismisses it when unlocked.
- A lock prevents outside/Escape dismissal. Resizing, the header toggle, and the explicit close control still work. Collapsing releases the lock. Each region has a four-rem minimum; the panel can collapse to zero. The approved header behavior below applies while locked.

### App header visibility amendment (owner approved, 2026-10-17)

The owner approved hiding the app header while the open global panel is locked, with an explicit reveal button rather than hover behavior. The lock continues to prevent outside/Escape dismissal; it also establishes the compact shell layout below.

- Closed or unlocked panel: app header is visible normally.
- Locking the panel: app header is hidden and removed from layout and keyboard navigation. It stays mounted, preserving its component state.
- A `Show app header` / `Hide app header` button remains in the panel toolbar beside lock and close. It works with pointer, touch, and keyboard. Explicit reveal persists for that lock session until hidden again; unlocking or collapsing resets it.
- Hiding or revealing the header preserves the panel's chosen pixel height within available constraints. The main work area receives or gives back the freed header space.
- Unlocking, explicitly closing, or dragging the panel shut restores the app header. Focus returns to the header's panel toggle only after the header is available again; a header control is never left focused inside the hidden header.
- No hover trigger, animation, new shortcut, or saved preference is introduced. The public shell remains unchanged.

## Scope

This decision governs the bounded resizing dependency, current shared-shell composition, in-memory behavior, and caller-owned content slot. It evaluates and adapts the archive's shell and collapsible-panel behavior without copying its directory tree or utility system.

## What this does NOT decide

- Final product terminology: "Global panel" is the working UI label for this implementation.
- Which utilities to provide, module taxonomy, extensibility, or a registry.
- Capture objects, their lifecycle, storage, durable identifiers, or schemas.
- Persistence of open state, lock, size, or content; the state ends on shell unmount.
- Document contextual sidebar architecture, additional sidebars, command palette, hover/scroll-driven header hiding, navigation taxonomy, or new package topology.

## Unresolved

Useful default utilities, content ownership, configuration, persistence, and final terminology need their own decisions. The empty state makes the present lack of utilities explicit.

## Governance boundary

The owner approves changes to these architecture boundaries, persistence, or adoption of archived utility behavior. Ordinary presentation and regression fixes stay within the shared UI's existing ownership.

## Integration expectations

Use existing Button components, semantic tokens, and `cn`. Native scroll containers avoid adopting the archive's ScrollArea integration. A deliberate, documented inline `overflow: hidden` override in the resizable wrapper replaces the library's inline `overflow: auto`; a class cannot override that library style. No app stylesheet or token changes are required.

## Verification expectations

Unit/component tests cover composition, hidden contents, controls, lock/dismissal, focus, and retained content using the real library with jsdom measurement/observer shims. Storybook browser interactions cover actual keyboard resizing, portaled Select/Escape, state retention, and independent scrolling. App E2E covers pointer resize, settled-size reopening, drag collapse, keyboard controls, dismissal, and narrow touch layout using the existing development fixture identity. That authenticated group is explicitly skipped in production-mode CI without a real identity; a green production suite alone does not prove it. No production authentication bypass is introduced.

The header amendment adds checks for the full lock/reveal/hide/unlock/close cycle, hidden-header tab/focus behavior, panel and main geometry, and header restoration after drag collapse. A running owner development server must be preserved; if it prevents an isolated app E2E run, report that gap separately from Storybook browser proof.

Run repository checks and report actual results separately from these expectations. Passing fixture-based tests does not prove live authentication, product usefulness, or persisted behavior.

## Reconsideration conditions

Real utility requirements need different composition or state ownership, the Document sidebar needs a justified shared primitive, persistence is explicitly selected, accessibility/browser evidence exposes limits, or the resizing library no longer supports the declared React version.

## Evidence

- Current requirement: `PRODUCT.md`, "Application-level utility surface".
- Preservation evaluation: `docs/engineering/preservation-policy.md`.
- Archived `apps/web/components/root/root-shell.tsx`, `root-global-panel/root-global-panel.tsx`, and `packages/ui/core/src/hooks/use-collapsible-panel/use-collapsible-panel.ts` in the owner-named archived worktree. Lessons retained: scope outside-click exemptions narrowly, remember completed user resizing rather than drag intermediates, keep bounded flex ancestors, and restore focus before collapse.
- [npm registry metadata](https://registry.npmjs.org/react-resizable-panels/latest), verified 2026-10-17; [upstream documentation](https://github.com/bvaughn/react-resizable-panels/blob/main/README.md); installed 4.14.5 TypeScript declarations for exact callbacks, units, imperative methods, and sizing behavior.
