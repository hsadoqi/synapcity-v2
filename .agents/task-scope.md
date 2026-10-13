# Task scope

## Active task: delay pointer reveal of the root header (2026-10-06)

- Goal and mode: implement the owner's request for a delay so the root header does not interrupt approaching the Home sidebar control. Mode: implementing.
- Exact destinations and budget: update `apps/web/hooks/use-root-header-reveal.ts`, `apps/web/hooks/use-root-header-reveal.test.tsx`, `apps/web/components/root/root-header.tsx`, `apps/web/components/root/root-header.test.tsx`, `apps/web/tests/app-shell.spec.ts`, and this record (6 files). Create/delete/move/rename, dependencies, public APIs, persisted state, route changes, commits, pushes, and external systems: 0. Disposable verification configuration and results may live in `/private/tmp`.
- Approvals held: the owner's direct request to add a reveal delay. Use a 500ms pointer dwell, cancelled on leaving; preserve immediate keyboard/focus and global-sidebar reveal, immediate retention of an already visible header, the existing 400ms hide delay, the small reveal targets, and taller panel toolbar.
- Preconditions: preserve every pre-existing change, including the previous header adjustments and concurrent route/component work. Reuse the owner's dev server on port 4000.
- Verification: deterministic hook/component tests including cancelled and restarted dwell, immediate focus/hold-open, and cleanup; real-browser header and sidebar interaction cases; scoped formatting/lint and web typecheck. Report broader gates not run and existing blockers.
- Recovery: revert only this task's hunks; no reset, stash, clean, or history changes.
- Stop conditions: a concurrent change to a scoped destination or a necessary mutation outside the manifest.

## Active task: reduce accidental root-header reveal over the Global panel (2026-10-06)

- Goal and mode: implement the owner's request for a header hover target less than half the Global panel toolbar height and a slightly taller panel toolbar. Mode: implementing.
- Exact destinations and budget: update `apps/web/components/root/root-header.tsx`, `apps/web/components/root/root-global-panel.tsx`, `apps/web/components/root/root-shell.tsx` (panel minimum height only), `apps/web/tests/app-shell.spec.ts`, and this record (5 files). The panel-height request is interpreted as increasing its toolbar from 56px to 64px, rather than changing its 30% opening size; the owner can steer this interpretation. Create/delete/move/rename, dependencies, public APIs, persistence, routes, commits, pushes, and external systems: 0. Disposable verification files may live in `/private/tmp`.
- Approvals held: the owner's direct request to reduce the listening area and slightly increase Global panel height. The logo target changes from 32px to 16px; the existing 6px top-edge strip, keyboard focus reveal, global-sidebar hold-open behavior, and hide delay are preserved.
- Preconditions: preserve concurrent route/component work and `.gitignore` changes. The owner's existing dev server on port 4000 is reused; no second Next dev server is started.
- Verification: browser regression covering panel-toolbar interaction without revealing the root header, existing header auto-hide browser cases, header/hook unit tests, scoped formatting/lint, web typecheck. Report broader checks not run.
- Recovery: revert only this task's hunks; do not reset, stash, clean, or change history.
- Stop conditions: concurrent edits to a scoped destination or a required change outside the listed files.

## Active task: draft the two-layer navigation shell implementation plan (2026-10-06)

- Goal and mode: write the implementation plan for the decided parts of [the two-layer navigation shell brief](../docs/engineering/plans/phase-03-two-layer-navigation-shell-brief.md), at the owner's "yes" to drafting it. Mode: planning artifact only. No implementation.
- Exact destinations and budget: create 1 file — `docs/engineering/plans/phase-03-two-layer-navigation-shell-implementation-plan.md`, status Proposed. Update 1 file — `.agents/task-scope.md`. Update existing plans and briefs, ADRs, the glossary, `PRODUCT.md`, code, issues, milestones, labels, dependencies, commits, pushes, and external systems: 0.
- System of record: the plan owns task order for the brief's decided parts only; the brief owns decisions. Header auto-hide, persistence, space icons, creation defaults, mobile space navigation and `⌘/Ctrl+B` ownership are listed under "Not in this plan" and stay open in their own homes.
- Approvals held: the owner's request to write the plan (2026-10-06). The execution method was not chosen: the plan recommends native execution and says so, and the owner confirms or changes it. The persistence choice was not made: the plan keeps state in memory.
- Preconditions: the plan's code was written against a read of the current sources (`sidebar-provider.tsx`, `sidebar.tsx`, `root-shell.tsx`, the outside-click, Escape and collapsible-panel hooks, `use-mobile.ts`, and the shell spec's test list).
- Verification: `pnpm docs:check` and Prettier on the plan and this record; a self-review against the brief. Not run: any code, test or build step, because the plan only describes them.
- Addendum (2026-10-06, owner reminder that the header hides on `/home` and that opening the global sidebar reveals it): update 1 more document, the two-layer navigation shell brief, limited to one recorded decision and one resolved open item; the plan gains Task 6, header auto-hide. Updates to other documents, code and external systems stay at 0.
- Recovery: delete the plan file and revert this record; no reset, stash, clean, or history changes.
- Stop conditions: a concurrent change to either destination, a needed edit to another file, or a conflict with an Accepted ADR.

