# `frontend-feedback` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** Approved (owner decision, 2026-10-25), with native execution: one agent implements every task in its own session, then one whole-branch review. Not started: blocked on frontend-shells plan Task 5 reaching `main` (design Q6).

**Goal:** Create `@synapcity/frontend-feedback` (`packages/frontend/feedback`) with the notice mechanism, the route error view, `InlineError` and `ErrorBoundary`, and move every current consumer onto it without changing what anyone sees, apart from the three new failure fallbacks (widget, Settings tab, form dialog).

**Architecture:** One frontend package with three entries: `./notices` (portable, server-safe), `.` (React client) and `./next` (the URL binding). It composes `frontend-ui` primitives, `frontend-shells`' `MessagePage` and `frontend-error-reports`' `reportCaughtError`. Wording stays with each caller.

**Tech Stack:** React 19.3.0, Next.js 16.4.3 (`./next` only), Base UI toast through `@synapcity/frontend-ui/core/toast`, Vitest with Testing Library (`@synapcity/dev-vitest-config/react`), Storybook 10.6.3.

**Spec:** [2026-10-25-frontend-feedback-design.md](../specs/2026-10-25-frontend-feedback-design.md). Section numbers below (§) refer to it.

## Global Constraints

- **Start condition:** frontend-shells plan Task 5 is merged into `main`, so `MessagePage` and `MESSAGE_HEADING_ID` import from `@synapcity/frontend-shells`. Work from a clean branch off `main`. Stop and report if `apps/web/src/components/providers/root-providers.tsx` still has uncommitted edits in another checkout.
- **Package:** `packages/frontend/feedback`, `@synapcity/frontend-feedback`, `private`, `"type": "module"`, source-pointing exports `"./notices": "./src/notices/index.ts"`, `".": "./src/index.ts"`, `"./next": "./src/next/index.ts"`. No root re-export of `./notices` or `./next`.
- **Dependencies:** `@synapcity/frontend-ui`, `@synapcity/frontend-shells`, `@synapcity/frontend-error-reports` (`workspace:*`), `react` `19.3.0`, `next` `16.4.3`. Dev dependencies copy `frontend-shells`' set and pins. No new third-party package. Lockfile changes are workspace entries only.
- **Direction:** `frontend-feedback` imports only `frontend-ui`, `frontend-shells` and `frontend-error-reports` among workspace packages: never `frontend-collection` or `frontend-forms` (which will import it), and never `domain-*`, `server-*` or `features-*`. `frontend-ui`, `frontend-shells` and `frontend-error-reports` never import `frontend-feedback` (R9). `next/*` only under `src/next/` (R11). `./notices` has no React, DOM or `'use client'`.
- **Copy:** the package's only built-in string is `'Try again'` (the `retryLabel` default). Every other string in this plan is copied exactly from the file it comes from, or is one of the new fallback strings fixed in §4.2: `This widget could not be shown.`, `This section didn't load.`, and `frontend-forms`' `This form could not be shown.` with `Close`.
- **Preserve:** every item in §6's preservation list. Existing test files keep their case titles; moved tests change only imports, the component name and the supplied props.
- **Units:** one folder per unit with `name.tsx`, `name.test.tsx` (or `.dom.test.tsx` where jsdom is needed), `name.stories.tsx` for rendering units, and `index.ts`. Relative imports inside the package (workspace conventions, Existing packages).
- **Styling:** design system rules. No colour or typography classes on shadcn components, no bracket values, `cn()` for merges.
- **Process:** add a task-scope entry to `.agents/task-scope.md` before Task 1. Each task ends in a checkpoint commit when commits are authorized. Never quote the owner. Never write a GitHub closing keyword.

## Review Focus

1. **A retry that fails again.** After Try again, a child that still throws must show the fallback again and report a second time, without a render loop. Test in Task 5.
2. **A widget recovers when it is edited.** A broken widget whose `widget` value changes (a new object from the store) clears its error without a click. Test in Task 6.
3. **One failed Settings tab.** Only that tab shows the fallback, the other tabs' loaders run once, and Try again imports only the failed tab again. Test in Task 7.
4. **Global error without a router.** `RouteErrorView` and everything reachable from `.` must not import `next/*`, because `global-error.tsx` renders when the router may be broken. Structure test in Task 1 (asserts no `next` import outside `src/next/`).
5. **An error without a digest.** Client-side throws have no `digest`. The log must still be `console.error(label, { digest: undefined })`, as today, and must never include the message. Test in Task 3.

---

### Task 1: Package scaffold and `./notices`

**Files:**

- Create: `packages/frontend/feedback/{package.json,tsconfig.json,eslint.config.mjs,vitest.config.mts,README.md}`, copying `packages/frontend/shells`' configs (react preset, `"types": ["node"]`)
- Create: `src/index.ts`, `src/next/index.ts` (empty barrels for now), `src/notices/index.ts`, `src/notices/notices.ts`, `src/notices/notices.test.ts`, `src/package-structure.test.ts`, `src/purity.test.ts`
- Modify: `apps/web/src/lib/routing/notices.ts`, `apps/web/src/lib/routing/notices.test.ts`, `apps/web/package.json` (add the dependency)
- Modify: root `vitest.config.ts` (add `'packages/frontend/feedback'` after `error-reports`), `pnpm-lock.yaml` (via `pnpm install`), `docs/architecture/workspace-conventions.md` (inventory row from §7), `packages/frontend/README.md` (list it)

**Interfaces:**

- Produces (`@synapcity/frontend-feedback/notices`): `NoticeType`, `NoticeAction`, `Notice`, `NOTICE_TIMEOUTS`, `noticeTimeout(notice: Notice): number`, `defineNotices<const D extends Record<string, Notice>>(d: D): { notices: Readonly<Record<keyof D & string, Notice>>; isKey(v: string | null | undefined): v is keyof D & string }`, `withNotice(path: string, param: string, key: string): string`.
- Produces (app, unchanged names for the three callers): `NOTICES`, `NoticeKey`, `NOTICE_PARAM`, `isNoticeKey`, `withNotice(path, key)`, plus re-exported `noticeTimeout` and types where app code imports them.

- [ ] **Step 1: Move the generic test cases.** Move the `isNoticeKey`, `noticeTimeout` and `withNotice` describe blocks from `apps/web/src/lib/routing/notices.test.ts` to `src/notices/notices.test.ts`. Rewrite them against a local fixture list, `defineNotices({ saved: { type: 'success', title: 'Saved.' }, oops: { type: 'error', title: 'Failed.' } })`, keeping every case title and assertion: inherited names such as `'constructor'` and `'toString'` rejected, `null`/`undefined` rejected, error timeout `0`, per-notice timeout wins including `0`, and `withNotice('/a?x=1#h', 'notice', 'saved') === '/a?x=1&notice=saved#h'`, replacing an existing notice, staying same-origin. Add one new case (spec M2): `noticeTimeout` returns `0` for a notice with an `action`, for each of the four types and when the notice sets `timeout: 3000`.
- [ ] **Step 2: Add the structure and purity tests.**
  - `package-structure.test.ts`: every folder under `src/` except `next` has `index.ts`. No file outside `src/next/` imports `next` or `next/*`. `package.json` `exports` is exactly the three entries.
  - `purity.test.ts`: in the `frontend-forms` style, with `PURE = ['notices']`, nothing under it imports `react` or `react-dom`, or contains `'use client'`.
- [ ] **Step 3: Run `pnpm --filter @synapcity/frontend-feedback test`.** Expected: FAIL because the modules are missing.
- [ ] **Step 4: Implement `src/notices/notices.ts`.**
  - The types and `NOTICE_TIMEOUTS` are copied verbatim from the app, with their JSDoc (WCAG 2.2.1 note included).
  - `defineNotices` returns the same object as `notices` and an `isKey` using `Object.hasOwn`.
  - `withNotice` is today's body with `param` explicit.
  - `noticeTimeout` returns `0` when `notice.action` is set, otherwise today's `notice.timeout ?? NOTICE_TIMEOUTS[notice.type]`. Its JSDoc cites WCAG 2.2.1.
- [ ] **Step 5: Reduce `apps/web/src/lib/routing/notices.ts` to copy and bindings.**
  - Keep the module JSDoc and the five `DEFINITIONS` with their comments.
  - Add `const { notices: NOTICES, isKey: isNoticeKey } = defineNotices(DEFINITIONS)`, `NoticeKey = keyof typeof DEFINITIONS`, `NOTICE_PARAM = 'notice'` and `withNotice(path: string, key: NoticeKey) => withNotice(path, NOTICE_PARAM, key)`.
  - Re-export the types and `noticeTimeout` from the package.
  - The three callers (`auth/callback/route.ts`, `auth/delete-account/actions.ts`, `features/auth/server/actions/actions.ts`) do not change.
- [ ] **Step 6: Run the tests.** Run `pnpm --filter @synapcity/frontend-feedback test`, then `pnpm --filter web test -- src/lib/routing`. Expected: PASS. The app keeps its wording describes (`NOTICES`, email, account-connected, account-deleted).
- [ ] **Step 7: Run `pnpm boundaries` and `pnpm deps`.** Expected: no violations. Knip may flag the empty `.` and `./next` barrels; if it does, add them to the package's Knip entry list as the shells scaffold did, and note it.
- [ ] **Step 8: Commit** with `feat(frontend-feedback): create the package and move the notice registry`.

### Task 2: Notice bridge (`showNotice`, `NoticeFromSearchParams`)

**Files:**

- Create: `src/show-notice/{show-notice.ts,show-notice.test.ts,index.ts}`, `src/next/notice-from-search-params/{notice-from-search-params.tsx,index.ts}`
- Move (`git mv`): `apps/web/src/components/notices/notice-toast.dom.test.tsx` and `notice-toast-action.dom.test.tsx` to `src/next/notice-from-search-params/`
- Modify: `src/index.ts`, `src/next/index.ts`, `apps/web/src/components/providers/root-providers.tsx`
- Delete: `apps/web/src/components/notices/notice-toast.tsx` (the folder becomes empty and goes with it)

**Interfaces:**

- Consumes: Task 1 `Notice`, `noticeTimeout`.
- Produces: `showNotice(key: string, notice: Notice, options: { navigate: (href: string) => void }): void` from `.`. `NoticeFromSearchParams(props: { param: string; notices: Readonly<Record<string, Notice>>; isKey: (value: string | null) => boolean }): null` from `./next`.

- [ ] **Step 1: Write `show-notice.test.ts`** with `toast` mocked as in the moved tests.
  - It calls `toast.add` with `id: 'notice-saved'`, the type, title, description and `noticeTimeout(notice)`.
  - `priority` is `'high'` only for `'error'`, otherwise `'low'`.
  - Without an action there are no `actionProps`.
  - With an action, `actionProps.children` is the label, and `onClick` calls `toast.close('notice-saved')` and then `navigate(href)`, in that order.
- [ ] **Step 2: Re-point the two moved dom tests.** Import `NoticeFromSearchParams`, render `<NoticeFromSearchParams param="notice" notices={NOTICES} isKey={isNoticeKey} />` with a local fixture list that holds the keys the tests use (`password-updated`, a key with an action, an error key), keeping every case title and assertion. Keep the `next/navigation` and `@synapcity/frontend-ui/core/toast` mocks.
- [ ] **Step 3: Run `pnpm --filter @synapcity/frontend-feedback test`.** Expected: FAIL because the modules are missing.
- [ ] **Step 4: Implement `showNotice`**, the toast part of today's effect. Then implement `NoticeFromSearchParams` as today's `NoticeToast` body with `NOTICE_PARAM`, `isNoticeKey` and `NOTICES` replaced by props, calling `showNotice(key, notices[key], { navigate: router.push })`. Keep every comment: StrictMode, `shown` ref reset, Suspense requirement.
- [ ] **Step 5: Re-point `root-providers.tsx`.** Change the import and mount `<NoticeFromSearchParams param={NOTICE_PARAM} notices={NOTICES} isKey={isNoticeKey} />` inside the existing `<Suspense fallback={null}>`. Change nothing else in the file.
- [ ] **Step 6: Run the tests.** Run the package tests, then `pnpm --filter web test`. Expected: PASS, with the 10 moved cases counted in the package and `root-providers.dom.test.tsx` green.
- [ ] **Step 7: Commit** with `refactor(frontend-feedback): move the notice toast bridge behind ./next`.

### Task 3: Route errors (`useBoundaryEffects`, `RouteErrorView`)

**Files:**

- Create: `src/route-error/use-boundary-effects/{use-boundary-effects.ts,use-boundary-effects.dom.test.tsx,index.ts}`, `src/route-error/route-error-view/{route-error-view.tsx,route-error-view.dom.test.tsx,route-error-view.stories.tsx,index.ts}`
- Modify: `apps/web/src/app/error.tsx`, `app/global-error.tsx`, `app/[userId]/home/{spaces,documents,dashboards}/error.tsx`
- Test (new, app): `apps/web/src/app/route-errors.dom.test.tsx`
- Modify: `apps/storybook/.storybook/main.ts` (stories glob), `apps/storybook/styles/globals.css` and `apps/web/src/styles/globals.css` (`@source` lines for `packages/frontend/feedback/src`)

**Interfaces:**

- Consumes: `MessagePage`, `MESSAGE_HEADING_ID` from `@synapcity/frontend-shells`; `reportCaughtError` from `@synapcity/frontend-error-reports`; `Button` from `@synapcity/frontend-ui/core/button`.
- Produces: `useBoundaryEffects(error: Error & { digest?: string }, label: string): void`, and `RouteErrorView(props: { error; retry: () => void; logLabel: string; title: string; description: string; retryLabel?: string; children?: ReactNode }): JSX.Element`, from `.`.

- [ ] **Step 1: Write `use-boundary-effects.dom.test.tsx`** with `reportCaughtError` mocked.
  - It calls `console.error('Label', { digest: 'd1' })` once.
  - With no digest it logs `{ digest: undefined }` (Review Focus 5).
  - The message is never among `console.error`'s arguments.
  - `reportCaughtError` receives the same error.
  - An element with `id={MESSAGE_HEADING_ID}` and `tabIndex={-1}` has focus after render.
  - A new `error` object runs the effect again; a re-render with the same one does not.
- [ ] **Step 2: Write `route-error-view.dom.test.tsx`.**
  - There is one h1 with the title, and the description shows.
  - A "Try again" button calls `retry`.
  - `retryLabel="Retry"` renames it.
  - `children` render after the retry button.
  - The heading has focus.
- [ ] **Step 3: Run the package tests.** Expected: FAIL.
- [ ] **Step 4: Implement both.** `useBoundaryEffects` is the current effect with dependencies `[error]`; `label` is a constant per call site, so it is left out deliberately with a comment. `RouteErrorView` calls the hook and renders `MessagePage` with `<Button type="button" size="lg" onClick={() => retry()}>{retryLabel}</Button>{children}`. Write the story, with `retry` as an action.
- [ ] **Step 5: Write `route-errors.dom.test.tsx` in the app.** For each of the five files, render it with `new Error('secret')` and assert:
  - Its exact title and description: the three home strings and the two root strings, copied from today's files.
  - Its exact log label: `'Spaces failed to load'`, `'Documents failed to load'`, `'Dashboards failed to load'`, `'Unexpected error'` twice.
  - `'secret'` does not appear in the DOM.
  - The root has the home `LinkButton` (`href="/"`), and global has the plain `<a href="/">`.
- [ ] **Step 6: Re-point the five route files.**
  - The three home files become `<RouteErrorView error={error} retry={retry} logLabel=… title=… description=… />`, keeping their JSDoc.
  - `error.tsx` passes its `LinkButton` as a child.
  - `global-error.tsx` keeps `<html>`, `<head>`, `<body>`, `ModeProvider`, `<main>`, the plain `<a>` and its comments, and replaces the effect and `MessagePage` with `RouteErrorView`.
  - Remove imports that are no longer used.
- [ ] **Step 7: Run the tests.** Run `pnpm --filter @synapcity/frontend-feedback test`, `pnpm --filter web test`, `pnpm boundaries` and `pnpm deps`. Expected: PASS.
- [ ] **Step 8: Commit** with `refactor(frontend-feedback): share the route error view and effect`.

### Task 4: `InlineError` and the three load-failure alerts

**Files:**

- Create: `src/inline-error/{inline-error.tsx,inline-error.dom.test.tsx,inline-error.stories.tsx,index.ts}`
- Modify: `packages/frontend/collection/src/components/collection-index/collection-index.tsx:157-169`, `packages/features/spaces/src/frontend/components/space-content/space-content.tsx:44-49`, `packages/features/dashboards/src/frontend/components/dashboard-workspace/dashboard-workspace.tsx:133-138`, and the three `package.json` files (add the dependency)
- Test: the existing `collection-index.test.tsx`, `space-content.test.tsx` and `dashboard-workspace.test.tsx` (unchanged), plus a markup snapshot step

**Interfaces:**

- Produces: `InlineError(props: { title?: ReactNode; description: ReactNode; action?: ReactNode }): JSX.Element` from `.`. It renders `<Alert variant="destructive">`, then `<AlertTitle>` only when `title` is given, `<AlertDescription>{description}</AlertDescription>`, and `<AlertAction>` only when `action` is given.

- [ ] **Step 1: Pin the before markup.** In each of the three existing test files, add a temporary case that renders the failure state and asserts `container.querySelector('[data-slot="alert"]')?.outerHTML` with `toMatchInlineSnapshot()`. Run it once on the current code so Vitest writes the snapshot inline.
- [ ] **Step 2: Write `inline-error.dom.test.tsx`.**
  - Without a title: `role="alert"`, `data-slot="alert"`, no `[data-slot="alert-title"]`, and the description text is inside `[data-slot="alert-description"]`.
  - With a title, the title element shows.
  - A description node containing `<a href="/x">` keeps the link inside the description.
  - An action renders inside `[data-slot="alert-action"]`, and none renders when it is omitted.
- [ ] **Step 3: Run the package tests.** Expected: FAIL.
- [ ] **Step 4: Implement `InlineError` and its story.** Story variants: description only, title and description, with a link, with a Try again action.
- [ ] **Step 5: Switch the three files to the calls in §4.3**, keeping their wording, the space-content comment and the collection link markup (`Link` with `buttonVariants({ variant: 'link', size: 'sm' })`). Remove the `Alert*` imports that are no longer used.
- [ ] **Step 6: Run the three snapshot cases on the new code.** Expected: they pass unchanged, so the markup is identical. Then delete the temporary cases.
- [ ] **Step 7: Run the tests.** Run `pnpm --filter @synapcity/frontend-collection test`, `pnpm --filter @synapcity/features-spaces test`, `pnpm --filter @synapcity/features-dashboards test`, `pnpm boundaries` and `pnpm deps`. Expected: PASS, with no cycle reported for `frontend-collection` and `frontend-feedback`.
- [ ] **Step 8: Commit** with `refactor(frontend-feedback): add InlineError and use it for the load-failure alerts`.

### Task 5: `ErrorBoundary`

**Files:**

- Create: `src/error-boundary/{error-boundary.tsx,error-boundary.dom.test.tsx,error-boundary.stories.tsx,index.ts}`

**Interfaces:**

- Consumes: `reportCaughtError`.
- Produces: `class ErrorBoundary extends Component<ErrorBoundaryProps, { error: unknown }>` and `type ErrorBoundaryFallbackProps = { error: unknown; reset: () => void }`, from `.`. Props: `children`, `fallback: ReactNode | ((p: ErrorBoundaryFallbackProps) => ReactNode)`, `onError?`, `onReset?`, `resetKeys?: readonly unknown[]`. Nothing is held when `state.error` is `null`; use a `{ error: unknown } | null`-shaped state so that `throw undefined` still counts as an error.

- [ ] **Step 1: Write `error-boundary.dom.test.tsx`.** Use a `Thrower` that throws while a ref flag is set, and silence React's console output in this file only.
  - A node fallback replaces the children, and a sibling outside the boundary still renders.
  - The render-prop fallback receives the thrown error and a `reset`.
  - `reset` with the flag cleared renders the children again, and `onReset` was called before the children's render.
  - A retry that throws again shows the fallback again, and `onError` (or `reportCaughtError`) is called twice (Review Focus 1).
  - `onError` defaults to `reportCaughtError(error)`.
  - `resetKeys`: a changed entry resets; the same entries do not; a length change resets; a key change while not in error does nothing.
  - `throw undefined` still shows the fallback.
  - **Lazy caveat proof:** a `lazy(loader)` child whose `loader` rejects once and then resolves. After `reset` the fallback shows again and `loader` was called once. This pins the §3.2 caveat that Task 7 relies on. If it fails, meaning React imports again, Task 7 drops its new-lazy-per-attempt logic, and the spec's caveat is corrected.
- [ ] **Step 2: Run the package tests.** Expected: FAIL.
- [ ] **Step 3: Implement the class** per §3.2.
  - Use `getDerivedStateFromError`, `componentDidCatch(error, info)` → `(onError ?? reportCaughtError)`, and a bound `reset`.
  - `componentDidUpdate(prev)` compares `resetKeys` with `Object.is` per index plus length, and only while an error is held.
  - The JSDoc lists what boundaries do not catch and the `React.lazy` retry caveat, citing react.dev's `Component` reference.
  - The story shows a node fallback and a render-prop fallback with `InlineError` and Try again.
- [ ] **Step 4: Run the tests.** Run the package tests and `pnpm deps`. Expected: PASS. Knip passes only once Task 6 consumes the export, so Tasks 5 and 6 may share one commit if Knip blocks.
- [ ] **Step 5: Commit** with `feat(frontend-feedback): add ErrorBoundary`.

### Task 6: Dashboard widget boundary

**Files:**

- Modify: `packages/features/dashboards/src/frontend/widgets/widget-states/widget-states.tsx` (add `WidgetFailed`), `widget-states.stories.tsx`, `packages/features/dashboards/src/frontend/components/connected-widget/connected-widget.tsx` (around the body inside `WidgetShell`)
- Test: `widget-states` (new `widget-states.dom.test.tsx` if none exists), `connected-widget.test.tsx`, `dashboard-grid.test.tsx`

**Interfaces:**

- Consumes: `ErrorBoundary`, `InlineError`; `Button` from `@synapcity/frontend-ui/core/button`.
- Produces: `WidgetFailed({ onRetry }: { onRetry: () => void }): JSX.Element` in `widget-states`.

- [ ] **Step 1: Write the failing tests.**
  - `WidgetFailed` renders `role="alert"` with `This widget could not be shown.` and a `Try again` button that calls `onRetry`.
  - `connected-widget.test.tsx`: when the body throws (mock `WidgetBody` to throw), the widget title and toolbar still render, the fallback shows, and Try again, after the mock stops throwing, renders the body.
  - A new `widget` value (simulate an edit through the store's `update`) clears the error without a click (Review Focus 2).
  - `dashboard-grid.test.tsx`: with two widgets where one body throws, the other widget's body renders.
- [ ] **Step 2: Run `pnpm --filter @synapcity/features-dashboards test`.** Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Add `WidgetFailed` (an `InlineError` with `action={<Button type="button" size="sm" variant="outline" onClick={onRetry}>Try again</Button>}`) and its story.
  - In `ConnectedWidget`, wrap the `isAgenda ? <AgendaBody …/> : <WidgetBody …/>` expression in `<ErrorBoundary resetKeys={[widget]} fallback={({ reset }) => <WidgetFailed onRetry={reset} />}>`.
  - Leave `AgendaEventDialog` outside the boundary.
  - Add the dependency to `packages/features/dashboards/package.json`.
- [ ] **Step 4: Run the tests** (package tests, `pnpm boundaries`, `pnpm deps`), then take before and after screenshots of a dashboard with one forced-throw widget in Storybook (`connected-widget.stories.tsx`, a new `BodyFails` story). Expected: PASS. The screenshots show the route error before and one tile's fallback after.
- [ ] **Step 5: Commit** with `feat(features-dashboards): contain a failing widget to its own tile`.

### Task 7: Settings tab boundary

**Files:**

- Create: `packages/features/settings/src/frontend/shared/settings-tabs/settings-tab-failed/{settings-tab-failed.tsx,settings-tab-failed.stories.tsx,index.ts}`
- Modify: `packages/features/settings/src/frontend/shared/settings-tabs/settings-tabs.tsx:58-106`, `packages/features/settings/package.json`
- Test: `settings-tabs.dom.test.tsx`

**Interfaces:**

- Consumes: `ErrorBoundary`, `InlineError`, `Button`.
- Produces: `SettingsTabFailed({ onRetry }: { onRetry: () => void }): JSX.Element`.

- [ ] **Step 1: Check Task 5's lazy caveat result.** If that test showed React imports again, skip the attempt counter in Step 4.
- [ ] **Step 2: Write the behavior tests.**
  - A tab whose loader rejects shows `This section didn't load.` with `role="alert"`, and the tab strip and the other tabs still work.
  - Try again calls only the failed tab's loader a second time and renders it.
  - The other tabs' loaders were called once each (Review Focus 3).
  - The account tab's `accountTab` loader follows the same path.
- [ ] **Step 3: Run `pnpm --filter @synapcity/features-settings test`.** Expected: the Step 2 tests FAIL.
- [ ] **Step 4: Implement** (attempt counter only if Step 1 says so).
  - Add `const [attempts, setAttempts] = useState<Record<string, number>>({})` and `retryTab(value)`, which increments `attempts[value]`.
  - The `lazyTabs` memo depends on `[accountTab, attempts]` and keeps each tab's existing lazy value unless that tab's attempt count changed: cache per `value:attempt`, so the other tabs keep their loaded component and state.
  - Wrap each `<Suspense fallback={null}>` in `<ErrorBoundary onReset={() => retryTab(value)} fallback={({ reset }) => <SettingsTabFailed onRetry={reset} />}>`.
  - `SettingsTabFailed` is an `InlineError` with the Try again action from Task 6's shape.
  - Add the dependency.
- [ ] **Step 5: Run the tests.** Run the package tests, `pnpm --filter web test`, `pnpm boundaries` and `pnpm deps`. Expected: PASS.
- [ ] **Step 6: Commit** with `feat(features-settings): contain a Settings tab that fails to load`.

### Task 8: Form dialog boundary

**Files:**

- Create: `packages/frontend/forms/src/components/entity-form-dialog/form-dialog-failed/{form-dialog-failed.tsx,form-dialog-failed.stories.tsx,index.ts}`
- Modify: `packages/frontend/forms/src/components/entity-form-dialog/entity-form-dialog.tsx` (the render function passed to `EntityDialog`, and the `messages` type), `packages/frontend/forms/package.json` (add the dependency), `packages/frontend/forms/README.md` (one line on the boundary)
- Test: `packages/frontend/forms/src/components/entity-form-dialog/entity-form-dialog.test.tsx` (or its existing dom test file)

**Interfaces:**

- Consumes: `ErrorBoundary`, `InlineError`; `Button` from `@synapcity/frontend-ui/core/button`; `EntityDialogApi.close` from the `EntityDialog` render function.
- Produces: `FormDialogFailed({ onRetry, onClose, message }: { onRetry: () => void; onClose: () => void; message?: string }): JSX.Element`, where `message` defaults to `'This form could not be shown.'`. `EntityFormDialogProps['messages']` gains `formFailed?: string`.

- [ ] **Step 1: Write the failing tests.** Use a form definition with a field whose renderer throws (mock one renderer module, or add a test-only field type the renderer map resolves to a thrower).
  - The open dialog shows `role="alert"` with `This form could not be shown.`, and the dialog title is still there.
  - Close calls `onOpenChange(false)` once.
  - Try again, after the renderer stops throwing, shows the form fields.
  - `messages={{ formFailed: 'Custom.' }}` shows `Custom.`.
  - `reportCaughtError` is called once with the thrown error, and the error's text is not in the DOM.
  - The agenda event dialog's existing tests in `features-dashboards` stay green unchanged.
- [ ] **Step 2: Run `pnpm --filter @synapcity/frontend-forms test`.** Expected: FAIL.
- [ ] **Step 3: Implement.**
  - `FormDialogFailed` is `InlineError` with the message and two actions in one `AlertAction`: `<Button type="button" size="sm" variant="outline" onClick={onRetry}>Try again</Button>` and `<Button type="button" size="sm" variant="ghost" onClick={onClose}>Close</Button>`.
  - In `EntityFormDialog`, the render function becomes `({ close }) => <ErrorBoundary fallback={({ reset }) => <FormDialogFailed onRetry={reset} onClose={close} message={messages?.formFailed} />}><FormRenderer … /></ErrorBoundary>`.
  - Add the story, with a throwing field.
- [ ] **Step 4: Run the tests.** Run the forms tests, `pnpm --filter @synapcity/features-dashboards test`, `pnpm boundaries` (no `frontend-forms` and `frontend-feedback` cycle) and `pnpm deps`. Expected: PASS.
- [ ] **Step 5: Commit** with `feat(frontend-forms): contain a form that fails inside its dialog`.

### Task 9: Records and verification

**Files:**

- Modify:
  - `docs/architecture/reorganization-ownership-map.md` (the `components/notices` row, the `app` row, and a new package-table row from §7)
  - `docs/architecture/workspace-conventions.md` (inventory row date, milestone sentence)
  - `docs/architecture/decisions/0014-multi-app-package-boundaries.md` §7: one sentence in the M6.5 style
  - `packages/frontend/feedback/README.md` (`Owns:` and the entry table from §3)
  - `packages/frontend/shells/README.md` (hosts wrap global panel content in `ErrorBoundary`)
  - the spec's status line, this plan's checkboxes and `.agents/task-scope.md`

- [ ] **Step 1: Apply the record changes** exactly as §7 words them, with today's date in the inventory row.
- [ ] **Step 2: Run `pnpm verify`.** Expected: PASS. Run `pnpm exec playwright install chromium` first if browsers are missing.
- [ ] **Step 3: Check manually** in `pnpm --filter web dev`, and record each result in the task-scope entry:
  - Force a throw in each home route: the heading has focus, Try again works, and the shell stays.
  - `/<userId>/home?notice=password-updated` shows once and the parameter clears.
  - `?notice=constructor` shows nothing.
  - Force a widget throw: one tile falls back and the others work.
  - Block a Settings tab chunk in devtools: that tab falls back, and Try again loads it once unblocked.
  - Force a throw in the agenda's Add event form: the dialog shows the fallback, and Close and Try again both work by keyboard.
  - Both colour modes. Keyboard only.
- [ ] **Step 4: Report** per AGENTS section 9:
  - What ran and what passed.
  - What was not run: Sentry delivery in a hosted environment, a real root-layout failure for `global-error.tsx`, and screen-reader announcement of toasts and alerts.
  - The follow-ups in spec §11 (including 11.3 and 11.4), which are not started.
- [ ] **Step 5: Commit** with `docs: record frontend-feedback in the inventory and ownership map`.
