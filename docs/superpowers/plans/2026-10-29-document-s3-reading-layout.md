# Document S3: Reading layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** Proposed, 2026-10-29. Planning only. Nothing here is implemented, and the owner has not approved it.

**Goal:** Give the read-only Document page a considered reading layout (width, header block, metadata, honest content states, keyboard and theme behavior) while the document has no stored content and no editor.

**Architecture:** `DocumentView` keeps its composition: `ResourceFrame` with `ResourceHeader` and `RESOURCE_PANEL`, then one body column. The change is inside that column: a reading width that responds to the frame's container, a description lead, a details block, and one body region that states plainly why content is not shown. That body region is the single seam a later Lexical integration replaces; nothing of that integration is built.

**Tech Stack:** React in `apps/web`, Tailwind v4 container queries (`@container/main` from `ContextualPanelShell`), `@synapcity/frontend-preferences` (`useDateTimeFormatting`), Vitest DOM tests, Playwright (fixture mode).

**Spec:** [PRODUCT.md](../../../PRODUCT.md); [ADR-0014](../../architecture/decisions/0014-multi-app-package-boundaries.md); the owner decisions recorded 2026-10-29 in [the S1a/S1b plan](2026-10-29-dashboard-composition-s1a-s1b.md) (Document content in a separate one-to-one `document_contents` storage with versioned Lexical JSON and revision-based concurrency; the Document editor in `packages/features/documents`). This plan implements none of those decisions.

## How this plan was derived

Read from `origin/main` at `9fa6ba34`, 2026-10-29: `apps/web/src/features/documents/components/document-view/document-view.tsx`, the Document page and its test, `resource-frame.tsx`, `DOCUMENT_FIXTURES`, `resource-views.e2e.ts`. Nothing was run, built or viewed in a browser; sizes and truncation below are read from classes, and Task 1 confirms them.

## Global Constraints