## Active task: draft the two-layer navigation shell brief (2026-10-06)

- Goal and mode: write down the owner's confirmed layout idea (a full-height global offcanvas sidebar beside the root header, and a space-specific icon sidebar) as a Proposed design brief. Mode: planning artifact only. No implementation.
- Exact destinations and budget: create 1 file — `docs/engineering/plans/phase-03-two-layer-navigation-shell-brief.md`, status Proposed. Update 1 file — `.agents/task-scope.md`. Update existing plans (including the Home sidebar IA brief, the root header, palette and sidebar slot brief, and `mvp-phase-overview.md`), ADRs, the glossary, `PRODUCT.md`, code, issues, milestones, labels, dependencies, commits, pushes, and external systems: 0.
- System of record: the new brief owns the two-layer layout only. The IA brief keeps owning single-sidebar contents until the owner decides how they reconcile; the conflict is flagged in the new brief and not resolved here.
- Approvals held: the owner's description and confirmation of the layout in conversation (2026-10-06, "yes exactly!"), and the owner's earlier request to draft this in a brief. The manifest above is reported to the owner in the reply and can be corrected.
- Verification: `pnpm docs:check` and Prettier on the new file and this record; read-back. Not run: any code or test step.
- Recovery: delete the new file and revert this record; no reset, stash, clean, or history changes.
- Stop conditions: a concurrent change to either destination, a needed edit to another file, or a conflict with an Accepted ADR.

## Active task: content header moves into the content column and becomes an `@header` slot (2026-10-06)

- Goal and mode: implement, test first, the owner's direction: the content header is rendered at the top of the content column, directly below the Global panel and beside the sidebar (the sidebar keeps its full height), at the root header's height, and it is populated through a second provisional parallel-route slot, `@header`, whose default renders the breadcrumbs. It will not always be breadcrumbs, so routes and contexts supply their own content later.
- Exact destinations and budget: create 3 files — `apps/web/app/@header/default.tsx`, `apps/web/components/root/root-global-content.test.tsx`, and nothing else. Update 8 files — `apps/web/app/layout.tsx`, `apps/web/components/root/root-shell.tsx`, `apps/web/components/root/root-global-content.tsx`, `apps/web/components/home/home-content-header.tsx`, `apps/web/components/home/home-content-header.test.tsx`, `apps/web/app/home/(shell)/layout.tsx`, `apps/web/tests/app-shell.spec.ts` (the breadcrumb test only), and this record. Update 1 document — `docs/engineering/plans/phase-03-root-header-palette-and-sidebar-slot-brief.md`, limited to the content-header sentences (section 1, the decisions table row, and section 3.4) and one new open-decision bullet. Dependencies, public APIs, routes, ui-core, other tests, commits, pushes, and external systems: 0. Changes stay uncommitted.
- Approvals held: the owner's direction and answers in conversation (2026-10-06): position above the content and beside the sidebar; population through a second parallel-route slot. Like `@sidebar`, the slot is a provisional seam, not an ADR, and it creates no per-route header content. Not decided and left open: whether `/home` itself shows a bar once the root header can hide, per-route header content, the root-header auto-hide tasks (plan Tasks 5 to 7), and promoting either slot to an ADR.
- Verification: the new test red then green; web typecheck; web unit project; ESLint, Prettier, `pnpm deps`, `pnpm docs:check`; a browser check against the owner's dev server on port 4000 (position, full width of the content column, height, no empty bar on `/home`, a hard reload of a nested route). Not run: Playwright (it needs its own server and the project allows one `next dev`).
- Recovery: delete the 2 new component files, restore the edited files from Git (they are uncommitted for the owner), and revert the brief hunks; no reset, stash, clean, or history changes.
- Stop conditions: a 404 or missing slot after a hard reload (report, do not substitute another mechanism), a hydration or layout break in the shell, a concurrent change to a scoped file, or a need to edit another file.

## Active task: draft the keyboard shortcuts decision brief (2026-10-06)

- Goal and mode: implement the owner's "yes pls" to drafting a decision document for the shortcut menu and a modifier-hold helper idea. Mode: planning artifact only. No implementation.
- Exact destinations and budget: create 1 file — `docs/engineering/plans/phase-03-keyboard-shortcuts-decision-brief.md`, status Proposed. Update 1 file — `.agents/task-scope.md` (this record). Update existing plans (including the root header, palette and sidebar brief and `mvp-phase-overview.md`), ADRs, the glossary, code, issues, milestones, labels, dependencies, commits, pushes, and external systems: 0.
- System of record: the brief owns the questions for shortcuts only. The command registry and the header reveal key stay open in their existing homes. No second planning surface.
- Approvals held: the owner's request to draft the document (2026-10-06). The manifest above is reported to the owner in the reply; the owner can correct it, which triggers the reset protocol.
- Verification: `pnpm docs:check` and Prettier on the new file and this record; read-back of the created file. Not run: any code or test step.
- Recovery: delete the new file and revert this record; no reset, stash, clean, or history changes.
- Stop conditions: a concurrent change to either destination, a needed edit to another file, or a conflict with an Accepted ADR.

## Active task: palette dismissal exemption, platform-aware key hint, web test timeout (2026-10-06)

