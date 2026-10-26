# frontend-feedback: error boundaries, route error view and the notice bridge

**Status:** Accepted (owner decision, 2026-10-25). Q1 to Q6 answered (section 9). The same day the owner merged in four parts of a parallel draft from the `fix/feedback-package-architecture-c6d992` worktree: `InlineError` and its adoption in three load-failure alerts (sections 3.1 and 4.3), the notifications non-goal, and the `frontend-ui` follow-ups in section 11. That draft is superseded by this document. Later the same day the owner folded in four findings from the previous implementation (M2, section 12): notices with an action never time out, a boundary in form dialogs with a Close way out, and two follow-ups (sections 11.3 and 11.4). Implementation waits for frontend-shells plan Task 5 (Q6). The plan is [2026-10-25-frontend-feedback.md](../plans/2026-10-25-frontend-feedback.md).
**Date:** 2026-10-25
**Branch:** `docs/frontend-feedback-design` from `main` at `f3768472`.
**Evidence:** `main` at `f3768472`, and the `refactor/shells-sidebar-slots` checkout at `9d687b48` (frontend-shells plan Task 4 done there, Task 5 not started; 32 uncommitted files there, including `apps/web/src/components/providers/root-providers.tsx`). That checkout was read, not changed.
**Governing decisions:** [ADR-0014](../../architecture/decisions/0014-multi-app-package-boundaries.md) (categories, matrix, copy authority in section 5), the [workspace conventions](../../architecture/workspace-conventions.md) (inventory, composition rule, boundary checks), the [ownership map](../../architecture/reorganization-ownership-map.md), the [package creation checklist](../../architecture/package-creation-checklist.md), the [frontend-shells plan](../plans/2026-10-25-frontend-shells.md) (Task 5 moves `MessagePage`).
**Decision dimension:** implementation ownership. No product concept, vocabulary, route, identifier or stored value changes. User-visible additions are limited to the two failure fallbacks in section 4.2 (Q4).

## 1. Intent

Three pieces of failure and status handling are generic but live in `apps/web`, and one is missing:

| Today                                                                          | Evidence                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Five route error files repeat the same effect and layout                       | `app/error.tsx` (50 lines), `app/global-error.tsx` (77), `app/[userId]/home/{spaces,documents,dashboards}/error.tsx` (39 each). The three home files differ only in one noun. Each logs `{ digest }`, calls `reportCaughtError`, focuses `MESSAGE_HEADING_ID` and renders `MessagePage` with a Try again button.                                                            |
| A generic keyed-notice mechanism is bound to the app's notice list and to Next | `lib/routing/notices.ts` (types, timeouts, `isNoticeKey`, `noticeTimeout`, `withNotice`, plus five app notices) and `components/notices/notice-toast.tsx` (reads `?notice=`, shows the toast once, removes the parameter). `withNotice` is called by `auth/callback/route.ts`, `auth/delete-account/actions.ts` and `features/auth/server/actions/actions.ts`.              |
| No component-level error boundary exists                                       | No `ErrorBoundary`, `getDerivedStateFromError` or `react-error-boundary` in `apps` or `packages`. A widget body that throws in `features-dashboards` takes the whole route to `home/dashboards/error.tsx`. A Settings tab whose lazy chunk fails to load takes the whole Settings page to the root `error.tsx`.                                                             |
| Three load-failure alerts are hand-built the same way                          | `frontend-collection` `collection-index.tsx:157` (description is the safe error message, with an optional Sign in again link inside it), `features-spaces` `space-content.tsx:44` (description only), `features-dashboards` `dashboard-workspace.tsx:133` (title and description). Each is `Alert variant="destructive"` with `AlertDescription`, plus `AlertTitle` in one. |

`frontend-feedback` holds the generic mechanism for all four. It composes `frontend-ui` primitives (`toast`, `button`) and the `frontend-shells` page frame. It does not replace or re-implement them.

## 2. Goals, non-goals, anti-goals

**Goals**