- Planning only until approved. Do not introduce document content persistence, content reads, or editor controls (not even disabled ones). No schema, migration, Server Action, or `server-data` change. No new dependency, so no `lexical` package. Do not create `packages/features/documents`.
- Preserve `ResourceFrame`, `ResourceHeader`, `RESOURCE_PANEL` and the `DocumentView({ document: BaseRecord })` signature. `getDocument` and the page are unchanged.
- Design system rules apply: semantic colour tokens only, no palette colour, no hand-written `dark:` colour, no bracket values, no `style={{}}` for static values, no `!important`, `gap-*` not `space-*`, `size-*`, `cn()` for conditional classes, icons from `lucide-react` only. Prefer existing components over new ones.
- Dates go through `useDateTimeFormatting` (the one place the interface writes dates), never a hand-built `Intl` call.
- Visual changes follow the visual-review rule: the layout is a provisional baseline; fix identified defects, show before and after, do not restyle unasked.
- Working labels here ("reading column", "details", "unavailable") are not names; no exported name or route is derived from them.
- Each task: failing test first, minimal change, `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, then commit.

## Review Focus

1. **Very long title, no description, many tags.** The header title truncates (`truncate`, `text-sm`). Expected: nothing overflows; the full name is still reachable (see S3-D2).
2. **One long unbroken string in the description** (a URL). Expected: it wraps; the page never scrolls sideways.
3. **A document never edited** (`createdAt` equals `updatedAt`). Expected: details do not claim an edit that did not happen.
4. **Contextual panel open at a narrow width.** The container, not the window, is what shrinks. Expected: padding and width follow the `main` container.
5. **Keyboard-only reader.** Expected: Tab reaches the scrolling body once (it is the frame's focusable group), arrow keys and Page Down scroll it, nothing traps focus, and no fake control is focusable.

---

## 1. What exists (read in this worktree)

- `DocumentView` (`'use client'`) renders `ResourceFrame` (`label`, a `ResourceHeader` with title and icon, `destinations={RESOURCE_PANEL}`) around one column: `max-w-prose`, `px-4 py-6`, `@3xl/main:px-8 @3xl/main:py-10`, an optional description paragraph, and a dashed-border paragraph: "This document’s content can’t be shown yet. Writing and saving document content isn’t available yet."
- `ResourceFrame` scrolls the body inside `role="group"`, `aria-label="<name> contents"`, `tabIndex={0}`, with a visible focus ring; `ContextualPanelShell` names the container `@container/main`. `ResourceHeader` renders the **only `h1`**, `text-sm font-medium truncate`.
- `BaseRecord` carries `name`, optional `description`, `icon`, `tags`, `createdAt`, `updatedAt`, `pinnedAt`, `lastViewedAt`. Nothing of the document's content exists in the record.
- There is **no DOM test and no story** for `DocumentView` (the folder has `document-view.tsx` and `index.ts` only); the page test checks only that the page passes `{ document }`. `apps/web` has no Storybook, so coverage here is DOM tests plus fixture e2e.
- `resource-views.e2e.ts` opens `fixture-document-launch-plan` and checks the heading and breadcrumb trail.

## 2. Decisions in this plan

**Reading width.** One column, `max-w-prose` (about 65 characters), centred, unchanged. It sizes from the frame's `main` container, not the window, because the contextual panel narrows the container. Horizontal padding steps with the container (`px-4`, then `@3xl/main:px-8`); no new breakpoint is added and no bracket value.

**Header block.** The header's `h1` is the document's title and stays the only `h1`; the body never adds a second. The description is the lead paragraph (`text-pretty`, muted). Details sit below it.

**Details.** A `dl` named "Document details": Updated (shown only if `updatedAt` differs from `createdAt`, else omitted), Created, and Tags as a list. Dates are `<time dateTime={iso}>` with text from `useDateTimeFormatting`. Pinned and last-viewed state are not shown (they are personal view state, not document metadata).

**Honest content states.** Today the app cannot tell an empty document from an unreadable one, because no content storage exists. So exactly one state is shown now, **unavailable**: the existing sentence, in a bordered region that is `role="note"` (not an alert, nothing is wrong), with no button. An **empty** state ("This document has no content") would assert something unknown, so it is specified for later and not built (section 5).

**Keyboard and accessibility.** No new focusable element. The frame's focusable scroll group stays the single tab stop. Details are static text. Color contrast of `text-muted-foreground` on `bg-background` is checked in both themes (Task 5).

**Light and dark.** Tokens only. The dashed note uses `border-border` and `text-muted-foreground`; no per-theme code.

## 3. Slices

### S3a. Pin the current behavior (no visual change)

#### Task 1: DOM test baseline

**Files:**

- Create: `apps/web/src/features/documents/components/document-view/document-view.dom.test.tsx`

**Interfaces:**

- Consumes: `DocumentView({ document })`; the repository's DOM test setup used by `dashboard-view.dom.test.tsx` for `ResourceFrame` and the panel (copy its wrapper and mocks).

- [ ] **Step 1: Write tests that pass against today's code:** `names the page with the document's name as its only level-one heading` (one `heading` level 1 with the name); `shows the description when there is one and omits it when there is not`; `says the content cannot be shown yet`; `offers no editing control` (no `textbox`, no `button` named like Edit/Save/Bold within the body group).
- [ ] **Step 2:** Run `pnpm --filter web exec vitest run document-view`. Expected: PASS (these pin the baseline). If the `h1` assertion fails, the header block is not what section 1 says: stop and report.
- [ ] **Step 3:** Commit `test: pin the document view's reading page`.

### S3b. Reading column and details

#### Task 2: Details block

**Files:**

- Create: `apps/web/src/features/documents/components/document-view/document-details.tsx`
- Modify: `document-view.tsx`
- Test: extend `document-view.dom.test.tsx`

**Interfaces:**