- Goal and mode: implement the owner's three approvals after the pre-polish report: (1) an unlocked global panel must not collapse when the owner opens or uses the command palette; (2) the palette trigger shows `Ctrl K` instead of `⌘ K` off Apple platforms; (3) the `web` Vitest project gets the same `testTimeout` as `ui-core`. Mode: implementing, test first.
- Exact destinations and budget: create 2 files — `apps/web/hooks/use-apple-platform.ts` and `apps/web/hooks/use-apple-platform.test.tsx`. Update 5 files — `apps/web/components/root/root-shell.tsx` (the outside-click ignore list only), `apps/web/components/root/root-navigation.tsx` (the trigger marker and key hint), `apps/web/components/root/root-header.test.tsx`, `vitest.config.ts` (one line, `web` project only), and this record. Public APIs, dependencies, routes, ui-core, other tests, commits, pushes, and external systems: 0. Earlier work is already committed by the owner; these changes stay uncommitted.
- Approvals held: the owner's yes to changing the outside-click rule so the palette dialog and its triggers are exempt (2026-10-06), the owner's yes to the platform-aware hint and to the `web` test timeout. The rest of the dismissal rule is unchanged: outside click and Escape still close an unlocked panel.
- Verification: new tests red then green; web typecheck; web unit project; ESLint, Prettier, `pnpm deps`; a manual browser check against the owner's dev server on port 4000 (open the panel, open the palette from the header and with the shortcut, and confirm the panel stays open). Not run: Playwright (it starts its own server and the project allows one `next dev`, which the owner's server holds) and Storybook unless it can run against the owner's server on port 6006.
- Addendum (2026-10-06, owner approved removing the duplicate context line): update 1 more file — `apps/web/app/home/(shell)/spaces/[spaceId]/layout.tsx`, which no longer prints "Space: {id}" because the breadcrumb header already names the space. It stays as a pass-through layout; nothing else referenced the line or `spaceId`. Recovery: restore the file from Git.
- Recovery: delete the 2 new files and revert the hunks above; no reset, stash, clean, or history changes.
- Stop conditions: the exemption selector matching more than the palette, a hydration mismatch from the platform check, a concurrent change to a scoped file, or a need to edit another file.

## Active task: impeccable init, map PRODUCT.md to the current product-record schema (2026-10-06)

- Goal and mode: implement the owner's `/impeccable init` request, limited by the owner's answer "Stamp + map only" to the stale-context finding (`product-schema-legacy`). Mode: documentation edit to a Canonical document, additive only.
- Exact destinations and budget: update 2 files — `PRODUCT.md` and this record. Create/delete/move/rename, other documents (`DESIGN.md`, glossary, ADRs, plans, `docs/product/*`), code, `.impeccable/config.json`, live-mode configuration, commits, pushes, and external systems: 0.
- Changes allowed in `PRODUCT.md`: the schema stamp comment; `## Platform` (`web`); and the sections the schema adds (Operating Context, Positioning, Brand Commitments, Evidence on Hand, Product Principles), each filled only with facts already in `PRODUCT.md`, in a referenced canonical document, or confirmed by the owner in this session. No existing sentence, status line, decision-scope line, or open decision is edited, reordered or removed.
- Approvals held: the owner's direct init request and the owner's choice of "Stamp + map only" (2026-10-06). Brand Commitments: the owner approved only the lowercase wordmark and the two-overlapping-squares mark from `apps/web/public/brand-assets`; the type families and the accent colour were not selected and are not recorded.
- Left undecided and written as such: final product positioning and initial-user framing (both on the Open product decisions list). Not run: the init interview for new product truth, DESIGN.md changes, live-mode setup, and the build-path question.
- Verification: `pnpm docs:check` and Prettier on the touched files; read-back of the diff to confirm it is purely additive. Not run: anything outside documentation.
- Recovery: `git diff PRODUCT.md` and revert only these hunks; no reset, stash, clean, or history changes.
- Stop conditions: any need to edit an existing sentence or resolve an open decision; a conflict with an Accepted ADR; a concurrent change to either file.

## Active task: post-session housekeeping (2026-10-06)

- Goal and mode: implement the owner's request to tackle housekeeping after the root-shell work: fix the Prettier warning in `apps/web/playwright.config.ts`; remove two unused dependency entries from `apps/web`; commit the new design brief; report the checks that ran.
- Exact destinations and budget: update `apps/web/playwright.config.ts` (formatting only), `apps/web/package.json` (delete the `cmdk` and `cn` lines only), `pnpm-lock.yaml` (delete the `apps/web` importer entries for `cmdk` and `cn` only), and `.agents/task-scope.md`. Commits: 1 — a `docs:` commit holding the brief plus only this session's two scope records. (The config's Prettier warning was already fixed by the owner before this task ran, so it needs no commit.) Create/delete/move/rename of files, new dependencies, dependency upgrades, public APIs, persisted schemas, pushes, and external systems: 0.
- System of record: the package manifests own dependency declarations; `apps/web` imports neither package, and ui-core is the only importer of `cmdk` and already declares `cn`. This record only bounds execution.
- Approvals held: direct owner request ("tackle the housekeeping first") after the owner was told the plan: remove the two unused entries, which touches the lockfile.
- Preconditions: another task is working in the same tree at the same time (an in-progress "improve Command stories" record, new `kbd`, `command` and `popover` directories, and edits to both `vitest.setup.ts` files). None of that is touched or committed here; the component, `ui-core/package.json`, `base/index.ts`, `vitest.setup.ts` and any other pre-existing changes stay uncommitted for their owner.
- Verification: Prettier on touched files, `pnpm docs:check`, `pnpm deps`, and a read-back of both manifests and the lockfile hunk. Not run here: `pnpm test:storybook`, `pnpm test:smoke` (Chromium cannot launch in this sandbox) and a root `pnpm verify`, because concurrent unfinished work would make the result meaningless.
- Recovery: restore only these hunks from `git diff`; no reset, stash, clean, or history changes.
- Stop conditions: a concurrent change to a scoped file, or a need to touch another file.