- One complete, hand-written `ErrorBoundary` for parts of a page (Q2), integrated at every current place where a subtree can fail on its own (section 4.2).
- One `RouteErrorView` plus `useBoundaryEffects`, so each route error file only supplies its wording.
- The notice mechanism (types, default timeouts, key guard, `withNotice`, toast display, URL clean-up) becomes generic. The app keeps its notice list, the parameter name and where it mounts the bridge.
- One `InlineError` for failure messages inside a page, used by the boundary fallbacks and by the three load-failure alerts, which render the same markup as today.
- Every current behavior and test outcome is preserved (section 6).

**Non-goals**

- Notifications. The stored notifications capability in the [2026-10-17 notifications design](2026-10-17-notifications-design.md) has its own table, channels and unread state. Notices are short-lived and are not a first phase of it.
- Rewriting the existing direct `toast.add` calls (three in web Home, one in `features-account`). They can adopt `showNotice` later.

- The shadcn primitives (`toast`, `alert`, `alert-dialog`, `empty`, `skeleton`) stay in `frontend-ui`.
- Form messages, field feedback and first-error focus stay in `frontend-forms` (ADR-0015).
- `MessagePage` and `AuthPageShell` go to `frontend-shells` as planned (shells plan Task 5), not here (Q6).
- Route files (`error.tsx`, `global-error.tsx`, `not-found.tsx`, `loading.tsx`) stay in the app, because Next requires them as route entries.
- Loading and empty states: the three `loading.tsx` files render feature skeletons, and `WidgetEmpty`/`WidgetUnavailable` are feature copy.
- `apps/docs` has no route error files. Adding them would be new behavior, so it is not part of this change.

**Anti-goals**

- Not a general "UI/UX interactions" package. Anything that is not error containment or keyed notices stays out, so the package does not overlap `frontend-ui` or `frontend-shells`.
- No product copy. Notice wording, route error titles and descriptions, and fallback text stay in the app or the feature (ADR-0014 section 5). The only built-in text is the default retry label "Try again" (Q3).
- No new reporting path. Errors go through `frontend-error-reports`' existing consent-gated `reportCaughtError`.

## 3. Package and entries

`packages/frontend/feedback`, `@synapcity/frontend-feedback`. The name is a migration handle under the workspace naming rule, not product vocabulary. The glossary has no entry for feedback, notice or toast, and nothing user-facing is named.

| Entry       | Runtime                                                  | Contains                                                                                                  | Who imports it                                                                                              |
| ----------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `./notices` | Portable TypeScript. No React, no DOM, no `'use client'` | `Notice`, `NoticeType`, `NoticeAction`, `NOTICE_TIMEOUTS`, `noticeTimeout`, `defineNotices`, `withNotice` | App server code (Server Actions, the callback route) and the app's notice list. Safe on the server          |
| `.`         | React client                                             | `ErrorBoundary`, `InlineError`, `RouteErrorView`, `useBoundaryEffects`, `showNotice`                      | App route error files, `frontend-collection`, `features-dashboards`, `features-settings`, `features-spaces` |
| `./next`    | Next.js adapter                                          | `NoticeFromSearchParams`                                                                                  | App root providers                                                                                          |

Three entries (Q5): a Server Action that only builds a redirect path must not pull React client components through a root barrel (checklist section 3). Next stays behind `./next`, the `frontend-collection` and `frontend-shells` pattern.

### 3.1 Signatures

```ts
// ./notices
export type NoticeType = 'success' | 'info' | 'warning' | 'error';
export interface NoticeAction {
  label: string;
  href: `/${string}`;
}
export interface Notice {
  type: NoticeType;
  title: string;
  description?: string;
  timeout?: number; // 0 keeps it until dismissed
  action?: NoticeAction;
}
export const NOTICE_TIMEOUTS: Readonly<Record<NoticeType, number>>; // 5000 / 8000 / 10000 / 0, unchanged
/** 0 when the notice has an action (WCAG 2.2.1), else its own timeout, else its type's default. */
export function noticeTimeout(notice: Notice): number;

/** Returns the host's list with its own key guard (hasOwn, as today). */
export function defineNotices<const D extends Record<string, Notice>>(
  definitions: D,
): {
  notices: Readonly<Record<keyof D & string, Notice>>;
  isKey(value: string | null | undefined): value is keyof D & string;
};

/** Same-origin path with `param=key`, keeping query and fragment (today's withNotice, param explicit). */
export function withNotice(path: string, param: string, key: string): string;
```