- Produces: `DocumentDetails({ createdAt, updatedAt, tags }: { createdAt: string; updatedAt: string; tags: readonly string[] })`, not exported from the feature's `index.ts` (internal; Knip must stay green).
- Consumes: `useDateTimeFormatting()` from `@synapcity/frontend-preferences`. Read its returned formatter's name from the package's `regional-provider.tsx` before use; do not assume it.

- [ ] **Step 1: Failing tests:** `lists created and updated dates as time elements with machine-readable values` (`<time dateTime="2026-10-17T16:20:00Z">`); `omits Updated when the document was never edited` (`createdAt === updatedAt`); `lists each tag as a list item`; `omits the tags row when there are none`; `uses a description list named Document details`.
- [ ] **Step 2:** Run; expected FAIL.
- [ ] **Step 3:** Implement `DocumentDetails` as a `dl` (semantic `dt`/`dd`), `gap-*` spacing, text `text-sm`, tags as a `ul` of plain text pills using the existing `Badge` core component if one is installed (check `packages/frontend/ui/src/components/ui` first; do not build a second). Render it in `DocumentView` after the description.
- [ ] **Step 4:** Run; expected PASS. Check the server render does not warn about hydration (the formatter's zone comes from `RegionalProvider`, so the first render must match; if a test shows a mismatch, stop and report rather than hiding it with `suppressHydrationWarning`).
- [ ] **Step 5:** Commit `feat: show a document's dates and tags`.

#### Task 3: Reading column responsiveness

**Files:**

- Modify: `document-view.tsx` (class changes only)

- [ ] **Step 1:** Using Task 5's fixtures and a browser at 1440, 1280, 1024, 768, 390, each with the panel open and closed, list defects (cramped padding, a line length that exceeds `max-w-prose`, horizontal overflow). Each defect is the scope of one change.
- [ ] **Step 2:** For overflow, write a failing DOM-level assertion where jsdom can express it; otherwise the failing case is the Task 5 e2e `no horizontal overflow`. Fix with a scale step or `min-w-0`/`wrap-break-word` utility on the column, never a bracket value.
- [ ] **Step 3:** Commit one defect per commit: `fix: <the defect>`.

### S3c. States and copy

#### Task 4: Unavailable state as a named note

**Files:**

- Modify: `document-view.tsx`
- Test: `document-view.dom.test.tsx`

- [ ] **Step 1: Failing tests:** `states the content is unavailable in a note region` (`role="note"` containing "can’t be shown yet"); `does not say the document is empty` (no text matching `/empty|no content/i`); `has no button or link inside the note`.
- [ ] **Step 2:** Run; expected FAIL on `role="note"`.
- [ ] **Step 3:** Add `role="note"` and `aria-label="Document content"` to the existing region. Keep the existing sentence unless the owner changes it (S3-D1). No icon, no tone colour.
- [ ] **Step 4:** Run; expected PASS. Commit `fix: name the unavailable document content`.

### S3d. Fixtures, e2e and theme verification

#### Task 5: Reading fixtures and checks

**Files:**

- Modify: `apps/web/src/features/documents/lib/fixtures/documents.ts` (and its test)
- Modify: `apps/web/e2e/resource-views.e2e.ts` (the existing document group; no dashboard spec is touched)

Fixture ownership: S3 owns `DOCUMENT_FIXTURES`. S2 owns dashboard fixtures. Neither plan edits the other's files or specs.

- [ ] **Step 1:** Before adding fixtures, `git grep` the fixture count in `documents.test.ts`, the collection tests and `resource-views.e2e.ts`; list the assertions that depend on the number or order. Add only fixtures the checks need: a long title with a long unbroken description and five tags; one with no description and no tags; one never edited. Update exactly the count-dependent assertions and nothing else.
- [ ] **Step 2: e2e (fixture mode, one worker first):** `a long document name and an unbroken description do not scroll the page sideways` at 390 and 1280 (document, panel open and closed): `scrollWidth - innerWidth <= 0`. `Tab reaches the contents group once and arrow keys scroll it` (focus the group named `<name> contents`, press `End`, assert it scrolled). `the page shows the unavailable note and no editing controls`.
- [ ] **Step 3:** Run `E2E_WEB_MODE=dev SYNAPCITY_DEV_AUTH=fixture pnpm --filter web exec playwright test --workers=1 resource-views.e2e`. Expected PASS.
- [ ] **Step 4: Manual, not automated:** light and dark at 1440 and 390 with the browser's contrast inspector on description, details and note; keyboard-only pass; a screen reader pass over heading, description, details and note. Record results as measured or not run.
- [ ] **Step 5:** Commit `test: check the document page's reading layout`.

## 4. Future Lexical integration boundaries (recorded, not implemented)

- **The seam** is the one body region below the details. A later change replaces the unavailable note there; the header, details and frame do not change.
- **Ownership (decided 2026-10-29):** the editor and its content types belong in `packages/features/documents`; content is stored separately from the record, as versioned Lexical JSON with revision-based concurrency. `DocumentView` would receive the body as a composed slot from that package, the way `DashboardView` composes the Dashboard surface; the page keeps loading only the `BaseRecord`.
- **Not decided here:** the slot's prop shape, read-only rendering of stored content, empty-state copy once a read can distinguish empty from failed, editor toolbar placement, and the save and conflict UI. Each is for the plan that builds content storage.
- **Guards until then:** no `lexical` import, no `document_contents` read, no editable region. Task 1's `offers no editing control` test fails if one appears early.
- **Contracts the future empty state must keep:** the same `role="note"` region and the single `h1`.

## 5. Out of scope

Document content persistence or loading; any editor or toolbar; Lexical; `packages/features/documents`; schema or Server Actions; sharing, comments, outline or table of contents; print styles; the Dashboard (S2); changes to `ResourceFrame`, `ResourceHeader`, `RESOURCE_PANEL`, `getDocument`; the parallel fixture e2e investigation (#122).

## 6. Decisions needing the owner

- **S3-D1 (copy).** Keep the current unavailable sentence, or change it. Plan default: keep.
- **S3-D2 (long titles).** The `h1` is `truncate` at `text-sm` in the frame header, which this plan does not change. A very long name is cut with no way to read it on the page (the breadcrumb and tab title carry it). Options: accept it; add the full name under the details as plain text, which repeats the title; or change `ResourceHeader` (a shared-shell change, a separate plan). Plan default: accept, and verify in Task 3.
- **S3-D3 (placement and testing).** The new `DocumentDetails` stays in `apps/web` because it is one-use and `apps/web` has no Storybook, so it has DOM and e2e tests only. Extracting it to a package would be an ownership choice and is not proposed.
- **S3-D4 (fixtures).** Task 5 adds up to three fixtures to the shared Documents list in fixture mode, so the collection page shows them. Confirm, or ask for them to be test-only.

## 7. Verification commands

- Per task: `pnpm --filter web exec vitest run document-view`; `pnpm --filter web exec vitest run documents`.
- Before each push: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm deps`, `pnpm boundaries`.
- Fixture e2e: `E2E_WEB_MODE=dev SYNAPCITY_DEV_AUTH=fixture pnpm --filter web exec playwright test --workers=1 resource-views.e2e`.
- Full gate before merge: `pnpm verify`.
- Not covered by automation: contrast in both themes, screen reader behavior, visual quality, and any signed-in (non-fixture) Document page.

## 8. Self-review

- Spec coverage: reading width and container responsiveness (sections 2, Task 3); title, description, metadata (Task 2); honest empty and unavailable states (section 2, Task 4); keyboard and accessibility (Review Focus 5, Task 5); light and dark (Task 5 Step 4); future Lexical boundaries (section 4); fixture ownership distinct from S2 (Task 5).
- Gaps declared: the empty state is specified, not built, because it would be dishonest today; hydration of formatted dates is verified in Task 2, not assumed.
- Proportion: only Tasks 2 and 4 add code; each gives names and assertions, not bodies.