## Active task: improve Command stories (2026-10-06)

- Goal and mode: implement the owner's request to improve `command.stories.tsx`: useful fixture examples, usable dialogs, documented controls, and browser interaction coverage.
- Exact destinations and budget: update 2 files only — `.agents/task-scope.md` (this execution record) and `packages/ui/core/src/components/base/command/command.stories.tsx`. Create/delete/move/rename, dependencies, public APIs, persisted schemas, Git operations, external systems, and other planning artifacts: 0.
- System of record: ui-core owns its colocated component stories. This record bounds execution only and preserves all prior scopes.
- Approvals held: direct owner request to improve these stories. Keep all existing story exports; use only existing primitives and story-local fixture state. Component implementation, tests, neighboring Kbd stories, and application palette wiring remain out of scope.
- Preconditions: preserve the dirty worktree and untracked Command files; use installed Storybook 10.6.1 and cmdk 1.1.1 APIs, verified against first-party guidance. No product vocabulary, architectural ownership, or unresolved decision is adopted.
- Verification: focused formatting/lint, ui-core and Storybook typechecks, Command browser stories with existing accessibility gate, and root `pnpm verify`; report failures and checks not reached. Inspect the rendered stories where browser access permits.
- Recovery: restore only this task's story changes from `/private/tmp/synapcity-command-stories-baseline/command.stories.tsx` and remove this execution record, preserving concurrent edits. No reset, stash, clean, or history changes.
- Stop conditions: concurrent changes to either destination, an unresolved decision, or a repair requiring another repository file.

## Active task: root header, command palette and sidebar slot brief (2026-10-06)

- Goal and mode: write a design brief recording the owner's approved direction for (1) a root header that hides on `/home` routes for pointer devices and returns via a logo handle, a top-edge strip, keyboard focus, or a shortcut; (2) a root-mounted command palette replacing the disabled search input; (3) a content header with breadcrumbs in the home layout; (4) a provisional `@sidebar` slot seam at root. Mode: planning artifact only. No implementation.
- Exact destinations and budget: create 1 file — `docs/engineering/plans/phase-03-root-header-palette-and-sidebar-slot-brief.md`, status Proposed. Update 1 file — `.agents/task-scope.md`. Update existing plans (including `mvp-phase-overview.md` and `phase-03-home-sidebar-ia-brief.md`), ADRs, issues, milestones, labels, code, dependencies, public APIs, persisted schemas, commits, and external systems: 0.
- System of record: the brief owns the decisions and open decisions for these four concerns only. Implementation sequence stays with `mvp-phase-overview.md`; no second planning surface is created.
- Approvals held: owner approval in conversation (2026-10-06) of the design sections and this manifest; owner choice of the `@sidebar` slot as a provisional seam, recorded in the brief, with no ADR created; owner choice of header reveal triggers (logo handle, top-edge strip, focus, shortcut) and hide scope (all `/home/*` including `/home`). Not decided and recorded as open: the reveal shortcut key, palette contents beyond the four existing routes plus sidebar/panel/theme actions, whether the palette needs a new dependency (`cmdk` via the shadcn `command` component), auto-hide as a user setting, breadcrumb data source, the `⌘K` rich-text editor conflict, and whether the slot is later promoted to an ADR.
- Preconditions: the Next 16.3.6 bundled parallel-routes and `default.js` docs were read (slots are props of the parent layout; unmatched slots render `default.js` or 404 on reload; `children` needs a `default.js`). The ADR index lists routing architecture as out of scope with a stop condition; the owner chose to record the slot as a provisional seam rather than stop. The overview and the Phase 3 brief are both Proposed and amended on 2026-10-05 to allow provisional, display-only navigation.
- Verification: `pnpm docs:check` and Prettier on the new brief and this file; read-back of the created file; report anything not run.
- Recovery: delete the new brief and revert this record; no reset, stash, clean, or history changes.
- Stop conditions: a concurrent change to either destination, a needed edit to another file, or any conflict between this brief and an Accepted ADR.

## Active task: app-shell spec hydration race (2026-10-06)

