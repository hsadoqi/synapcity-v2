# Synapcity shared frontend layer: architecture audit (read-only)

**Date:** 2026-11-11
**Scope:** all packages under `packages/frontend/`, with consumers in `packages/features/`, `packages/domain/`, `apps/web`, `apps/docs` and `apps/storybook` inspected as evidence.
**Mode:** read-only. Nothing in the repository was created, edited, moved, staged, committed or pushed.

---

## 0. Baseline: the expected commit is not in this branch

- **Repository:** `hsadoqi/synapcity-v2`. **Branch:** `refactor/great-faraday-8acvp5`. **HEAD:** `87ab15b1`, identical to `origin/main`. The worktree was clean.
- **`6e949e43` is not an ancestor of HEAD.** After unshallowing and fetching every remote branch, it exists only on `origin/feat/register-auth-flow`, 24 commits ahead of HEAD.
  - Those 24 commits are the domain refactor, including `64b0980b` ("move value codecs to frontend-forms").
  - The frontend difference between the two is 22 files: the forms `date-value`/`time-value` codecs, preferences `date-time`, ui `calendar-utils`, and blocks `nl-date-picker`.
- **What I did about it:** I did not audit HEAD silently, and I did not switch branches. I extracted `6e949e43` with `git archive` into the session scratchpad and audited and verified that copy. Every finding below is against `6e949e43`. Wherever HEAD and the baseline differ for a finding, I say so; outside the codec relocation, they are identical.
- **Side effects, all inside `.git` only:**
  - The clone was unshallowed.
  - Remote-tracking refs were fetched for all branches, plus 131 `refs/remotes/pr/*` heads.
  - Nothing in the working tree, branch, index or stash changed.
  - To remove the PR refs:

    ```bash
    git for-each-ref --format='%(refname)' refs/remotes/pr | xargs -n1 git update-ref -d
    ```

- **Setup:** the cloud environment has no setup script, and `node_modules` was absent, so nothing ran automatically.

---

## A. Executive assessment

The shared frontend layer is in good shape at the implementation level, and weaker in its build wiring and in two package boundaries.

**Strengths**

- The hooks are carefully engineered:
  - `useMediaQuery`, `useCanCollect` and `useRegional` use `useSyncExternalStore` correctly, with server snapshots and listener cleanup.
  - `useKeyboardShortcut` uses `useEffectEvent` and respects IME composition, key repeat, page visibility and editable targets.
- The forms engine handles hard cases: async validation with abort, dedupe and timeout; focus restoration; progressive enhancement through server actions.
- `frontend-preferences`, `frontend-error-reports` (consent-gated, lazy-loaded SDK, event scrubbing), `frontend-supabase` and `frontend-shells` have clear ownership, explicit entries and good documentation.
- Lint, type checks, Knip, the boundary checker and all 1,680 frontend unit/component tests pass.

**Major weaknesses**

1. **A shipped visual defect, invisible to the test suite (FE-01).** Web's Tailwind source list omits `frontend-blocks`. As a result, `ActionsToolbar`'s responsive behavior and `ModeToggle`'s icon swap are missing from production CSS. Storybook scans blocks, so story tests pass.
2. **`frontend-blocks` has no ownership statement (FE-04).** Its root barrel mixes production blocks with a demo app shell and demo data. It has become a second component layer that `forms`, `collection` and `shells` all depend on.
3. **The "portable" contract leaks.** Root entries reach `next/link` through `frontend-ui/next/*`, and the R11 boundary rule cannot see it (FE-05). There are two duplicate host-link abstractions (FE-06).
4. **Unresolved single-owner questions:** tokens (FE-09), the calendar-date codec (FE-07), and form feedback types (FE-10).