```tsx
// .
export function showNotice(
  key: string,
  notice: Notice,
  options: { navigate: (href: string) => void },
): void; // toast.add with id `notice-${key}`, priority, timeout, action closes then navigates

export function useBoundaryEffects(
  error: Error & { digest?: string },
  label: string,
): void; // console.error(label, { digest }), reportCaughtError(error), focus MESSAGE_HEADING_ID

export function RouteErrorView(props: {
  error: Error & { digest?: string };
  retry: () => void;
  logLabel: string; // unchanged strings, e.g. 'Spaces failed to load'
  title: string;
  description: string;
  retryLabel?: string; // default 'Try again'
  children?: React.ReactNode; // further ways forward, e.g. a link home
}): React.JSX.Element;

/**
 * A failure message inside a page: frontend-ui Alert variant="destructive",
 * an optional AlertTitle, the AlertDescription, and an optional AlertAction.
 * Every string comes from the caller. Alert carries role="alert".
 */
export function InlineError(props: {
  title?: React.ReactNode;
  description: React.ReactNode; // a node, so a caller can keep a link inside it
  action?: React.ReactNode; // rendered in AlertAction, e.g. a Try again button
}): React.JSX.Element;

export type ErrorBoundaryFallbackProps = { error: unknown; reset: () => void };

export class ErrorBoundary extends React.Component<{
  children: React.ReactNode;
  fallback:
    React.ReactNode | ((props: ErrorBoundaryFallbackProps) => React.ReactNode);
  /** Called once per caught error. Defaults to reportCaughtError. */
  onError?: (error: unknown, info: React.ErrorInfo) => void;
  /** Called after reset() clears the error, before children render again. */
  onReset?: () => void;
  /** Clears the error when any entry changes (Object.is per index, or a length change). */
  resetKeys?: readonly unknown[];
}> {}
```

```tsx
// ./next
export function NoticeFromSearchParams(props: {
  param: string;
  notices: Readonly<Record<string, Notice>>;
  isKey: (value: string | null) => boolean;
}): null; // today's NoticeToast with the list and param supplied. Mount inside Suspense.
```

### 3.2 `ErrorBoundary` behavior (Q2: hand-written, complete)

React's `Component` reference (react.dev, checked 2026-10-25) says a class with `static getDerivedStateFromError` and `componentDidCatch` is still the only built-in way to write a boundary. It names `react-error-boundary` as optional. No dependency is added.

- `getDerivedStateFromError` stores `{ error }`. `componentDidCatch` calls `onError ?? reportCaughtError`. It does not call `console.error`, because React 19's default `onCaughtError` already logs caught errors and a second line would duplicate it.
- `reset()` clears the error, then calls `onReset`. It is stable for the instance's lifetime.
- `componentDidUpdate` compares `resetKeys` with the previous props and resets only while an error is held, so a key change after recovery does nothing.
- The fallback is either a node or a render function that receives `{ error, reset }`.
- The JSDoc lists what React's docs say a boundary does not catch: event handlers, asynchronous code such as `setTimeout` (functions passed to `startTransition` are caught), server-side rendering, and errors in the boundary itself. Callers handle those as values, as Server Actions already do.
- **Lazy components:** retrying a `React.lazy` component whose import rejected does not import again, because the lazy value keeps its rejected result. A caller that retries a lazy subtree must create a new lazy value in `onReset`. The JSDoc says this, and the Settings integration does it (section 4.2). The plan's first Settings test proves the claim before any fix.

## 4. Integration

### 4.1 App files