- Goal and mode: implement the owner's request ("add the fix to the app-shell spec") for the intermittent failure of "the main area scrolls on its own, not the page". In 2 of 10 runs at 8 workers the test injected a 2000px node into a React-owned scroll area before hydration finished; React logged a hydration mismatch, discarded the node, and `scrollTop` stayed 0.
- Exact destinations and budget: update 2 files only — `.agents/task-scope.md` and `apps/web/tests/app-shell.spec.ts` (the `addTallContent` helper only). Create/delete/move/rename, dependencies, public APIs, persisted schemas, Git operations, external systems, and other planning artifacts: 0. The owner's separate edits to `apps/web/playwright.config.ts` (`workers: 2`) and `root-global-content.tsx` (`overflow-hidden`) are not touched.
- System of record: apps/web owns its Playwright spec. This record only bounds execution.
- Approvals held: direct owner request. No assertion, selector, timeout, test name, or other test is changed; all four `addTallContent` call sites (main, sidebar scroll, sidebar scrollbar, global panel) keep their current selectors.
- Approach: replace the injected DOM node with CSS generated content (`::after`) on the viewport's first child. Generated content is not a DOM node, so hydration cannot see or discard it, and a `<style>` appended to `<head>` is tolerated by React 19 hydration. This removes the race by construction and does not depend on guessing when hydration has finished.
- Verification: scoped prettier, eslint and typecheck by me; the 10-repeat run at default and at 8 workers, plus the full spec, by the owner or by me only if the owner approves an outside-sandbox browser run. The fix is not claimed verified until those runs pass.
- Recovery: restore this task's hunk from `/private/tmp/synapcity-global-panel-baseline/apps/web/tests/app-shell.spec.ts` plus the earlier string renames, or revert only the `addTallContent` helper; no reset, stash, clean, or history changes.
- Stop conditions: a concurrent change to a scoped file, a test that depends on the injected node being a real element, or a repair requiring another file.

## Active task: text scale floor — xs 12px, sm 13px (2026-10-06)

- Goal and mode: implement the owner's request to fix the 10.5px `text-xs` rendering found by the root-shell critique, by changing the derived scale multipliers only: `--text-xs` from `calc(var(--text-base-size) * 0.75)` to `* 0.857` (12px at the 14px base) and `--text-sm` from `* 0.875` to `* 0.929` (13px). The scale stays derived from `--text-base-size`, so the owner's planned text-size preference keeps working.
- Exact destinations and budget: update 2 files only — `.agents/task-scope.md` and `packages/ui/core/src/styles/globals.css` (the `--text-xs` and `--text-sm` lines only). Create/delete/move/rename, dependencies, public APIs, persisted schemas, Git operations, external systems, and other planning artifacts: 0.
- System of record: `globals.css` owns the derived text scale; `typography.css` owns `--text-base-size` and `--text-size-step` and is not touched. This record only bounds execution.
- Approvals held: direct owner request ("update the text") and the owner's choice of the xs 12px / sm 13px ladder. Not decided here and left open: the allowed range of the future text-size preference, whether to floor tokens, and whether `--header-height` should scale with text. Line-height tokens, `--text-base-size`, and every other step stay unchanged.
- Known blast radius: every `text-xs` (badge, toggle, kbd, sidebar labels, legend, empty-state description) grows 1.5px; every `text-sm` (including Button) grows 0.75px. Existing tests assert the base size and class names, not the multipliers.
- Verification: the style-foundation and font-token unit tests, Storybook browser/accessibility tests where the sandbox allows, a measured browser check of the three previously 10.5px elements against the owner's running server, scoped format/lint/typecheck, and root `pnpm verify`; report failures and gates not reached.
- Recovery: restore only this task's hunks from `/private/tmp/synapcity-global-panel-baseline/packages/ui/core/src/styles/globals.css`, preserving other work; no reset, stash, clean, or history changes.
- Stop conditions: a concurrent change to either destination, an unresolved decision, or a repair requiring another file.

## Active task: Global panel naming and lock accessibility (2026-10-06)

- Goal and mode: implement the owner's approved root-shell critique items: use one visible name, "Global panel", for the utility panel in place of "Top panel"; document the click-away dismissal rule where it is discoverable. The glossary term stays provisional and unchanged.
- Exact destinations and budget: update 9 files only — `.agents/task-scope.md`, `apps/web/components/root/root-global-panel.tsx`, `apps/web/components/root/root-shell.tsx`, `apps/web/components/root/root-global-panel.test.tsx`, `apps/web/components/root/root-header.test.tsx`, `apps/web/components/root/root-global-panel.stories.tsx`, `apps/web/tests/app-shell.spec.ts`, `apps/web/app/home/(shell)/layout.tsx` (one comment), and nothing else. Create/delete/move/rename, dependencies, public APIs, persisted schemas, Git operations, external systems, and other planning artifacts: 0. `DESIGN.md` and `docs/engineering/plans/phase-03-home-sidebar-ia-brief.md` also say "top panel" and are out of scope.
- System of record: apps/web owns shell copy and its tests. This record only bounds execution.
- Approvals held: direct owner approval of the name "Global panel" and of keeping outside-click dismissal (documented, not changed). No new terminology adoption, glossary change, or behavior change. Internal markers (`data-placeholder-region="top-panel"`, the test id `top-panel`) are not user-visible and stay as they are.
- Changes: visible heading, lock button labels, and resize-handle label read "Global panel" / "Lock global panel open" / "Unlock global panel" / "Resize global panel"; the section gains a visually hidden description stating the dismissal rule (closes on outside click or Escape unless locked), and the unlocked-state tooltip states it too. The visible "Locked" text stays `aria-hidden`: the pressed state already announces the lock, and exposing it would announce it twice. The lock control keeps its toggling label plus `pressed`.
- Verification: focused unit tests for the panel and header, the shell Playwright spec against the owner's running server on port 4000 where reachable, scoped format/lint/typecheck, and root `pnpm verify`; report failures and gates not reached.
- Recovery: restore only this task's hunks from `/private/tmp/synapcity-global-panel-baseline`, preserving other work; no reset, stash, clean, or history changes.
- Stop conditions: a concurrent change to a scoped file, an unresolved decision, or a repair requiring another file.