**Risk posture:** one High finding, nine Medium, the rest Low. Nothing Critical, nothing security-relevant, and no server code is reachable from frontend code (the boundary checker's R3 rule passes).

---

## B. Frontend package inventory

| Package                    | Purpose and actual responsibility                                                                                                                             | Public API                                                                                       | Runtime deps (workspace)                                        | Main consumers                                             | Tests / stories | Notes                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- | ---------------------------------------------------------- | --------------- | ---------------------------------------------------------- |
| `frontend-ui`              | shadcn/Base UI primitives (43 components), generic hooks, calendar and combobox utilities, Next `LinkButton`                                                  | `./core/*`, `./components`, `./components/*`, `./hooks/*`, `./lib/*`, `./next/*`, `./styles.css` | brand, preferences, tailwind-config, tokens, domain-preferences | Every frontend and feature package, web, docs              | 50 / 44         | FE-05, FE-09, FE-13                                        |
| `frontend-blocks`          | Composed blocks (ActionsToolbar, ConfirmDialog, EntityDialog, DayAgenda, UserMenu, ModeToggle…) **plus** a demo Workbench shell, demo data and NL date picker | `.` only, through an `export *` chain                                                            | ui, preferences, domain-identity, domain-preferences            | forms, collection, shells, features-dashboards, web        | 27 / 26         | **No README.** FE-01, FE-04                                |
| `frontend-forms`           | Schema-driven form engine, field renderers, `useActionForm`, focus, async validation, date/time codecs                                                        | `.`                                                                                              | ui, blocks, react-hook-form, zod                                | features-auth, -account, -dashboards                       | 38 / 5          | FE-07, FE-10–12                                            |
| `frontend-collection`      | Browse projections, query/filter/sort, collection displays, entity cards                                                                                      | `.`, `./next`                                                                                    | ui, blocks, domain-records                                      | web, features-spaces                                       | 27 / 48         | FE-06, FE-08                                               |
| `frontend-shells`          | Root, auth, public and message shells; sidebar; global and contextual panels; breadcrumbs; command palette                                                    | `.` (curated), `./next`                                                                          | ui, blocks, brand                                               | web, docs                                                  | 20 / 18         | FE-06, FE-14                                               |
| `frontend-preferences`     | Device store, mode provider, regional formatting, consent hooks, boot scripts, look cookie                                                                    | `.`                                                                                              | domain-preferences, next-themes                                 | ui, blocks, shells, error-reports, features-settings, apps | 19 / 1          | FE-02, FE-03                                               |
| `frontend-error-reports`   | Consent-gated Sentry, event scrubbing                                                                                                                         | `.`                                                                                              | preferences                                                     | web                                                        | 3 / 0           | Sound                                                      |
| `frontend-supabase`        | Browser client factory, auth-event refresh rule                                                                                                               | `.`                                                                                              | `@supabase/*`                                                   | web, features-auth                                         | 2 / 0           | Sound                                                      |
| `frontend-site`            | Site facts, metadata, Open Graph card                                                                                                                         | `./site`, `./metadata`, `./open-graph`                                                           | brand                                                           | web, docs                                                  | 2 / 0           | Carries a named R11 exception for the Next `Metadata` type |
| `frontend-brand`           | Logo geometry, SVG builders, React marks, assets                                                                                                              | `./geometry`, `./manifest`, `./svg`, `./react`, `./assets/*`                                     | —                                                               | ui (shim), shells, site                                    | 5 / 0           | Sound                                                      |
| `frontend-fonts`           | `next/font` loaders                                                                                                                                           | `./next`                                                                                         | next                                                            | apps, tailwind-config test                                 | 2 / 0           | Sound                                                      |
| `frontend-tailwind-config` | **Canonical** tokens (ADR-0002), theme mapping, PostCSS config                                                                                                | `.`, `./tokens/*`, `./postcss`                                                                   | tw-animate-css                                                  | ui styles                                                  | 1 / 0           | Owner of tokens                                            |
| `frontend-tokens`          | **Candidate** "Precision Canvas" tokens and self-hosted fonts                                                                                                 | `./tokens.css`, `./tailwind-theme.css`                                                           | —                                                               | ui styles (loaded in production)                           | 1 / 0           | FE-09                                                      |

Approximate non-test, non-story source size: ui 6,314 lines; collection 4,406; forms 4,165; blocks 4,043; shells 2,521; preferences 920; brand 504; error-reports 271; site 116; supabase 49; fonts 37. Largest files: `ui/.../sidebar.tsx` (754), `ui/.../combobox.tsx` (489), `forms/.../form-renderer.tsx` (441), `shells/.../contextual-panel.tsx` (416), `shells/.../global-panel.tsx` (393), `blocks/.../entity-dialog.tsx` (382).

---

## C. Ownership and dependency map

The production dependency graph is acyclic (the boundary checker's cycle rule passes):

```
apps/web ─► shells ─► blocks ─► ui ─► preferences ─► domain-preferences
   │          │         │       ├──► brand, tokens(candidate), tailwind-config
   │          │         │       └──► domain-preferences
   │          └──► brand└──► preferences, domain-identity, domain-preferences
   ├─► collection ─► blocks, ui, domain-records
   ├─► forms ─► blocks, ui            (domain-time removed by the 6e949e43 refactor)
   ├─► error-reports ─► preferences
   ├─► supabase, site ─► brand, fonts
   └─► features-{auth,account,settings,spaces,dashboards} ─► ui, blocks, forms, collection, preferences
```

Consumer counts (files importing each package, outside the package itself):

- `frontend-ui`: web 29, docs 3, features-settings 30, -dashboards 24, -auth 19, -account 13, -spaces 2, blocks 61, collection 36, shells 30, forms 19.
- `frontend-blocks`: web 3, features-dashboards 3, collection 6, forms 4, shells 6.
- `frontend-collection`: web 33, features-spaces 11.
- `frontend-forms`: features-auth 12, -account 3, -dashboards 2.
- `frontend-shells`: web 31, docs 1.
- `frontend-preferences`: features-settings 24, shells 11, blocks 5, web 5, ui 2, docs 2, error-reports 1, Storybook config 3.

**Structural observations**

- `blocks` is depended on by `forms`, `collection` and `shells`, so in practice it is a second foundation tier.
- `ui` depends on `preferences` (for regional date formatting), so the lowest primitive layer is not preference-free.
- Shared frontend behavior also lives outside `packages/frontend/`:
  - dashboards' `LiveAnnouncer`, `SaveStatus` and `WidgetStates`;
  - settings' private layout hook (`use-settings-layout`);
  - web's `components/route-messages`;
  - the web playground's own providers (`playground/ui-providers.tsx`, which nests a second `<Toaster/>` on the shared global toast manager inside the root providers; app-owned prototype route, low severity).

---

## D. Package-by-package findings

- **ui:** primitives are healthy.
  - The export surface is triplicated (FE-13).
  - `core/skip-link` imports Next (FE-05).
  - The logo-mark shim has zero consumers, so its own removal condition is met (FE-13).
  - The `build` script emits `dist/` that nothing consumes, and `generate:component` points at a turbo generator that doesn't exist (FE-15).
- **blocks:**
  - There is no README.
  - `src/index.ts` exports `./data`: demo `WORKSPACES` and `NAV`, with `images.unsplash.com` avatars and "ReUI Labs"/"Acme Robotics".
  - It also exports a Workbench app shell, `MainSidebar*`, `SidebarIconRail`, `WorkspaceDropdown`, `NlDatePicker` (with the `chrono-node` dependency), `CommandSearch`/`DEFAULT_ACTIONS` and `TimePicker`.
  - About 17 of these exports have **no production consumer**. Only `MainSidebarShell` is used, by the web playground.
  - Domain-shaped components (`DayAgenda`, `UserMenu`, `SettingsView`) each have one or two consumers (FE-04, FE-18).
  - `sidebar-icon-rail` no longer imports `next/link`, so that part of the prior audit's D2 is resolved.
- **forms:**
  - The codec relocation **is integrated**: the date-picker, date-range and time renderers import `utils/date-value` and `utils/time-value`, and `domain-time` was removed from the manifest.
  - The same rule still exists in ui (FE-07).
  - There are two field frames and four feedback types (FE-10).
  - Action mode has no re-entrancy guard (FE-11).
  - Submit mode cannot express expected field failures (FE-12).
  - The README's dependency list omits `blocks` (FE-15).
  - `isTimeValue` intentionally rejects fractional seconds that `timeOfDaySchema` accepts; such a stored value displays as empty but stays unchanged unless edited (low risk, documented in code).
- **collection:** `CollectionIndex` copies props into state, silently ignores three action types, and its optimistic pin has no ordering guarantee (FE-08). Its navigation context duplicates shells' (FE-06).
- **shells:**
  - The curated root export is the best entry in the layer.
  - Panel machinery is duplicated, and there is a production `TODO` at `global-panel.tsx:3`.
  - `showingSettings` survives closing and reopening the global panel (FE-14).
  - Breadcrumbs follow ADR-0017's single-publisher rule; shortcut ownership is centralized in `utils/shortcuts`.
- **preferences:** strong overall. `useMode` is the outlier (FE-02, FE-03). `usePrefersDark` duplicating `useMediaQuery` is acceptable, because preferences cannot import ui.
- **error-reports, supabase, brand, fonts, site:** no actionable findings beyond the documented R11 exception on `site/src/metadata.ts`. Web's error boundaries correctly call `reportCaughtError`.
- **tailwind-config vs tokens:** two token owners in shipped CSS (FE-09).

---

## E. Cross-package architectural findings

| Area                                                                                                                             | Classification                                              | Recommendation                                                   |
| -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------- |
| Host link/navigation: `ShellNavigation` vs `CollectionNavigation`; blocks and ui import Next directly                            | Accidental duplication / missing shared capability          | One link capability at the lowest layer (FE-06)                  |
| Calendar date `yyyy-MM-dd`: ui `parseCalendarDate` vs forms `fromDateValue` (plus 2 copies in `domain-prototypes`, out of scope) | Accidental duplication                                      | One frontend owner (FE-07)                                       |
| Element-width `ResizeObserver` (contextual panel, sidebar shell, `useVirtualList`) and the glide timer ×2                        | Missing shared functionality (small)                        | A shells-local `useElementWidth` / `useGlide`                    |
| Feedback types: `FormFeedback`, `FieldFeedbackState`, `FormMessageState`, `ActionFormRefusal`                                    | Accidental duplication                                      | One exported contract (FE-10)                                    |
| Field frames: `FormField` vs `FieldFrame` (on ui `Field`)                                                                        | Duplication; ADR-0015 left it open                          | Converge on `FieldFrame`                                         |
| Live and status announcers (dashboards `LiveAnnouncer`, forms `FormMessage`, blocks `LoadingRegion`)                             | Legitimate independent semantics, but the same a11y pattern | Shared `StatusRegion` primitive only if FE-16 is confirmed in AT |
| App shell: blocks `Workbench*`/`MainSidebar*` vs shells `RootShell`/`SidebarShell`                                               | Second implementation (prior audit D2, still open)          | Owner decision (L-1)                                             |
| Search: blocks `SearchInput` vs collection `CollectionSearch` (prior D9)                                                         | Near duplicate                                              | Low priority; migrate `CollectionSearch`                         |
| `usePrefersDark` vs `useMediaQuery`                                                                                              | Acceptable repetition (dependency direction)                | Keep                                                             |
| Save status / async state (dashboards vs settings vs forms)                                                                      | Legitimate independent behavior                             | Do not force one component                                       |

---

## F. Structural convention evaluation

- **Retain:**
  - shells' explicit, curated root `index.ts`;
  - per-package `./next` adapter entries;
  - ui's one-folder-per-component layout, with a story and test enforced by `package-structure.test.ts`;
  - preferences' capability folders (`store/`, `scripts/`, `providers/`, `hooks/`).
- **Simplify:**
  - forms' `utils/index.ts` re-exports `components/form-engine/*` (the engine sits under `components/` although most of it isn't components). Move `form-engine/` to `src/engine/`.
  - blocks' root `export *` chain should become an explicit export list like shells'.
- **Change:** replace blocks' flat mix of `main-*`, `sidebar-rail`, `data` and `types` at the `src/` root with the layout in J.
- **Do not impose uniformity:** collection's one folder per component (48 stories) is fine. Forcing preferences or error-reports into the same layout would add nothing.
- **Recommended frontend convention:**
  - an explicit root export list;
  - `./next` for framework adapters;
  - `src/testing/` never exported;
  - capability folders for runtime packages, component folders for presentation packages;
  - one README ownership paragraph per package, enforced by the package checklist.

---

## G. State and interaction architecture

- **External stores:** correct. `useSyncExternalStore` is used with server snapshots, and the storage and GPC listeners clean up properly.
- **Mode:** `useMode` derives the system mode from `matchMedia` inside `useMemo([theme])`, with no subscription (FE-03). Its consumer `ModeToggle` shows the wrong selection (FE-02). Settings uses `nativeMode` correctly.
- **Optimistic and derived state:** `CollectionIndex` owns a copied list and optimistic pin state inside a generic package. ADR-0014 §5 assigns drafts and optimistic projections, plus their prop-refresh rules, to features (FE-08).
- **Forms:**
  - RHF integration, async validation (aborts, never rejects) and focus handling are solid.
  - Gaps are a double-submit window in action mode (FE-11) and no expected-failure channel in submit mode (FE-12).
  - The registration form/action mismatch is not mine and not assessed.
  - In flight: `fix/r2-form-dialog-pending-dismissal` (unmerged) addresses `FormDialog`/`EntityDialog` being dismissed while saving.
- **Overlays and panels:** global-panel Escape and outside-click coordination is careful. Shortcut ownership is centralized in `shells/utils/shortcuts`. Breadcrumbs follow ADR-0017's single-publisher rule.
- **Feedback:**
  - Error boundaries are host-owned (web `error.tsx` files call `reportCaughtError`), which is correct.
  - There is no shared save-status or async-state contract. That is acceptable: dashboards' semantics differ.
  - Expected vs unexpected failures are distinguished in action results (`{error, fields}`) but not in submit mode.

---

## H. Accessibility and performance

**Confirmed**

- FE-01: the toolbar always collapses to "More actions" in web. The Moon/Sun icons depend on missing `scale-0` utilities, so the icon no longer reflects the mode. The CSS absence is measured; the exact visual result is inferred and has not been seen in a browser.
- FE-02: assistive-technology users are told the wrong mode is selected (`aria-checked` sits on Light or Dark when System is chosen).

**Credible risks (need a browser or AT pass)**

- `LoadingRegion` places its `role="status"` inside an `aria-busy="true"` container. Some AT holds back announcements inside busy regions, and the region unmounts when loading ends.
- `FormMessage` mounts `role="status"` together with its text, so a success message may not be announced.
- `IconButton` doesn't require an accessible name in its type. Current call sites all pass `aria-label`.

**Performance**

- Measured on the web production build: unconsumed blocks code (demo data, Unsplash URLs, `chrono-node`, Workbench) is **tree-shaken out of client chunks**. FE-04 is therefore an API and ownership problem, not a bundle problem.
- No render loops, missing listener cleanup or hydration hazards were found. The one exception is FE-03 (SSR resolves `'light'`, but nothing renders from it before mount today).
- Candidate fonts: `@font-face` rules for Inter and JetBrains Mono ship alongside the `next/font` faces, a possible duplicate download (FE-09).

---

## I. Findings register

### FE-01 · High · Verified defect: web and docs never generate `frontend-blocks`-only Tailwind utilities

- **Files:**
  - `apps/web/src/styles/globals.css:5-16` (no `@source` for `packages/frontend/blocks/src`);
  - `apps/docs/.../globals.css` (scans only ui and shells);
  - `apps/storybook/styles/globals.css` (missing `forms/src`; stale `ui/src/blocks/` entry);
  - `packages/frontend/blocks/src/blocks/actions-toolbar/actions-toolbar.tsx`;
  - `packages/frontend/blocks/src/blocks/mode-toggle/mode-toggle.tsx:31-32`.
- **Evidence:**
  - Compiled web CSS: 78 of 240 class tokens used in blocks appear in no web-scanned source.
  - Production `.next` CSS has 0 matches for `@container/actions`, `@toolbar-icons/actions:*`, `@3xs/actions:*`, `dark:scale-0` and `scale-0`.
  - The Storybook build has all of them, because it scans `blocks/src`.
  - Grep patterns were sanity-checked against classes that do exist (`hover:bg-accent`, `min-w-0`, `size-4`).
- **Root cause:** each host keeps its own `@source` list. Blocks was added as a dependency without updating web or docs.
- **Impact:**
  - `ActionsToolbar` icon buttons are permanently `display:none` in every web host: dashboard widget Pin/Lock, the global panel, the resource frame. Actions remain reachable through "More actions".
  - `'auto'` settings presentation never shows the dialog trigger.
  - `ModeToggle` shows both icons overlapping.
  - Any future blocks-only class silently fails the same way.
  - Web e2e selects "Theme" by accessible name, so it cannot catch this.
- **Affected:** web (root header, sidebar, dashboards, global panel, resource frame); docs (shells' header).
- **Fix:**
  - Immediate: add the `@source` for blocks to web and docs. In Storybook, also add forms (`empty:hidden` is missing) and drop the dead `ui/src/blocks/` entry.
  - Structural: have each package that renders classes ship its own `@source` (or a `styles.css` entry), so hosts don't maintain lists. Add a script test that every frontend or feature workspace a host depends on is covered.
- **Tests:** an e2e assertion that a widget's Pin icon button is visible at default width; a host source-coverage unit test.
- **Migration risk:** none. Adding sources only adds CSS.
- **Overlap:** features-dashboards renders the toolbar (feature reconciliation needed only for the e2e test).

### FE-02 · Medium · Verified defect: `ModeToggle` can never show "System" as checked

- **Files:** `blocks/src/blocks/mode-toggle/mode-toggle.tsx:81,88`; `preferences/src/providers/mode-provider/mode-provider.tsx:34-55`; `preferences/src/utils/mode/mode.ts`.
- **Evidence:** the toggle reads `mode`, which is `resolveMode(theme)` and always `'light'` or `'dark'`. The test only covers light and dark.
- **Impact:** after choosing System, the menu marks Light or Dark as checked. That is wrong for sighted and AT users alike.
- **Fix:** use `nativeMode`, as `features-settings` already does.
- **Tests:** a `ModeToggle` test for `initialMode="system"` asserting `aria-checked` on System.
- **Risk:** none.
- **Overlap:** none.

### FE-03 · Low · Credible risk: `useMode().mode` resolves the system mode during render with no subscription

- **File:** `preferences/src/providers/mode-provider/mode-provider.tsx:38-41`.
- **Impact:** the value goes stale when the OS theme changes. SSR returns `'light'`, so any future consumer rendering from it before mount risks a hydration mismatch.
- **Fix:** derive it from `next-themes`' `resolvedTheme`, or from `usePrefersDark()`.
- **Tests:** a hook test for a change of the `matchMedia` result.
- **Overlap:** none.

### FE-04 · Medium · Architectural concern: `frontend-blocks` has no ownership statement, and its public root exports demo and template code

- **Files:**
  - `blocks/src/index.ts:1-12`;
  - `blocks/src/data/data.tsx` (also contains a split, garbled comment around the imports);
  - `blocks/src/types/types.ts`;
  - `workbench-shell.tsx`, `workbench-content.tsx`, `main-*/*`, `sidebar-rail/*`, `nl-date-picker/*`.
- **Evidence:**
  - 17 exports have zero production consumers outside blocks. The only external use of the shell family is the web playground's `MainSidebarShell`.
  - Knip treats all root exports as public, so it can't flag them.
  - The prior audit (2026-10-30, item D2) already raised this; it is still open.
- **Impact:**
  - Demo data and third-party image URLs sit on a production API.
  - A second app shell competes with `frontend-shells`.
  - `chrono-node` is a runtime dependency.
  - No owner exists to decide what belongs in blocks, so forms, collection and shells all grew a dependency on it.
- **Fix:**
  - Write a README ownership paragraph.
  - Replace `export *` with an explicit list.
  - Move the demo, Workbench and NL-picker material to a non-production entry or a dev/playground host.
  - Delete only with owner approval, after confirming the playground migrates.
- **Tests:** existing block tests; a playground smoke check after any move.
- **Risk:** the playground breaks unless it is migrated first.
- **Overlap:** the web playground (app owner).

### FE-05 · Medium · Verified boundary gap: portable entries reach `next/link` through `@synapcity/frontend-ui/next/*`

- **Files:**
  - `ui/src/components/ui/skip-link/skip-link.tsx:4` (core primitive);
  - `blocks/src/blocks/user-menu/user-menu.tsx:41` (blocks root);
  - `features/settings/src/frontend/components/data-privacy-settings/data-privacy-disclaimer.tsx:2`;
  - rule at `dev/boundaries/src/rules/edge-rules/edge-rules.ts` (R11 inspects only the bare `next` specifier).
- **Impact:** the "portable" root entries of ui and blocks require Next.js, contrary to ADR-0014 §3. The checker reports "no violations".
- **Fix:**
  - `SkipLink` links to an in-page fragment and needs no router, so it can be a plain `<a>` styled with `buttonVariants`.
  - `UserMenu` should take a supplied link component (FE-06).
  - Extend R11 to treat imports of any workspace `*/next/*` subpath from outside a `next/` folder as Next imports, and add a forbidden-import probe.
- **Tests:** the boundary probe; the skip-link focus test kept.
- **Risk:** low.
- **Overlap:** the settings disclaimer is feature-owned, so it needs feature/frontend reconciliation.

### FE-06 · Medium · Architectural concern: two identical host-link contexts, plus dead fields

- **Files:**
  - `shells/src/providers/shell-navigation/shell-navigation.tsx`;
  - `collection/src/providers/collection-navigation/collection-navigation.tsx` (stray comment "prefer prefetching; use with dynamic determinaim" at about line 31);
  - both `next/` bindings (`shells/src/next/next-shell-navigation/…`, `collection/src/next/next-collection-navigation.tsx`), which pass an undeclared `LinkButton`.
- **Impact:**
  - Hosts must mount two providers.
  - Blocks and ui have no injection point, which causes FE-05.
  - The extra `LinkButton` property is dead.
- **Fix:**
  - One link capability (`Link`, optionally `push`) at the lowest frontend layer, with a single `./next` binding.
  - Shells and collection re-export or alias it during the transition.
- **Tests:** a provider unit test; the existing shell and collection link tests.
- **Risk:** a public API change, which needs approval (L-3). Consumers are web and docs.
- **Overlap:** features that render links (auth, account, settings) would adopt the same capability later.

### FE-07 · Medium · Duplication: the calendar-date codec lives in ui and in forms after the relocation

- **Files:** `forms/src/utils/date-value/date-value.ts:1-31` and `ui/src/lib/calendar-utils.ts:16-60`. Forms depends on ui.
- **Differences:** `undefined` vs `null` for invalid input; ui additionally formats and adds days.
- **Relocation status:** verified integrated in the forms renderers and manifest. `domain-time` keeps the schemas, and `calendarDateSchema` (`z.iso.date()`) agrees on rejecting impossible dates.
- **Consumers:** forms date renderers (forms copy); ui DatePicker, blocks pickers and agenda, features-dashboards (ui copy).
- **Fix:** keep one implementation, the lower layer (ui `calendar-utils`), with forms adapting `null` to `undefined`. Alternatively, the owner confirms the forms copy as canonical and ui keeps its own, which leaves the duplication in place.
- **Tests:** keep both suites' cases on the surviving owner.
- **Decision:** L-4.
- **Overlap:** domain refactor handoff; `domain-prototypes` copies are outside frontend scope.

### FE-08 · Medium · Credible risk and ownership concern: `CollectionIndex` owns a copied, optimistic list

- **File:** `collection/src/components/collection-index/collection-index.tsx` (about lines 91 and 108-131).
- **Evidence and impact:**
  - **Stale props:** `useState(initialItems)` never resyncs when the server re-renders the page with new `items` (for example after `router.refresh()` or a revalidation), so the list stays stale until remount.
  - **Silent no-ops:** `handleItemAction` handles only `open` and `toggle-pin`, while the `CollectionItemAction` type admits `rename`, `duplicate` and `delete`. Today all three consumers pass only `open` and `toggle-pin`, so this is latent.
  - **Ordering:** overlapping pin saves rely on server ordering. `fix/r4-pin-toggle-race` is unmerged and adds a test only.
- **Fix:**
  - Narrow the prop type to the supported actions, or require handlers for the others.
  - Either key or reset the list on an `items` change, or move the optimistic pin projection to the resource feature, per ADR-0014 §5.
- **Tests:** a prop-change resync test; overlapping-toggle tests (merge or adopt r4's).
- **Affected:** features-spaces; web dashboards and documents indexes.
- **Overlap:** requires feature/frontend reconciliation.

### FE-09 · Medium · Architectural concern (approval gate): a candidate token package overrides canonical tokens in production

- **Files:** `ui/src/styles/globals.css:3`; `packages/frontend/tokens/src/*`.
- **Evidence:**
  - The tokens README itself says it overrides 32 names.
  - Shipped CSS declares `--primary-500` twice (`var(--base-500)`, then `#747474`).
  - Extra `@font-face` rules ship for Inter and JetBrains Mono.
- **Impact:** two owners for tokens, against ADR-0002 and ADR-0003 and AGENTS.md ("Design tokens live in tailwind-config"). An experiment is effectively shipped as canonical.
- **Fix:** an owner decision (L-2): adopt it by amending ADR-0002 and ADR-0003, or unload it.
- **Tests:** `theme-tokens.e2e`, axe contrast.
- **Risk:** either option changes visible colours somewhere.
- **Overlap:** none.

### FE-10 · Low · Duplication: four feedback types and two field frames in forms

- **Files:** `use-action-form.ts` (`FormFeedback`), `form-engine/form-feedback/form-feedback.ts` (`FieldFeedbackState`), `form-parts/form-message/form-message.tsx` (`FormMessageState`), `utils/first-field-refusal` (`ActionFormRefusal`); `form-parts/form-field/form-field.tsx` vs `form-engine/field-frame/field-frame.tsx`.
- **Impact:**
  - Features alias different types.
  - `FormField` hand-rolls `aria-describedby`, and is the reason forms depends on blocks (for `PasswordInput`).
- **Fix:** one exported feedback contract, with the others as aliases; converge on `FieldFrame`. This is ADR-0015's open item.
- **Tests:** existing form tests; type tests for the aliases.
- **Overlap:** features-auth `AuthState`, features-account `ProfileState` (feature reconciliation).

### FE-11 · Low-Medium · Credible risk: `FormRenderer` action mode has no re-entrancy guard

- **File:** `forms/src/components/form-parts/form-renderer/form-renderer.tsx` (the action branch of `onSubmit`).
- **Evidence:** submit mode guards with `submitting.current`; action mode doesn't. For non-async forms the button stays enabled until the caller's `pending` flips.
- **Impact:** a double submit is possible within that window.
- **Fix:** reuse the guard until the transition starts.
- **Tests:** a double `fireEvent.submit` asserting a single `action` call.
- **Overlap:** the r2 branch touches the same file.

### FE-12 · Low · Contract gap: submit mode cannot express expected field-level failures

- **Evidence:** `onSubmit` either succeeds or throws (shown as a generic message).
- **Fix:** allow `onSubmit` to return `FormFeedback`. Decide this against the first consumer that needs it.
- **Overlap:** ADR-0015 "server errors into form state" open item.

### FE-13 · Low · API hygiene: ui exposes the same primitive through three paths

- **Paths:** `./core/*`, `./components/*` (which includes `components/ui/*`), and a 16-item `./components` barrel with one consumer (web `TooltipProvider`).
- **Logo-mark shim:** `ui/src/components/ui/logo-mark/logo-mark.tsx` has zero consumers, and the path in its comment (`components/logo-mark`) doesn't resolve.
- **Fix:** keep `./core/*`; deprecate the rest after migrating that one consumer; remove the shim (approval needed for removal).
- **Note:** workspace conventions already flag ui's `./lib/*` and `./hooks/*` wildcards for narrowing.

### FE-14 · Low · Maintenance: duplicated panel machinery and leaked panel state in shells

- **Evidence:**
  - The glide timer appears twice, and the element-width observer three times.
  - There is a production `TODO` at `global-panel.tsx:3`.
  - `showingSettings` persists across close and reopen, so the panel can reopen showing settings.
- **Fix:** small local hooks; reset `showingSettings` when the panel collapses.
- **Tests:** a global-panel test for reopen state.

### FE-15 · Low · Manifest and documentation drift

- Storybook imports `@synapcity/features-dashboards/styles.css` without declaring it. The build passes today because Vite resolves it.
- The forms README omits the `blocks` dependency.
- `apps/web/src/styles/globals.css:18` holds an `@layer base` rule, which AGENTS.md design rules forbid in app CSS.
- The ui and blocks `build` scripts emit unused `dist/`; ui's `generate:component` references a missing generator.
- Blocks has no README.

### FE-16 · Low · Credible a11y risk (AT-unverified)

- `LoadingRegion` puts its live status inside an `aria-busy` container.
- `FormMessage` mounts its `role="status"` together with its content.
- **Fix:** verify with VoiceOver/NVDA first. If confirmed, use a persistent live region outside the busy container.
- **Overlap:** R3 (#141) added `LoadingRegion` announcements and planned a VoiceOver pass.

### FE-17 · Optional

- Require `aria-label` in the `IconButton` type.
- Replace the remaining two `forwardRef` uses (React 19).

### FE-18 · Low · Ownership: product-shaped blocks

- `DayAgenda` (one consumer, dashboards), `UserMenu` (account copy) and `SettingsView`.
- **Recommendation:** keep them generic, or move them to their features. Requires feature/frontend reconciliation.

---

## J. Proposed target organization (only where justified)

`frontend-blocks` is the only package whose layout needs to change:

```
packages/frontend/blocks/
  README.md                         # ownership: composed, product-neutral blocks above ui
  src/index.ts                      # explicit export list (no export *)
  src/blocks/<block>/{<block>.tsx,.test.tsx,.stories.tsx,index.ts}   # unchanged
  src/prototypes/                   # Workbench, MainSidebar*, SidebarIconRail, WorkspaceDropdown,
    index.ts                        #   NlDatePicker, data, types; exposed only via "./prototypes"
                                    #   (or moved to the web playground), pending L-1
```

Two smaller moves:

- **forms:** move `src/components/form-engine/` to `src/engine/`, and stop re-exporting the engine through `utils/index.ts`.
- **ui:** a `src/lib/link/` capability with a `src/next/link/` binding (FE-06), if L-3 is approved.

All other packages keep their current structure.

---

## K. Prioritized remediation roadmap

1. **Phase 1: correctness, low risk, no approvals beyond scope**
   - FE-01: `@source` lines for web, docs and Storybook, plus a coverage test.
   - FE-02: switch to `nativeMode`, plus a test.
   - FE-11: add the guard (coordinate with the r2 branch).
   - FE-14: reset `showingSettings`.
   - FE-15: README and manifest fixes.
   - **Verification:** CSS grep of the production build, unit tests, then one e2e test for toolbar visibility.
2. **Phase 2: boundary integrity**
   - FE-05: SkipLink as a plain anchor; R11 extension with a probe. Coordinate the settings disclaimer with the feature audit.
   - FE-03.
3. **Phase 3: ownership decisions, after L-1 to L-4**
   - FE-04: blocks README, explicit exports, prototype quarantine.
   - FE-06: unified link capability.
   - FE-07: codec owner.
   - FE-09: token owner.
4. **Phase 4: contracts, with feature reconciliation**
   - FE-08: collection state ownership, together with the r4 branch.
   - FE-10 and FE-12: forms contracts.
   - FE-13: ui export narrowing.
   - FE-16: AT pass and fixes.

---

## L. Decisions requiring owner approval

- **L-1. Workbench and demo shell in blocks.**
  - (a) Quarantine behind `./prototypes`.
  - (b) Move it to the web playground or dev.
  - (c) Delete after porting ideas to shells.
  - Trade-off: keeping the prototype vs one shell owner.
- **L-2. Token owner.**
  - (a) Adopt `frontend-tokens` by amending ADR-0002 and ADR-0003 (resolves the 13px body and font conflicts its README lists).
  - (b) Unload it from `ui/styles.css` until evaluation ends.
  - Option (b) changes current colours back, which is visible.
- **L-3. Host-link capability.**
  - (a) One capability in ui, which shells and collection adopt.
  - (b) Keep two contexts, just fix blocks and ui.
  - Option (a) changes public APIs.
- **L-4. Calendar-date codec owner.**
  - (a) ui `calendar-utils`.
  - (b) forms (ui would keep its own).
  - (c) Back to `domain-time` as pure functions, which reverses the refactor's choice.
- **L-5. `CollectionIndex` state ownership.**
  - Should it stay controlled-optimistic in the frontend with a reset key, or become controlled by features? This needs reconciliation with the feature audit.

---

## M. Verification summary

All commands ran in the isolated `6e949e43` copy.

**Environment limitations (not code defects)**

- Node is v22.23.4, but `engines` requires `>=24` and `.npmrc` sets `engine-strict=true`; pnpm 12.15 installed anyway.
- Turbo could not spawn any task ("Exec format error (os error 8)"), so the Turbo-routed checks were re-run through `pnpm -r`.

| Command                                                              | Result                                                                                                                                                                                                 |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm install --frozen-lockfile`                                     | pass                                                                                                                                                                                                   |
| `pnpm format:check`                                                  | pass                                                                                                                                                                                                   |
| `turbo run lint check-types` (frontend + apps)                       | **env failure:** 0 of 67 tasks spawned                                                                                                                                                                 |
| `turbo run test` (frontend)                                          | **env failure:** 0 of 13 tasks spawned                                                                                                                                                                 |
| `pnpm -r --filter ./packages/frontend/* run check-types`             | pass (13 packages)                                                                                                                                                                                     |
| `pnpm -r --filter ./packages/frontend/* run lint`                    | pass                                                                                                                                                                                                   |
| `pnpm -r --filter ./packages/frontend/* run test`                    | pass: **197 files, 1,680 tests** (ui 471, forms 376, preferences 186, collection 180, blocks 177, shells 147, brand 57, error-reports 21, tailwind-config 20, fonts 17, site 15, supabase 8, tokens 5) |
| `pnpm --filter web --filter storybook --filter docs run check-types` | pass                                                                                                                                                                                                   |
| `pnpm deps` (Knip)                                                   | pass                                                                                                                                                                                                   |
| `pnpm boundaries`                                                    | pass: 2,124 files, 39 workspaces, no violations (but see the FE-05 rule gap)                                                                                                                           |
| `pnpm brand:check`                                                   | pass                                                                                                                                                                                                   |
| `storybook build`                                                    | pass                                                                                                                                                                                                   |
| `next build` (web, dummy loopback Supabase env)                      | pass; client chunks and CSS inspected for FE-01 and FE-04                                                                                                                                              |
| PostCSS/Tailwind compile of web and Storybook CSS                    | used as FE-01 evidence                                                                                                                                                                                 |

**Not run:**

- `test:coverage`, `test:e2e`, `test:storybook` (browser/axe), `test:scripts`;
- feature-package tests, lint for apps and features, the docs build;
- every database command;
- `pnpm verify` as a whole.

**Not verified:**

- visual rendering of FE-01 and FE-02 in a real browser;
- screen-reader behavior for FE-16;
- touch-target and contrast measurements;
- HEAD's own behavior on the 22 differing frontend files, beyond the diff review.

**No pre-existing failures** were found in the checks that ran.

**Concurrent work noted:** these unmerged branches touch my scope; I neither modified nor assumed them:

- `fix/r2-form-dialog-pending-dismissal` (FormDialog/EntityDialog dismissal while saving)
- `fix/r4-pin-toggle-race` (test for overlapping pin toggles)
- `docs/frontend-feedback-design` (feedback design plan, 153 commits behind the baseline)

**Prior audit reconciled:** `docs/audits/architecture-audits/2026-10-30.md` items D2 (second app shell in blocks), D3 (calendar-date duplication, now between ui and forms), D9 (search duplication) and D10 (media-query hooks) remain open at the baseline. The `next/link` import in `sidebar-icon-rail` is resolved.

---

Nothing in the repository was implemented or changed. Implementation should wait until these findings are reviewed, approved, and reconciled with the feature-layer audit.