| App file                                                    | After                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/routing/notices.ts`                                    | Keeps the five definitions (copy), `NOTICE_PARAM`, and thin `NOTICES`, `isNoticeKey`, `NoticeKey` and `withNotice(path, key)` built from `defineNotices`/`withNotice`. Its three callers do not change. |
| `components/notices/notice-toast.tsx`                       | Deleted. Its tests move to the package (section 6).                                                                                                                                                     |
| `components/providers/root-providers.tsx`                   | Mounts `<NoticeFromSearchParams param={NOTICE_PARAM} notices={NOTICES} isKey={isNoticeKey} />` in the same Suspense boundary. The Toaster stays here.                                                   |
| `app/[userId]/home/{spaces,documents,dashboards}/error.tsx` | About 10 lines each: `<RouteErrorView>` with today's title, description and log label.                                                                                                                  |
| `app/error.tsx`                                             | `<RouteErrorView>` with the `LinkButton` home as a child.                                                                                                                                               |
| `app/global-error.tsx`                                      | Keeps `<html>`, `<body>`, the stylesheet, fonts, `ModeProvider` and the plain `<a>` (full reload on purpose). Uses `RouteErrorView`, which uses no router, user or Supabase client.                     |
| `app/not-found.tsx`                                         | Unchanged: it is not an error and has no effect to share.                                                                                                                                               |

### 4.2 Component boundaries (Q4)

The survey looked for every subtree that renders independently of its neighbours: `lazy` and `next/dynamic`, `Suspense`, host slots and per-item renderers. It found three places where a boundary changes the outcome today, and one future place:

| Where                                                                                                        | Boundary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Fallback (copy owned by the feature)                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `features-dashboards` `ConnectedWidget`, around the body (`AgendaBody` or `WidgetBody`) inside `WidgetShell` | `<ErrorBoundary resetKeys={[widget]} fallback={({ reset }) => <WidgetFailed onRetry={reset} />}>`. Placed inside the shell so its title and toolbar stay: the person can still move, hide or remove a broken widget. The other widgets keep working.                                                                                                                                                                                                                                                                                                                                                      | New `WidgetFailed` in `widgets/widget-states`, beside `WidgetUnavailable`: `<InlineError description="This widget could not be shown." action={<Button size="sm" variant="outline">Try again</Button>} />`.                                                                                                                                      |
| `features-settings` `SettingsTabs`, around each tab's `<Suspense>`                                           | `<ErrorBoundary onReset={() => retryTab(value)} fallback={({ reset }) => <SettingsTabFailed onRetry={reset} />}>`. `retryTab` increments that tab's attempt count, which is in the `lazyTabs` memo's dependencies, so the retry creates a new lazy value for that tab only (section 3.2). The tab strip and the other tabs keep working.                                                                                                                                                                                                                                                                  | New `SettingsTabFailed` in the settings frontend: `InlineError` with "This section didn't load." and the same Try again action.                                                                                                                                                                                                                  |
| `frontend-forms` `EntityFormDialog`, around the `FormRenderer` it passes to `EntityDialog` (M2)              | `<ErrorBoundary fallback={({ reset }) => <FormDialogFailed onRetry={reset} onClose={close} />}>`, using the `close` that `EntityDialog`'s render function supplies. A broken form inside a dialog, sheet or inline panel then offers a way out as well as a retry, instead of taking down the route. `EntityDialog`'s only caller is `EntityFormDialog`, and the agenda event dialog is built on it, so this one boundary covers every form dialog today. `EntityDialog` itself lives in `frontend-ui`, which cannot import `frontend-feedback` (cycle), so a future direct caller wraps its own content. | New `FormDialogFailed` in `frontend-forms`: `InlineError` with "This form could not be shown." and two actions, Try again (`variant="outline"`) and Close (`variant="ghost"`). The strings are generic component text owned by `frontend-forms` (ADR-0014 section 5), overridable through the existing `messages` prop as `messages.formFailed`. |
| `frontend-shells` `GlobalPanelShell` `panel` slot                                                            | Not added now: no app passes `globalPanel` yet. `frontend-shells` cannot import `frontend-feedback`, which imports shells, so it would be a cycle. The host that first supplies panel content wraps it in `ErrorBoundary`. The shells README says so.                                                                                                                                                                                                                                                                                                                                                     | Host's copy, when it exists.                                                                                                                                                                                                                                                                                                                     |

Both feature packages and `frontend-forms` gain a `@synapcity/frontend-feedback` dependency. Feature frontend to frontend is allowed by the matrix ("Yes"); `frontend-forms` to `frontend-feedback` is frontend to frontend (Conditional: public entry, acyclic).

### 4.3 Load-failure alerts adopt `InlineError`

The three alerts from section 1 switch to `InlineError`. Their wording stays in each file, and the rendered markup stays the same: the same `Alert` variant, the title only where there is one today, and no action, so `AlertAction` and its right padding do not appear.

| File                                            | After                                                                                                                                                                                                                                                                    |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `frontend-collection` `collection-index.tsx`    | `<InlineError description={<>{error.message}{signInLink}</>} />`. The Sign in again link stays inside the description, where it is today. `error.message` here is the `error` string of the host's `SetPinnedResult`, a message the host wrote, not an exception's text. |
| `features-spaces` `space-content.tsx`           | `<InlineError description="The documents and dashboards in this space could not be loaded. Try again in a moment." />`, comment kept.                                                                                                                                    |
| `features-dashboards` `dashboard-workspace.tsx` | `<InlineError title="This dashboard could not be loaded." description="Nothing was changed. Reload the page to try again." />`                                                                                                                                           |

`frontend-collection` and `features-spaces` gain the dependency. `features-dashboards` already gains it in section 4.2.

## 5. Dependencies and boundaries

- Runtime dependencies: `@synapcity/frontend-ui` (`core/toast`, `core/button`, `core/alert`), `@synapcity/frontend-shells` (`MessagePage`, `MESSAGE_HEADING_ID`, after shells Task 5), `@synapcity/frontend-error-reports` (`reportCaughtError`), `react`, and `next` for `./next` only. All are existing workspace packages or pins. No new third-party dependency.
- Every edge to the package is allowed by ADR-0014: frontend to frontend is Conditional (explicit public entries, acyclic), and feature frontend and app entries to frontend are Yes. `frontend-ui`, `frontend-shells` and `frontend-error-reports` must never depend on `frontend-feedback`, and `frontend-feedback` must never depend on `frontend-collection` or `frontend-forms`, which now depend on it. R9 (cycles) enforces this.
- `./notices` stays free of React and `'use client'`. A purity test asserts this, in the same way `frontend-forms`' `purity.test.ts` does.
- `next` is imported only under `src/next/` (R11). No boundary exception is added.
- Knip: every export has a consumer when it lands (section 4).

## 6. Preservation contract

**Unchanged:**

- **Notice behavior:**
  - Keys, the `notice` parameter, wording, types and timeouts. An error stays until dismissed (WCAG 2.2.1).
  - One deliberate change (M2): a notice with an action now stays until dismissed, whatever its type or `timeout`, so a keyboard or screen-reader user can reach the button. None of the five current notices has an action, so nothing anyone sees changes today.
  - Toast id `notice-${key}`. Error priority is `high`, all others `low`. The action closes the toast and then navigates.
  - A notice shows once, even when effects run twice. It shows again after its parameter has been removed.
  - Only the `notice` parameter is removed, with `scroll: false`. Unknown and inherited keys are ignored.
  - `withNotice` keeps the query and fragment and replaces an existing notice.
- **Route errors:** every title, description and console label, `{ digest }`-only logging, consent-gated reporting, focus on the heading, retry, and the link home on the root and global error pages.

**Tests move with the code:**

- The 8 `notice-toast.dom.test.tsx` cases and the 2 `notice-toast-action` cases go to `src/next/`.
- The generic `notices.test.ts` cases (`isNoticeKey`, `noticeTimeout`, `withNotice`) go to `src/notices/`.
- The wording cases (`NOTICES`, the email, account-connected and account-deleted notices) stay in the app, beside the copy.
- The `message-page` tests move with `MessagePage` in shells Task 5, not here.

**New tests:**

- `useBoundaryEffects`: logs, reports and focuses.
- `InlineError`: `role="alert"` and the destructive variant, title present or absent, description as text and as a node with a link, the action rendered in `AlertAction` and absent when not given.
- The three adopted alerts: their existing tests stay green unchanged, and a before/after DOM comparison of each (title, description and link markup) shows no difference.
- `RouteErrorView`: one h1, retry, the default and a custom retry label, and children.
- `ErrorBoundary`: node and render-prop fallbacks, `reset`, `onReset` order, `resetKeys` (changed, unchanged, length change, change after recovery), `onError` defaulting to `reportCaughtError`, and siblings outside the boundary surviving.
- One test per route error file: its wording and label.
- `WidgetFailed`, and a dashboard grid where one widget throws and the others render.
- Settings: a tab whose import rejects shows the fallback, and Try again imports again and renders.
- `noticeTimeout`: a notice with an action returns 0 for every type, including when it sets its own `timeout`.
- `EntityFormDialog`: a definition whose renderer throws shows `FormDialogFailed` inside the dialog; Close calls `onOpenChange(false)`; Try again renders the form again; a custom `messages.formFailed` replaces the text.

**Stories:** `InlineError`, `RouteErrorView`, the `ErrorBoundary` fallback, `WidgetFailed`, `SettingsTabFailed` and `FormDialogFailed`, with axe checks via `pnpm test:storybook`.

## 7. Records to update

**Workspace conventions, package inventory** (after the `frontend-error-reports` row):

```md
| `frontend-feedback` | Error containment and keyed notices: component error boundary, generic inline error, route error view and boundary effects, notice registry and toast bridge with a `./next` binding. Composes `frontend-ui` and `frontend-shells`; holds no product copy | <date> (exists) |
```

Add one sentence to the milestone paragraph naming the plan that created the package.

**Ownership map:**

- **Row `components/notices`:** the owner becomes `frontend-feedback` (`./next`) plus a web binding. The delivery mechanism (read the key, show it once, clear the parameter) moves to the package. The notice list, the parameter name and the mount point stay with the host. Product results and copy stay with their feature, and the toast primitive stays in `frontend-ui` (Q1, approved).
- **Row `app ... error boundaries`:** route error files keep their wording and their Next entry. The shared view and effect come from `frontend-feedback`.
- **New row in the package table beside `error reports`:** `frontend-feedback` owns the component boundary, the route error view, the boundary effects and the notice mechanism. It renders only generic structure and the default retry label; copy comes from callers. It reports through `frontend-error-reports`.

**READMEs:**

- `packages/frontend/README.md` lists the package.
- `packages/frontend/feedback/README.md` has an `Owns:` statement and the entry table from section 3.
- `packages/frontend/shells/README.md` notes that hosts wrap the global panel content.

## 8. Sequence

1. **Starting conditions:** implementation starts after shells plan Task 5 has merged into `main`, from a clean branch off `main`. It stops if the uncommitted `root-providers.tsx` edits in the shells checkout are still open (ADR-0014 section 6, overlapping edits).
2. **Order:** scaffold, notices, bridge, route errors, `InlineError` and the three alerts, `ErrorBoundary`, dashboards, settings, form dialogs, records and verification. Each step is a checkpoint, and the [plan](../plans/2026-10-25-frontend-feedback.md) has the steps.

## 9. Owner decisions (2026-10-25)

| #   | Question                                                                                 | Decision                                                                                                                                      |
| --- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Approve the package and the ownership-map change moving notice delivery out of the host? | Approved.                                                                                                                                     |
| Q2  | Hand-written `ErrorBoundary` or `react-error-boundary`?                                  | Hand-written, complete and accurate, and integrated wherever a subtree can fail on its own (sections 3.2 and 4.2).                            |
| Q3  | May the package own the default retry label "Try again"?                                 | Yes, overridable through `retryLabel`.                                                                                                        |
| Q4  | Wrap each dashboard widget in `ErrorBoundary`, with a fallback in `features-dashboards`? | Yes. Section 4.2 places it around the widget body, and also covers the Settings lazy tabs under Q2.                                           |
| Q5  | Three entries or two?                                                                    | Three: `./notices`, `.`, `./next`.                                                                                                            |
| Q6  | Wait for shells Task 5, or move `MessagePage` here first?                                | Wait for Task 5.                                                                                                                              |
| M1  | Merge parts of the parallel draft?                                                       | Yes: `InlineError` and the three alerts (4.3), the notifications non-goal, and section 11 as separate follow-ups.                             |
| M2  | Fold in findings from the previous implementation?                                       | Yes: action notices never time out (3.1, 6), the form dialog boundary with Close (4.2), follow-ups 11.3 and 11.4, and section 12 as evidence. |

## 10. What this does not decide

Toast placement, limits or styling. New notices. Reporting scope, consent or Sentry settings. Loading or empty states. A `global-not-found` route. Route error files for `apps/docs`. Error handling in event handlers or async code. Any change to how Server Actions return expected failures.

## 11. Follow-ups found in the survey (separate changes)

These came out of the parallel draft's survey. They extend components that `frontend-ui` already owns, and the design rules say to extend the component you own. They do not need `frontend-feedback`, and each one is its own scoped change after this one.

**11.1 Extend `ConfirmDialog`.** `frontend-ui/components/confirm-dialog` is controlled only (`open`, `onOpenChange`, `onConfirm`) and is used only by `entity-dialog` and `item-actions-menu`. Five places assemble `AlertDialog` by hand instead:

| File                                            | Why it could not use `ConfirmDialog`                           |
| ----------------------------------------------- | -------------------------------------------------------------- |
| `features-auth` `connected-accounts.tsx`        | Its own trigger, and a pending server action with a busy label |
| `features-auth` `delete-account.tsx`            | A form inside the dialog and a sent-state body                 |
| `features-dashboards` `widgets-panel.tsx`       | Its own trigger                                                |
| `features-settings` `import-export-rows.tsx`    | Its own trigger                                                |
| `features-settings` `unsaved-changes-guard.tsx` | Controlled, but the body is a computed list                    |

The proposed extension adds three optional props, so the two current callers do not change: `trigger` (uncontrolled mode), `pending` with `pendingText` (disables confirm, sets `aria-busy`), and a `children` body. Four of the five fit. `delete-account` probably stays hand-built, because it is a two-state form flow rather than a confirmation.

**11.2 Widen `LoadingRegion`.** It renders `aria-busy` and an `sr-only` `role="status"` label but hard-codes `gap-10`. Checked on `main`:

- `collection-page.tsx` and web's `home-empty-recent-skeleton.tsx` copy the whole pattern.
- `collection-loading.tsx` has two `role="status"` regions without `aria-busy`.
- `dashboard-workspace-skeleton.tsx` has `aria-busy` without a status label.

A layout-only `className` prop, which the design rules allow, would let the first two use it. The follow-up decides whether the other two should announce the same way.

**11.3 Pending states without flicker (M2).** The previous implementation's `useActionStatus` waited 100 ms before showing a pending indicator and then kept it at least 250 ms, so a quick action never flashed a spinner and a slow one never blinked off just after it appeared. Today `LoadingRegion` and the feature skeletons show at once. The follow-up adds the two delays to whichever owner holds pending state at that point (`LoadingRegion` in `frontend-ui`, or the `frontend-forms` submit state), with reduced motion respected and both values named once.

**11.4 Deduplicate repeated toasts (M2).** The previous toast store ignored a toast whose text and type matched one shown in the last 1,000 ms, which stopped a double click or a retried request from stacking identical toasts. `showNotice` already deduplicates redirect notices by id. The four direct `toast.add` calls (three in web Home, one in `features-account`) have no guard beyond the Toaster's `limit={5}`. The follow-up moves them to `showNotice` or a sibling helper with a key, so a repeat replaces the toast instead of adding one.

**11.5 Looked at, no change.**

- **Empty states:** `collection-empty` and `dashboard-empty-state` compose `Empty` with their own wording, which is the intended use.
- **`<p role="status">` lines:** about ten in auth, settings and widgets. Most sit inside forms that `frontend-forms` `FormMessage` already covers, so moving them is per-feature cleanup.
- **Direct `toast.add` calls:** the Home ones say "Created new …" for creation flows that may not save anything yet. Whether that is a fake-success handler is for the Home migration (M9) to check under ADR-0014 section 6.

## 12. Evidence from the previous implementation (2026-10-25)

Read from `code-library/quarantine/batch-02/synapcity-monorepo.zip`, only `packages/domain/feedback`, `packages/ui/feedback`, `packages/ui/patterns/src/states`, `packages/ui/forms/src/error-handling` and `packages/platform/state/src/errors`, about 18,000 lines including the `.notes` audits. They were extracted to a scratch folder and nothing was run. This is evidence, not authority (AGENTS section 4): each point below was weighed against this design, and only M2's four were adopted.

**Adopted (M2).**

| Previous code                                                                 | What it showed                                                                    | Where it went              |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------- |
| `constants.ts` `TOAST_WITH_ACTION_DURATION = 0`                               | A toast with a button stayed until dismissed                                      | `noticeTimeout` (3.1, 6)   |
| `modal-error-boundary.tsx`                                                    | A failed dialog offered Close as well as Try again, so the person was not trapped | Form dialog boundary (4.2) |
| `status/use-action-status.ts` `debounceDelay: 100`, `minDisplayDuration: 250` | Pending indicators that neither flash nor blink off                               | Follow-up 11.3             |
| `store-utils.ts` `isDuplicate`, `TOAST_DEDUP_WINDOW = 1000`                   | Identical toasts within a second were dropped                                     | Follow-up 11.4             |

**Confirmed by the previous code's problems.**

- **Three boundaries, three behaviors.** `FeedbackErrorBoundary`, `ModalErrorBoundary` and `patterns` `ErrorBoundary` each caught, logged and fell back differently, one with inline `style` colours. This design has one boundary.
- **Exception text shown to people.** All three boundaries rendered `error.message`, the patterns fallback put it in the description, and `useAsyncOperation` passed `err.message` into an alert. This design never shows or logs the message (anti-goals).
- **Timers on decisions.** `ModalErrorBoundary` closed a failed dialog after 5 s, `confirm()` rejected after 30 s (`MODAL_DEFAULT_TIMEOUT`), and errors auto-dismissed after 7 s. Here errors and action notices stay until dismissed, and dialogs have no timeout.
- **Two sources of truth for toasts.** A Zustand store mirrored into `sonner` by a renderer that tracked shown ids, with sync and cleanup bugs that needed a dedicated memory test suite. This design calls the Base UI toast manager directly.
- **Global stores and a provider.** Toast, modal, alert and status stores behind a `FeedbackProvider`, plus `framer-motion` and `sonner`, about 47 KB gzipped by the old audit's estimate. Not repeated.
- **Configuration flags instead of composition.** `StatusBar` switched eight indicators with `show*` booleans, which the workspace composition rule forbids.
- **Live regions misused.** `FormErrorSummary` set `role="alert"` with `aria-live="polite"`, which conflict, and the status badges put `role="status"` on an element whose text was only an `aria-label`. `InlineError` relies on the `Alert` primitive's `role="alert"` and visible text.
- **Motion without a reduced-motion path.** `ErrorDisplay` shook horizontally on every error.
- **Notifications as part of feedback.** `.notes/NOTIFICATIONS.md` planned stored notifications as a `notification/` folder in the feedback packages. The 2026-10-17 notifications design keeps them separate (non-goals).

**Noted, not adopted.**

- **Cancelled is not failed.** `CancelledDisplay` treated a cancelled action as its own state with a retry, not an error. Features that add cancellable actions should not report or show an abort as a failure; this is for those features, not this package.
- **An error summary for forms.** `FormErrorSummary` listed every field error with a button that moved focus to the field. `frontend-forms` focuses the first error but has no summary. A candidate for `frontend-forms`, if a long form needs it.
- **A page-level alert region.** `AlertBanner` showed dismissible alerts posted to a named context from anywhere in the app. Nothing here needs it yet, and a global store would be needed to copy it.
- **Promise toasts and undo.** `useToast().promise` changed one toast from loading to success or error, and `forEntity` offered Undo. Notices report finished work, so Undo needs its own operation (`notices.ts`). A loading-to-result toast is for whichever feature first needs one.