Earlier scopes below are retained as history and grant no additional mutation authority.

## Active task: Sheet and Button shared test setup repair (2026-10-05)

- Goal and mode: implement the owner's request to fix the reproduced Sheet unhandled error and Button failures caused by recursive computed-style reads.
- Exact destinations and budget: update 3 files only — `.agents/task-scope.md`, `vitest.setup.ts`, and `packages/ui/core/src/components/base/sheet/sheet.test.tsx`. Create/delete/move/rename, dependencies, public APIs, persisted schemas, Git operations, external systems, and other planning artifacts: 0.
- System of record: root Vitest setup owns shared jsdom browser shims; ui-core owns the Sheet regression tests. This record bounds execution only.
- Approvals held: direct owner test-repair request. Preserve all existing WIP, component behavior, assertions, accessibility enforcement, and dependency versions.
- Implementation: preserve the original computed-style reader per window, delegate to it without recursion, and exercise repeated setup plus ordinary/pseudo-element style reads.
- Verification: reproduce the failure; focused Sheet/Button tests; full unit suites; scoped formatting/lint and typecheck; root `pnpm verify`, reporting failures and gates not reached.
- Recovery: restore only this task's hunks against `/private/tmp/synapcity-sheet-test-repair-20261005`, preserving pre-existing changes; no reset/stash/clean/history changes.
- Stop conditions: a concurrent change to a scoped file, an unresolved decision, or a repair requiring another destination.

Earlier scopes below are retained as history and grant no additional mutation authority.

## Active task: Storybook context-switcher test repair (2026-10-05)

- Goal and mode: implement the owner's request to fix `pnpm test:storybook`, starting with the reproduced context-switcher accessibility failure after keyboard selection.
- Exact destinations and budget: update 2 files only — `.agents/task-scope.md` and `packages/ui/core/src/components/layouts/sidebar/sidebar-context-switcher.stories.tsx`. Create/delete/move/rename, dependency/API/schema changes, Git operations, external systems, and other planning artifacts: 0.
- System of record: ui-core owns colocated interaction stories; apps/storybook owns their browser/accessibility runner. This record only bounds execution.
- Approvals held: direct owner request to repair Storybook tests. Preserve component behavior, dependency pins, accessibility enforcement, and all pre-existing WIP.
- Implementation: wait for menu visibility and keyboard focus, assert ArrowUp wraps from the first item to the last, then wait for the selected menu to finish closing and focus to return before the accessibility scan; preserve callback assertions.
- Verification: focused Chromium stories, full `pnpm test:storybook`, scoped formatting/lint/typecheck, and root `pnpm verify`; report exact failures and unrun gates.
- Recovery: restore only this task's hunks against `/private/tmp/synapcity-storybook-repair-20261005`, preserving pre-existing work. No reset, stash, clean, or history changes.
- Stop conditions: a concurrent change to either destination, an unresolved decision, or a repair requiring another destination.

Earlier scopes below are retained as history and grant no additional mutation authority.

## Active task: root navigation clarify (2026-10-05)

- Goal and mode: implement the owner's `impeccable clarify apps/web/components/root/root-navigation.tsx` request; make unavailable search explicit and name the sidebar action by its current state.
- Exact destinations and budget: update 5 files only — `.agents/task-scope.md`, `apps/web/components/root/root-navigation.tsx`, `apps/web/components/root/root-header.test.tsx`, `apps/web/tests/app-shell.spec.ts`, `apps/web/tests/smoke.spec.ts`.
- System of record: apps/web owns application navigation copy; this scope records execution bounds only. Repository file creation, deletion, moves, renames, dependencies, public APIs, persisted schemas, Git history/branches/PRs, external systems, and other planning surfaces: 0.
- Approvals held: direct owner clarify request, explicit approval of this five-file scope record, and confirmation that overlapping edits are finished and must be preserved. No new product terminology, search architecture, or shell ownership decision.
- Preconditions: preserve existing WIP, routes, unavailable header actions, mobile search visibility, sidebar state, shell markers, and panel behavior. The two flagged panel overflow overrides already have deliberate-use comments and stay unchanged.
- Verification: existing header tests, formatting/lint/typecheck, browser shell/smoke checks and responsive visual inspection; run root `pnpm verify` and report exact failures and checks not run.
- Recovery: restore only this task's hunks using `/private/tmp/synapcity-navigation-clarify-baseline/approved-latest`, preserving pre-existing work; no reset, stash, clean, or history changes.
- Stop conditions: another concurrent edit to these destinations, an unresolved decision, or a repair requiring another file.

The scopes below are retained as history and grant this task no additional mutation authority.

## Active task: root shell keyboard hardening (2026-10-05)

- Goal and mode: implement the owner's `impeccable harden apps/web/components/root/root-shell.tsx` request, repairing the collapsed-sidebar keyboard regression from the critique.
- Exact destinations: `.agents/task-scope.md`; `apps/web/components/root/root-shell.tsx`; `apps/web/components/root/root-global-sidebar.tsx`; `apps/web/tests/app-shell.spec.ts`.
- Mutation manifest and budget: update these 4 repository files only. Repository create/delete/move/rename, dependencies, Git history/branches/PRs, external systems and other planning artifacts: 0.
- System of record: apps/web owns root-shell interaction composition. Use SidebarProvider's existing controlled API and the existing inert DOM prop; no new shared API, state technology, persistence or product decision.
- Approvals held: direct owner harden request following the demonstrated keyboard-focus finding. Preserve the collapsed default, placeholder regions, panel sizing/lock/dismissal, cookie behavior, mobile Sheet focus handling and independent scrolling.
- Verification: reproduce the regressions before implementation; focused and full real-app Chromium shell/smoke tests; scoped formatting/lint, web typecheck and unit tests, package boundaries; report every failure and unrun broader gate.
- Recovery: restore only this pass's hunks against `/private/tmp/root-harden-20261005-baseline`, preserving pre-existing work. No reset, stash, clean or history changes.
- Stop conditions: concurrent changes to a scoped file, unresolved decision, or repair requiring another repository destination. Disposable browser configuration, logs and evidence may be written under `/private/tmp`; preserve user-owned dev servers.

Earlier scopes below are retained as history and grant no additional mutation authority.

## Active task: root shell optimize, polish, animate (2026-10-05)

- Goal and mode: implement the owner's impeccable request on the existing root shell.
- Exact destinations: `.agents/task-scope.md`; `apps/web/components/root/root-shell.tsx`; `apps/web/components/root/root-global-content.tsx`; `apps/web/components/root/root-global-panel.tsx`; `apps/web/components/root/root-navigation.tsx`; `apps/web/components/root/root-global-panel.test.tsx`; `apps/web/components/root/root-global-panel.stories.tsx`; `apps/web/styles/globals.css`; `apps/web/tests/app-shell.spec.ts`; `apps/web/tests/smoke.spec.ts`.
- Mutation manifest and budget: update these 10 repository files only. Create, delete, move, rename, dependency changes, Git history/branches/PRs, external systems and planning surfaces beyond this task scope: 0.
- System of record: apps/web owns shell composition and app-specific motion; ui-core remains the owner of shared primitives. This scope owns execution bounds only, not product decisions or a mirrored backlog.
- Approvals held: direct owner request to optimize, polish and animate RootShell and related components; owner confirmed concurrent edits finished and approved preserving the collapsed-sidebar default.
- Preconditions: preserve existing WIP, scoped outside-click marker, neutral placeholder regions, 30%/remembered panel sizing, lock behavior, independent scroll areas, current routes and theme controls. No new public ui-core APIs, persisted data or product vocabulary.
- Verification: focused unit checks; live Chromium at desktop/tablet/mobile and light/dark/reduced motion; shell and smoke Playwright suites; formatting/lint/typecheck; root pnpm verify with exact failures and unrun checks reported.
- Recovery: restore only this task's hunks using the baseline in `/private/tmp/synapcity-root-polish-baseline`, preserving all pre-existing edits. Do not reset, stash, clean or alter history.
- Stop conditions: another concurrent edit, unresolved product/architecture choice, or repair requiring another destination. Repository-local browser screenshots and disposable test configuration may be written to `/private/tmp`; they are verification artifacts, not product or planning artifacts.

The previous task scope below is retained as history and does not grant this task additional mutation authority.

Fill this in before executing, and paste it into the pull request description or the issue. Anything not listed as an allowed mutation is forbidden until the human approves a revised scope. Read access may be broader when needed to establish context; mutation authority remains narrow.

```text
Goal:              Resolve previously reported Storybook and web smoke blockers, and restore the app-wide theme preference toggle.
Interaction mode:  implementing
In scope:          .agents/task-scope.md; apps/web/app/root-providers.tsx; apps/web/components/app-header.tsx; apps/web/components/app-header.test.tsx; apps/web/components/app-shell.tsx; apps/web/components/app-sidebar-navigation.tsx; apps/web/components/sidebar-navigation/nav-main.tsx; apps/web/components/sidebar-navigation/nav-projects.tsx; apps/web/components/sidebar-navigation/nav-secondary.tsx; apps/web/components/sidebar-navigation/nav-user.tsx; apps/web/components/sidebar-navigation/actions-dropdown-menu.tsx; apps/web/components/sidebar-navigation/dynamic-link-sidebar-group.tsx; apps/web/components/sidebar-navigation/types.ts; packages/ui/core/package.json; packages/ui/core/src/components/index.ts; packages/ui/core/src/components/layouts/index.ts; packages/ui/core/src/components/layouts/sidebar/index.ts; packages/ui/core/src/components/layouts/sidebar/sidebar-collapsible-menu-item.tsx; packages/ui/core/src/components/layouts/sidebar/sidebar-collapsible-menu-item.stories.tsx; packages/ui/core/src/components/layouts/sidebar/sidebar-collapsible-menu-item.test.tsx; packages/ui/core/src/components/layouts/sidebar/sidebar-action-menu.tsx; packages/ui/core/src/components/layouts/sidebar/sidebar-action-menu.stories.tsx; packages/ui/core/src/components/layouts/sidebar/sidebar-action-menu.test.tsx; packages/ui/core/src/components/layouts/sidebar/sidebar-link-group.tsx; packages/ui/core/src/components/layouts/sidebar/sidebar-link-group.stories.tsx; packages/ui/core/src/components/layouts/sidebar/sidebar-link-group.test.tsx; packages/ui/core/src/components/layouts/header/index.ts; packages/ui/core/src/components/layouts/header/icon-action-group.tsx; packages/ui/core/src/components/layouts/header/icon-action-group.stories.tsx; packages/ui/core/src/components/layouts/header/icon-action-group.test.tsx; packages/ui/core/src/components/layouts/panel/index.ts; packages/ui/core/src/components/layouts/panel/panel-toggle-button.tsx; packages/ui/core/src/components/layouts/panel/panel-toggle-button.stories.tsx; packages/ui/core/src/components/layouts/panel/panel-toggle-button.test.tsx; packages/ui/core/src/components/base/dropdown-menu/dropdown-menu.stories.tsx; packages/ui/core/src/components/base/local-date/local-date.stories.tsx; packages/ui/core/src/components/base/resizable/resizable.stories.tsx; packages/ui/core/src/components/base/sidebar/sidebar-menu.stories.tsx; apps/web/app/global-error.tsx
Out of scope:      moving route/action data or Next.js Link into ui-core; changing app shell state/persistence or routes; changing base primitives; Git history/branches and external systems
Exact destinations: the thirty-nine repository paths listed above, in hsadoqi/synapcity
Systems of record: @synapcity/ui-core owns reusable layout presentation; apps/web owns route/action data and supplies Next.js link rendering
Artifact budget:   39 repository-file updates maximum; no dependencies or generated artifacts
Approvals held:    direct user authorization to resolve all previously reported Storybook and web smoke blockers and restore the visible theme preference toggle
Approvals needed:  none for these bounded public layout APIs; broader navigation ownership changes remain out of scope
Preconditions:     preserve all current edits in the listed stories and global error boundary; reuse existing theme provider, preference control, and tests; keep ui-core APIs and base primitive behavior unchanged
Mutation manifest: correct story composition/style errors and the web error-boundary stylesheet import where required; compose the existing dark-mode preference control with the app's existing provider in root-providers; preserve current edits
Verification:      pnpm --filter @synapcity/storybook exec vitest run -c vitest.config.ts [the four listed story files]; pnpm --filter @synapcity/storybook test:storybook; pnpm --filter @synapcity/web test:smoke; pnpm --filter @synapcity/ui-core typecheck; pnpm --filter @synapcity/web typecheck; pnpm --filter @synapcity/storybook typecheck; pnpm exec eslint [changed files]; pnpm exec prettier --check [changed files]
Stop when:         another concurrent edit affects a listed file or a new failure requires changes outside the listed paths
Recovery:          restore only this task's own hunks, preserving all pre-existing user changes; no Git history or external state is mutated
```

## Cross-system mutation matrix

Complete every row that the task could plausibly touch. Use `read only` or `none` explicitly; a blank cell grants no authority.

| System / mutation class | Exact destination | Allowed action | Artifact budget | Preconditions | Verification | Recovery |
| --------------------------------------------- | ----------------- | -------------- | --------------: | ------------- | ------------ | -------- |
| Repository files | Paths listed in Goal scope | update | 39 | preserve existing edits; keep Next.js routing in apps/web | focused/full Storybook, web smoke, typecheck, lint, formatting | restore only own hunks |
| Git history / branches / pull requests | none | none | 0 | none | read-only branch check | none |
| GitHub issues / labels / milestones | none | none | 0 | none | none | none |
| GitHub Projects or other project metadata | none | none | 0 | none | none | none |
| Backlog, task, or planning tools | none | none | 0 | none | none | none |
| Dependencies / packages / generated artifacts | none | none | 0 | none | none | none |
| Other external or local operational state | none | none | 0 | none | none | none |

## Rules

- Authorization is artifact- and system-specific. Permission to edit repository documentation does not authorize changing issues, milestones, labels, project fields, a backlog, or another tool, and the reverse is also true.
- Use numeric budgets: for example, `issues: 9`, `milestones: 0`, `local task files: 0`. Do not interpret a qualitative goal such as "organize the work" as an unlimited budget.
- Name one system of record per concern. Do not mirror status, dependencies, milestones, or completion state into a second system unless that duplication and its reconciliation owner were explicitly approved.
- Exact destinations are preconditions, not hints. If a requested path, field, option, repository, project, or value is absent, stop and report it. Never choose the closest available substitute.
- The scope does not widen mid-task. If the manifest changes, a budget would be exceeded, or another mutation class becomes necessary, return to proposal and approval before continuing.
- A human objection, stop instruction, path correction, or scope correction immediately triggers the reset protocol in `.agents/README.md`.
- Record what was left undone and every check not run, not only what was completed.
