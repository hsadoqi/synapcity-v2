# Task scope

## Active task: auth review follow-ups AHF-05 part 3, AuthConfirmation and error-focus tests (2026-10-17)

- Goal and mode: implement the `AuthConfirmation` heading-focus and shared error-focus items of AHF-05 of `docs/superpowers/plans/2026-10-16-auth-review-follow-ups.md`, on the DOM test setup from #34.
- Exact change: create `apps/web/src/features/auth/shared/auth-confirmation.dom.test.tsx` and `apps/web/src/hooks/use-focus-first-error.dom.test.tsx`; update this entry. Nothing is mocked; both components render for real.
- Mutation budgets: creates 2 test files; updates 1 (this entry); dependencies, config, production code, schema and provider state 0.
- Verification: `pnpm format:check`, `lint`, `typecheck`, `deps`, `test`; removing the heading focus, or the empty-field preference, makes tests fail. Not covered: the real-submit profile form and distinct form message IDs (next part), the browser suite.
- Recovery: revert the PR; nothing else changes.

## Active task: auth review follow-ups AHF-05 part 1, DOM test setup (2026-10-17)

- Goal and mode: implement the first part of AHF-05 of `docs/superpowers/plans/2026-10-16-auth-review-follow-ups.md`; the owner approved recommendation D3 on 2026-10-17: add `@testing-library/react` 16.3.3, `@testing-library/dom` 10.4.2 and `jsdom` 30.1.2 to `apps/web` as dev dependencies (the pins `frontend/ui` and the shared preset already use; no other package changes).
- Exact change: `apps/web/vitest.config.ts` becomes two Vitest projects, `node` (everything except `*.dom.test.*`) and `dom` (`src/**/*.dom.test.{ts,tsx}` with the shared React preset); creates `use-cooldown.dom.test.tsx` and `use-confirmation.dom.test.tsx` beside the hooks. Updates `apps/web/package.json`, `pnpm-lock.yaml` and this entry. Pnpm also collapsed the duplicate `next@16.4.0` lockfile variant to the one built against `@babel/core` 8.0.1; no version changed.
- Mutation budgets: dependencies 3 (dev, exact); creates 2 test files; updates 4 (config, manifest, lockfile, this entry); production code, schema, provider state 0.
- Verification: `pnpm format:check`, `lint`, `typecheck`, `deps`, `test`; removing the cooldown restart or the email focus makes the matching test fail. Not covered: `UserProvider`, profile form, `AuthConfirmation`, error focus and the browser suite (later AHF-05 parts); no live provider or browser-layout proof.
- Recovery: revert the PR; nothing else changes.

## Active task: auth review follow-ups AHF-03, import-boundary scanner (2026-10-17)

- Goal and mode: implement AHF-03 of `docs/superpowers/plans/2026-10-16-auth-review-follow-ups.md`; the owner approved recommendation D2 on 2026-10-17: keep the test-based check, repair it with a small comment-aware lexical scanner, add no dependency.
- Exact change: update `apps/web/src/architecture.test.ts` only. Comments are stripped before scanning; a module under a feature's `server` folder is server-only unless it starts with `'use server'`; every client-marked module under `src` is scanned; `shared` may not import provider clients, the environment reader or `@supabase/*`; an unresolvable dynamic import is rejected in `shared` and client modules; failures name importer, target and rule; a throwaway-tree fixture proves a real forbidden source file fails the check.
- Mutation budgets: updates 1 test file plus this entry; creates 0; dependencies, config, ESLint, production code, schema and provider state 0.
- Verification: the new cases catch the review's four misses and pass the legal imports; a deliberate commented import in a shared file fails the real-tree scan; then `pnpm format:check`, `lint`, `typecheck`, `deps`, `test` and `build`. This checks direct imports only and is not proof of client-bundle isolation.
- Recovery: revert the test file; nothing else changes.

## Active task: bring refactor/auth-features into main (2026-10-17)

- Goal and mode: implement the owner's request to merge `refactor/auth-features` with `main` (PR #28). `main` holds the older auth UI as one squashed commit, so the merge conflicted in 66 files, mostly old-layout copies of files the branch had already moved.
- Resolution: keep the branch's layout for `apps/web` and `packages/frontend/ui`; take `main`'s lockfile, react 19.3.0 pins, `.pnpm-store` ignore and docs; port the `updatePassword` failure log to `features/auth/server/actions.ts`; keep ADRs 0007 to 0009 as the branch records them (Accepted).
- Budgets: no new dependencies, schema, routes or public APIs beyond what the branch already carries; the branch's follow-up plan (`docs/superpowers/plans/2026-10-16-auth-review-follow-ups.md`) is not executed here.
- Verification: `pnpm format:check`, `lint`, `typecheck`, `deps`, `brand:check`, `test` and `build` passed locally, plus the Storybook story tests (13 files, 37 tests). `pnpm test:e2e` and live auth were not run (no Chromium download in the container).
- Recovery: revert the merge commit on `merge/auth-features-into-main`; `refactor/auth-features` and `main` are untouched until the PR merges.

## Active task: repair auth import-boundary verification failure (2026-10-16)

- Goal and mode: implement the owner's request to fix failures from `pnpm verify`. The clean baseline is `91561a7` on `refactor/auth-features`; the reproduced failure is six forbidden imports in four recently relocated auth components.
- Direct authority: the current verification-repair request; preserve ADR-0007's selected dependency boundaries and the existing verification chain.
- Exact destinations: move `apps/web/src/features/auth/shared/{auth-status,current-user-avatar,oauth-buttons,sign-out-button}.tsx` to the same filenames in `apps/web/src/features/auth/components/`; update their imports in `apps/web/src/app/page.tsx`, `apps/web/src/app/layout.tsx`, `apps/web/src/app/[userId]/home/page.tsx`, `apps/web/src/app/auth/login/page.tsx`, and `apps/web/src/features/auth/components/register-card.tsx`; update this scope entry.
- Mutation budgets: file moves 4; existing-file updates 6 including this entry; creates/deletes 0; dependencies, architecture decisions, other planning artifacts, Git history/branches/commits/PRs, external systems and provider state 0. Disposable logs and backups may live under `/private/tmp/synapcity-verify-repair-20261016`.
- System of record: ADR-0007 owns the selected layout; source files own runtime behavior; this entry bounds execution only. No task status is mirrored elsewhere.
- Preconditions: preserve component bodies, client directives, routes, auth behavior and all other recent refactor changes. Recheck clean/current source before mutation.
- Verification: reproduce the existing failing boundary test, rerun it after import repairs, then run root `pnpm verify` and inspect the final diff. Report exact stage outcomes and behavior not covered by tests.
- Recovery: reverse only this task's moves and import changes against the baseline; preserve concurrent work. No reset, stash, clean or history changes.
- Stop conditions: concurrent changes to a scoped destination, another failure needing additional source changes, or an unresolved architecture/security decision.

### Approved scope extension: complete the auth page wrapper extraction

- Direct authority: the owner confirmed the newly added wrapper is finished and selected "Finished—complete the wrapper extraction and verify" during this repair.
- Additional exact destinations: update the owner's new page wrapper (initially `apps/web/src/components/shells/auth-shell.tsx`, subsequently renamed by the owner to `apps/web/src/components/shells/auth-page-shell.tsx`) and `apps/web/src/app/auth/layout.tsx`. Preserve the owner's rename. The wrapper owns page centring/width; the existing feature `AuthShell` keeps card/heading responsibility. Use the distinct local name `AuthPageShell` and consume it from the route layout, preserving rendered markup.
- Revised total budgets: file moves 4; existing-file updates 8 including this scope and the owner's untracked wrapper; creates/deletes 0; all other mutation classes remain 0. Preserve the owner's wrapper file and keep its pre-edit contents under the disposable backup directory. Verification and recovery remain as above.

## Active task: author auth review follow-up implementation plan (2026-10-16)

- Goal and mode: turn the owner's completed auth review into a detailed implementation plan. Mode: planning/documentation authoring only; no application implementation or acceptance of proposed behavior.
- Direct authority: the owner's current request, "create a detailed implementation plan pls", following the read-only review of `refactor/auth-features` at `773060f` and its five existing WIP paths.
- Exact destinations and budget: create `docs/superpowers/plans/2026-10-16-auth-review-follow-ups.md` (1 create); update `.agents/task-scope.md` (1 update). Other repository changes, source changes, dependency changes, moves/renames/deletes, commits/branches/PRs, GitHub objects, provider configuration, live accounts and external planning surfaces: 0. Disposable authoring backups/check output may live under `/private/tmp/synapcity-auth-plan-authoring-20261016`.
- Systems of record: accepted ADRs retain decision authority; original ARF plans retain ARF task completion; the new Proposed plan owns only AHF-00 through AHF-09 follow-up definitions, dependencies and eventual completion. Its historical baseline is evidence, not a second ARF status ledger. This entry bounds authoring only.
- Content scope: preserve current topology/package options; specify the development-auth decision and identity invariant, boundary-check repairs, sign-out failure handling, meaningful test gaps, evidence-based documentation reconciliation and separate live-provider verification. Record unresolved choices and implementation approval gates without resolving them through plan wording.
- Preconditions: re-read live source/status, accepted decisions and planning workflow; preserve four modified source files and untracked `features/auth/shared/development-auth.ts`; do not silently adopt stale spec statuses or infer historical baseline proof from current tests.
- Verification: scoped Prettier write/check, relative Markdown link and named-path read-back, unique AHF task IDs/dependency order, diff/whitespace inspection and unchanged source/WIP comparison. Runtime checks are not rerun for this authoring-only change; prior review results are explicitly dated evidence.
- Recovery: remove only the newly authored plan and reverse only this entry if separately requested; the original scope is captured at `/private/tmp/synapcity-auth-plan-authoring-20261016/task-scope.before.md`. Preserve every pre-existing scope and source change; no reset/stash/clean.
- Stop conditions: concurrent changes to either authoring destination; an additional mutation class; a requested architectural decision being mistaken for approval; or an exact implementation destination needing a fresh scope. Execution of the plan requires its stated approvals and per-batch manifests.

## Active task: repair pnpm verify fixture failures (2026-10-16)

- Goal and mode: implement the owner's request to fix `pnpm verify`; preserve existing uncommitted work and the four seed files, which exactly match seed 42.
- Direct authority: the owner's current verification-repair request. No product, terminology, schema, ownership, dependency or verification-chain decision is changed.
- Exact destinations: update `packages/dev/fixtures/src/seed.ts`, `packages/dev/fixtures/src/seed.test.ts`, `packages/dev/fixtures/README.md`, and this entry (4 updates). The fixture package owns deterministic generation and its drift tests; this entry records execution bounds only.
- Mutation manifest: default seed-file generation to the existing files' seed 42 independently of the generic fixture default; compare parsed JSON so Prettier whitespace does not cause drift failures; document that contract.
- Budgets: repository updates 4; creates/deletes/moves/renames 0; dependencies 0; Git history/branches/commits/PRs 0; external systems and other planning artifacts 0. Disposable verification logs may live under `/private/tmp`.
- Verification: reproduce the four drift failures, run the fixture suite and scoped formatting, then rerun `pnpm verify`; report any remaining failures and stages not reached.
- Recovery: restore only this task's hunks, preserving pre-existing changes; no reset, stash or clean.
- Stop conditions: concurrent edits to these destinations, an unresolved decision, or another failure needing a broader mutation scope.

## Active task: auth review follow-ups, batches A–E (2026-10-14)

- Goal and mode: close the code and test gaps from the 2026-10-14 review of `refactor/auth-features` (`0cc15d7`). Mode: implementing, test-first.
- Direct authority: the owner approved batches A–E, a hardened-regex boundary check (no new dependency), and deferred F (sign-out: redirect anyway, log the error) and G (documentation reconciliation) to a follow-up.
- Update: `apps/web/src/lib/supabase/middleware.ts` (A); `apps/web/src/architecture.test.ts` (B); `apps/web/src/features/account/{shared/form-state.ts,server/actions.ts,components/profile-form.tsx}` (C); `apps/web/src/components/forms/*`, `apps/web/src/features/auth/shared/form-feedback.ts` and the auth forms that render `FormMessage` (D); `apps/storybook/vitest.config.ts` (E); `apps/web/e2e/auth.e2e.ts` (two assertions that hard-coded the old shared `form-message` id, added during D once the gate showed them); this entry.
- Create: `apps/web/src/lib/supabase/middleware.test.ts`, `apps/web/src/features/account/server/actions.test.ts`, one pure form-message contract module under `apps/web/src/components/forms/`.
- Budget: dependencies 0; deletes/renames 0; ADR/spec/plan edits 0; Supabase or provider configuration 0; commits/branches/PRs 0.
- Verification: each batch's tests seen failing first, then `pnpm verify`.
- Recovery: revert only these hunks with `git checkout -- <path>` per file on request; no reset, stash or clean.
- Stop conditions: a fix that needs a new dependency, a provider or routing behaviour change beyond the review's findings, or concurrent edits to a listed file.

## Active task: repair pnpm verify failures (2026-10-17)

- Goal and authority: implement the owner's request to fix pnpm verify. Existing checks and architecture remain in place. Branch fix/auth-ui began clean at e451b2d.
- Evidence: ordinary verify stops at sandbox port restrictions; unrestricted verify passes 43 web end-to-end tests and reaches the reproduced Storybook failures. Storybook 10.6.1 supplies parentCacheNode while installed Next.js 16.4.0 useRouter reads parentRenderTree.data.bfcacheId; its RedirectBoundary throws before stories render.
- Exact destinations and budgets: update this scope, pnpm-workspace.yaml and pnpm-lock.yaml (3 updates); create patches/@<storybook__nextjs-vite@10.6.1.patch> (1 create). Patch only the installed Storybook framework's AppRouterProvider fixture to supply the missing render-tree cache data. No dependency upgrades, application/source/test changes, deletions/moves/renames, Git operations, external planning mutations or new package identities. Existing browser and accessibility assertions stay enabled.
- Systems of record: pnpm patchedDependencies and its patch own the version-specific fixture repair; the lockfile owns reproducible resolution. This entry bounds execution only. Operational allowance: pnpm patch/install, tests/builds and generated outputs; temporary baselines/extraction/logs under /private/tmp.
- Verification: reproduce the original stories failing; strict-peer install and frozen lockfile; full Storybook browser tests and production build; direct root pnpm verify through completion with localhost/network access. Report cache hits, failures, remaining warnings and live-service limitations.
- Recovery: restore only this task's hunks using /private/tmp/synapcity-verify-repair-baseline-20261017; preserve the unpatched extracted package under /private/tmp. No reset/stash/clean or history changes.
- Stop: concurrent edits to scoped files, a required runtime/architecture change, another destination or an unrelated code failure requiring a revised manifest. Product, naming, package ownership, auth architecture and testing-strategy decisions remain unchanged.

## Active task: exclude local pnpm database from latest commit (2026-10-17)

- Goal and authority: the owner requested correcting the recent commit to exclude index.db; amend only local commit 3de596fcb6b8d4d8142d5666a67917c613b8451f, preserving every other committed change.
- Exact scope and budgets: update `.gitignore` and this scope record (2 files); untrack `.pnpm-store/v11/index.db` (1 index removal, no filesystem deletion); amend HEAD once, retaining its message and parent. New files, branch changes, pushes, external mutations and other source/dependency changes: 0.
- Preconditions: clean worktree/index; latest commit introduces the database; current remote fix/auth-ui tip does not contain HEAD. System of record: Git history and root ignore rules; this entry records bounds only.
- Verification: confirm amended tree differs only at these three paths, the database still exists locally and is ignored, and the worktree/index are clean. No runtime changes; runtime checks not required.
- Recovery: original commit 3de596fcb6b8d4d8142d5666a67917c613b8451f remains in the reflog; original documents and hash captured in /private/tmp/synapcity-exclude-index-db-20261017. Any restoration requires separately scoped authority.
- Stop: concurrent changes, a published latest commit, or a required mutation outside these destinations.

## Active task: repair React and TypeScript peer dependencies (2026-10-17)

- Goal and mode: implement the owner's request to fix the supplied peer-dependency errors. Dependency compatibility repair only.
- Authority and readiness: direct owner fix request; current versions and consumers inspected, npm metadata verified, pnpm 11.25.0 package extensions tested in an isolated strict-peer fixture. Preserve existing staged UI manifest and lockfile work. Branch: `fix/auth-ui`.
- Exact updates (8 maximum): this scope record; `apps/docs/package.json`; `apps/storybook/package.json`; `apps/web/package.json`; `packages/frontend/site/package.json`; `packages/dev/vitest-config/package.json`; `pnpm-workspace.yaml`; `pnpm-lock.yaml`.
- Manifest: align remaining React consumers to the owner's already-staged React 19.3.0 and @types/react 19.3.0 pins, preserving existing React DOM 19.3.0; supply TypeScript 5.9.3 as a dependency of eslint-plugin-storybook 10.6.1 and vite-tsconfig-paths 5.1.4 through packageExtensions. TypeScript 5.9.3 satisfies both tooling chains, including tsconfck's ^5 peer constraint; retain TypeScript 7.0.2 as the compiler. Regenerate the lockfile without unrelated upgrades. No peer-range relaxation.
- Systems of record: package manifests own direct dependencies; pnpm-workspace.yaml owns transitive compatibility configuration; pnpm-lock.yaml owns resolution; this entry records execution bounds only.
- Budgets: existing repository files 8; creates/deletes/moves/renames 0; new package identities 0; source/test/API/schema changes 0; Git staging/commits/branches/PRs 0; external issues/projects/planning surfaces 0. Local operational changes: pnpm install and generated verification outputs only; disposable evidence/baselines under /private/tmp.
- Verification: strict-peer install and frozen-lockfile replay; resolve actual installed compiler/tooling versions; root pnpm verify, reporting the first failure and every unreached gate. Additional focused checks if the full gate stops on unrelated failures.
- Recovery: restore only this task's hunks from /private/tmp/synapcity-peer-baseline-20261017, preserving staged and concurrent work. No reset, stash, clean or history operations.
- Stop conditions: concurrent content changes to a destination, incompatible upstream requirement that needs compiler/runtime or architecture changes, or repair requiring additional files. Existing product, topology, auth and testing-strategy decisions remain untouched.

## Active task: auth refactor ARF-01 manifest and baseline (2026-10-17)

- Goal and mode: bound the foundation file moves (ARF-02 to ARF-06) for the selected app-local layout. Mode: planning; this entry is the manifest. No source file changes under it.
- Direct authority: on 2026-10-17 the owner selected layout A ("ok sounds good" to: record A, fix PR #24's conflicts, then start the file moves, one PR per step). That approves this manifest's preparation. Each ARF-02 to ARF-06 step still opens as its own PR for review.
- Source readiness (`fix/auth-ui` at `6c511d7`, after merging `main`): all 47 source paths in the parent plan's section 2 exist; none of the 47 destinations exists (no collisions). The auth-area files outside the map are route entry points and adapters that stay (`app/auth/**/page.tsx`, `app/auth/layout.tsx`, `app/auth/callback/route.ts`, `app/[userId]/settings/page.tsx`, `lib/supabase/{client,server,middleware,env}.ts` and `env.test.ts`). The importers of moved files outside the moved set are exactly the parent plan's 14-file consumer list; no new consumer since 2026-10-13. All earlier "uncommitted WIP" is committed on the branch.
- Budget for ARF-02 to ARF-06 together, all under `apps/web/src`: moves 47 (with import-path edits inside moved files); new files 5 (`features/auth/shared/form-state.ts`, `features/auth/shared/form-feedback.ts`, `features/account/shared/form-state.ts`, `features/account/server/profile-metadata.ts`, `features/account/server/profile-metadata.test.ts`, each extracted from an existing file); consumer updates 14 (the parent plan's list, import paths only); deletes 0 beyond the moved-from paths; renames of exported symbols 0; behavior changes 0. Outside `apps/web/src`: 0, including `packages/frontend/ui`, e2e tests, tooling config, `knip.json`, dependencies and the lockfile. ARF-07 to ARF-11 are out of this budget and need ADR-0008/0009 accepted first.
- Systems of record: the parent plan owns the destination map; the foundation plan owns ARF-01 to ARF-06 checkboxes; this entry owns the budget. Git history on `fix/auth-ui` is the recovery store, since nothing is untracked.
- Baseline (2026-10-17, cloud container): `pnpm --filter web test` 11 files, 143 tests passed; `pnpm --filter web check-types` passed; `pnpm --filter web test:e2e` NOT RUN (Playwright 1.64's Chromium build cannot be downloaded in this container; CI runs it). Repository-wide: `main` currently fails unit tests on the react 19.2.8 / react-dom 19.3.0 mismatch, which another thread owns; treat that failure as pre-existing.
- Risks to watch: `knip.json` ignores `apps/web/src/lib/**` only, so files moved to `features/` and `components/forms` become visible to Knip and may report unused exports. If `pnpm deps` flags them, stop and report rather than editing `knip.json` under this budget.
- Verification per step: `pnpm --filter web test`, `pnpm --filter web check-types`, `pnpm lint`, `pnpm deps`, `pnpm format:check`; CI runs the full `pnpm verify` including e2e. A grep for old import paths returns nothing once a step's moves land.
- Recovery: revert the step's PR or commit. No reset, stash or clean on shared branches.
- Stop conditions: a new consumer or source drift on `fix/auth-ui`, a destination collision, a needed change outside the budget, a behavior change, or a human correction.
- Not authorized: ARF-07 to ARF-11, accepting ADR-0008/0009, package creation, provider/session/storage changes, merging PRs.

## Active task: correct auth package constraints (2026-10-13)

- Goal and mode: correct the auth decision/spec/task-plan set so auth packages and further splitting are evaluated on their merits. Mode: documentation correction only.
- Direct authority: the owner clarified that restricting auth to the app was not their intention, then approved the exact ten-file correction with "yes pls" on 2026-10-13. This replacement scope supersedes the earlier auth authoring scopes; prior entries remain historical records and grant no execution authority.
- Update exactly 10: `.agents/task-scope.md`; `docs/architecture/decisions/0006-authentication-with-supabase.md` (initial-placement wording and its matching integration location only); `docs/architecture/decisions/0007-app-local-auth-and-account-ownership.md`; `docs/architecture/decisions/0008-auth-actions-and-server-operations.md`; `docs/architecture/decisions/README.md` (ADR-0007 title only); `docs/superpowers/specs/2026-10-13-auth-refactor-design.md`; `docs/superpowers/plans/2026-10-13-auth-refactor.md`; `docs/superpowers/plans/2026-10-13-auth-refactor-foundation.md`; `docs/superpowers/plans/2026-10-13-auth-refactor-operations.md`; `docs/superpowers/plans/2026-10-13-auth-refactor-navigation.md`.
- Budget: document updates 10; creates/deletes/moves/renames 0; application/shared-package code and tool configuration updates 0; dependencies/package creation 0; Git history/branches/commits/PRs 0; GitHub issues/labels/milestones/project fields and external trackers 0. Displaying the corrected parent plan in the current chat is allowed.
- Content scope: remove premature app-only/package exclusions; compare app-local, cohesive auth-package, feature/service split and account separation options; make package evaluation/selection the first task; label current destinations as the app-local candidate; retain provider/session/security/observable behavior; leave specific topology unselected. Keep ADR filenames/numbers stable and ADR-0007/0008 Proposed. ADR-0009 is unchanged.
- Source readiness: read the ten live documents and canonical workspace/package conventions; preserve current concurrent source edits. Keep their pre-edit text in session storage for precise comparison. Current auth files may have additional confirmation/recovery work; inventory candidates without executing migrations or claiming prior tasks completed.
- Systems of record: ADR-0007 owns topology evaluation and eventual selection; spec owns requirements; parent owns candidate migration inventory/order; foundation plan owns new package evaluation task ARF-00 and ARF-01 through ARF-06; other child plans retain ARF-07 through ARF-11; parent owns ARF-12. No task completion is mirrored elsewhere.
- Verification: scoped formatting and read-back of all ten files; links/source inventory; unique task IDs and dependency order; all runtime checkboxes unchecked; verify the only ADR-0006 semantic changes are the approved placement clarification and matching location clause. Runtime gates are not run for this documentation-only correction.
- Recovery: separately authorized reversal of only this correction's hunks against the captured live documents, preserving concurrent edits and prior history. No reset/stash/clean.
- Stop conditions: concurrent changes to an authorized document, missing destination, another mutation class, or a human correction. Proposed category/runtime amendments must be recorded for later review; this scope does not change workspace conventions.
- Not authorized: selecting/accepting a package topology, accepting Proposed ADRs, implementing code tasks, creating packages, changing provider/session/security/storage behavior, or committing/publishing.

## Active task: proposed auth decisions and task plans (2026-10-13)

- Goal and mode: create decision files and implementation plans with concrete tasks for the existing auth-refactor proposal. Mode: planning and documentation authoring only, under the owner's direct request, "could you create decision files and implementation plans with tasks".
- Source readiness: existing auth-refactor spec/plan are Draft; their authoring and expansion are directly requested, not implementation approval. Re-read live ADR index (0001-0006), Accepted ADR-0006, current consumers, new auth-flow and form-focus helpers, and actual root scripts. Preserve unrelated/concurrent source work.
- Create 6: `docs/architecture/decisions/0007-app-local-auth-and-account-ownership.md`, `docs/architecture/decisions/0008-auth-actions-and-server-operations.md`, `docs/architecture/decisions/0009-caller-owned-auth-navigation.md`, `docs/superpowers/plans/2026-10-13-auth-refactor-foundation.md`, `docs/superpowers/plans/2026-10-13-auth-refactor-operations.md`, `docs/superpowers/plans/2026-10-13-auth-refactor-navigation.md`.
- Update 4: this `.agents/task-scope.md` entry; `docs/architecture/decisions/README.md` (index the three Proposed ADRs only); `docs/superpowers/specs/2026-10-13-auth-refactor-design.md` (decision links, source refresh and alignment); `docs/superpowers/plans/2026-10-13-auth-refactor.md` (parent sequence, refreshed map, links and final verification task).
- Budget: repository document creates 6, updates 4; delete/move/rename 0; application/shared-package source and config updates 0; dependencies/packages 0; Git history/branches/commits/PRs 0; GitHub issues/labels/milestones/project fields 0; external task trackers/operational changes 0. Show the resulting parent plan in this chat's editor.
- Systems of record: ADRs own the proposed choices and eventual acceptance status; spec owns requirements/invariants and derives architecture from those ADRs; parent plan owns migration inventory and sequence; child plans own their task definitions and execution checkboxes; final verification task lives only in the parent. This scope owns authoring bounds. No status is mirrored into GitHub or another tracker.
- Preconditions: six new paths absent and ADR numbers free; prior draft paths present; current source references exist; no claim of owner acceptance, execution approval or completed implementation. A future executing agent must refresh scope, numeric source budgets and recovery baseline.
- Verification: scoped Prettier; read-back of all ten files; internal link and current-source checks; consecutive ADR numbers, Proposed status, unique task IDs, valid dependency order and unchecked implementation tasks; diff whitespace and mutation counts. No runtime checks required for this documentation-only work.
- Recovery: separately authorized reversal of only the six new documents and this task's hunks in the four existing documents. Preserve older drafts and all concurrent work; no reset/stash/clean.
- Stop when: destination collision, newly occupied ADR number, human scope correction, or another mutation class is needed. Source drift requires refreshing the proposal, not silently changing source.
- Not authorized: accepting ADRs, changing Accepted ADR-0006, executing any code task, inventing a workspace package, changing storage/routing/provider architecture, committing or publishing.

## Active task: draft auth-refactor specification and plan (2026-10-13)

- Goal and mode: provide the owner with example reviewable files for the auth organization discussed in chat. Mode: planning; documentation only.
- Direct authority: the owner's request, "could u give me an example plan/specs file for this?" Authorizes drafting the proposal, not adopting its architecture or executing it.
- Source readiness: current-source investigation on `fix/auth-ui`; Accepted ADR-0006 keeps auth in `apps/web`; architecture principles section 6 favors responsibility boundaries before package boundaries. The existing auth-UI spec is Draft and does not authorize this refactor. This proposal is independently requested and explicitly unapproved for implementation.
- Exact destinations: create `docs/superpowers/specs/2026-10-13-auth-refactor-design.md`; create `docs/superpowers/plans/2026-10-13-auth-refactor.md`; append this entry to `.agents/task-scope.md` while preserving all existing entries.
- Mutation budget: repository documentation creates 2, scope-record updates 1; application/shared-package code updates 0; delete/move/rename 0; dependencies/packages 0; Git history/branches/commits/PRs 0; GitHub issues/labels/milestones/project fields 0; external planning tools and operational state 0. Opening the resulting documents in the current chat is allowed.
- Systems of record: accepted decisions remain in the existing ADRs; the new spec owns this proposal's requirements/boundaries; the companion plan owns its proposed sequence. This entry records authoring scope only. No execution status, backlog, or external tracker is created or mirrored.
- Preconditions: both proposed document paths are absent; preserve concurrent auth work and existing planning documents; derive the migration map from live files; do not resolve open product, persistence, routing, package-category, or provider decisions.
- Verification: read back both documents; check referenced current source paths and internal document links; run scoped Prettier checks. Tests, lint, typecheck, dependency analysis, brand checks, browser checks, coverage and builds are not required for this documentation-only proposal and will not be claimed.
- Recovery: remove only these two newly authored drafts and this entry if separately authorized. Never reset/stash/clean or remove any existing untracked work.
- Stop conditions: destination already exists; drafting requires another mutation class; source changes make the proposed mapping inaccurate; a human correction suspends mutation authority under the reset protocol.
- Implementation authority: none. The future refactor requires approval of its ownership choices and a fresh exact execution manifest with numeric budgets; no proposed source-code table in these drafts grants that authority.

## Active task: shared Vitest and Playwright config packages (2026-10-13)

Approved by the owner (2026-10-13): ADR plus packages in one change, packages under `packages/dev/`, consumers `frontend-ui`, `frontend-site`, `storybook` and `web`, and Vitest staying on 4.1.11. Phase B.

- Goal and mode: shared test config for the workspaces, with a smoke test in each consumer. Mode: implementing.
- Created: `packages/dev/vitest-config`, `packages/dev/playwright-config`, `docs/architecture/decisions/0005-testing-foundation.md` (Proposed), and one config and smoke test per consumer.
- Updated: root `package.json` and `turbo.json` (`test`, `test:e2e`), `.gitignore`, the four consumer manifests, `apps/storybook/vitest.config.ts`, the ADR index, `pnpm-lock.yaml`.
- Left undecided: tests in `pnpm verify` and CI, coverage, browser matrix, accessibility gating. `AGENTS.md` still says no test runner exists; update it when ADR-0005 is accepted.
- Not claimed: that the story tests pass (two fail on existing accessibility findings), or any coverage.

## Active task: brand-asset drift check (2026-10-13)

Approved by the owner ("ok i'll go with ur rec", 2026-10-13): decision 1 = enforce inside `pnpm verify`, decision 2 = root `scripts/`. Phase B.

- Goal and mode: make drift between `logo-mark.tsx` (the source of truth for logo geometry) and its static exports fail a check instead of going unnoticed. Mode: planning; implementing only after approval.
- Evidence: `WORDMARK_PATH` matches exactly in `wordmark.svg` and `wordmark-monochrome.svg`; `LOGO_WORDMARK_PATH` matches exactly in `logo.svg`, `logo-monochrome.svg` and the embedded string in `packages/frontend/site/src/open-graph.tsx`. The mark and icon files carry hand-written colour-scheme CSS and the PNG and ICO are raster exports, so a generator would have to reproduce styling and rasterise (needing `sharp`, a dependency decision). Check-only is therefore proposed first; a generator is deferred.
- Decided here: one dependency-free Node script reads `logo-mark.tsx` by pattern (no new exports, no `frontend-ui` API change) and fails, naming the file and the constant, when (1) either wordmark path constant is missing from any export that should contain it, (2) the mark geometry values (grid, square size, radius, stroke, offsets, core) disagree with `mark-light.svg`, `mark-dark.svg` and each app's `icon.svg`, or (3) the two apps' `icon.svg`, `apple-icon.png` and `favicon.ico` differ byte for byte. It cannot check that a raster matches the geometry; that stays a manual re-export and the README says so.
- Owner decisions needed before approval:
  1. Run it inside `pnpm verify` (recommended; CI and the pre-push hook then enforce it, but the chain is recorded in Accepted ADR-0001 and must be amended), or keep it a standalone `pnpm brand:check` that nothing enforces?
  2. Is a root-level `scripts/` directory acceptable for it? (none exists today; the alternative is `packages/dev/`, which is build-time tooling by definition, but would be a new package.)
- Exact destinations and budget, assuming decision 1 is "inside verify" and decision 2 is a root `scripts/`:
  - Create 1: `scripts/check-brand-assets.mjs`.
  - Update 7: `package.json` (root; a `brand:check` script, added to `verify` after `deps`), `AGENTS.md` (§6 list of repository-defined checks), `docs/engineering/quality-gates.md`, `docs/engineering/setup.md`, `docs/architecture/decisions/0001-workspace-topology-and-toolchain.md` (the verification-chain line only), `packages/frontend/site/README.md` (name the check), and this record.
  - Conditional, up to 1: `knip.json`, only if Knip reports the script as an unused file.
  - If decision 1 is "standalone": update only `package.json`, `packages/frontend/site/README.md` and this record (3), with no ADR, AGENTS.md or docs changes.
  - Delete/move/rename 0; dependencies 0; changes to `logo-mark.tsx`, any brand file or any app 0; commits and pushes 0 until asked; external systems 0.
- Execution result: created 1 (`scripts/check-brand-assets.mjs`); updated 7 (`package.json`, `AGENTS.md`, `docs/engineering/quality-gates.md`, `docs/engineering/setup.md`, ADR-0001's verification-chain line, `packages/frontend/site/README.md`, this record); `knip.json` untouched (Knip needed no entry). Negative runs on scratch copies under `/private/tmp` produced named failures for a changed wordmark path, a changed icon rect, a differing raster and a changed source constant.
- System of record: `logo-mark.tsx` owns the geometry; the script only compares. The `Owns:` line of `@synapcity/frontend-site` and PRODUCT.md already name where the exports live.
- Approvals held: the manifest, enforcement inside `pnpm verify` including the ADR-0001 verification-chain amendment, and a root `scripts/` directory (owner, 2026-10-13).
- Preconditions to verify before executing: the constant names and formats in `logo-mark.tsx` are matched by the script's patterns on today's file; the script passes on the current tree and fails when one character of an export is changed (shown with a disposable copy under `/private/tmp`, not by editing a brand file); `pnpm verify` still reports the pre-existing unrelated failures separately from this check.
- Verification: run the script on the current tree (expect pass); run it against a scratch copy with one changed path character, one changed rect value, and one differing icon (expect three named failures); `pnpm format:check`, `pnpm lint`, `pnpm check-types` and `pnpm deps` on the final tree; read back the edited docs. Not claimed: that rasters match the geometry, or that behaviour is tested beyond these runs (no test runner exists).
- Recovery: delete the script and revert the listed updates from git (this scope's commit is the baseline). No reset, stash, clean or history rewrite.
- Stop conditions: no answer to decision 1 or 2; a pattern that cannot match `logo-mark.tsx` without changing it; a need for any dependency; Knip or Prettier rejecting the script in a way that needs a change outside this manifest; a concurrent change to a destination.

## Active task: share brand assets and SEO metadata across apps (2026-10-13)

Approved by the owner ("ok go", 2026-10-13) after the manifest and package name were presented. Phase B.

- Goal and mode: let `apps/web` and `apps/docs` share one source for brand identity (the Open Graph card, icons, site name and description) and for building page `Metadata`, instead of each app hard-coding its own. Mode: planning; implementing only after approval.
- Package name: `@synapcity/frontend-site`, directory `packages/frontend/site/`. The owner delegated the choice on 2026-10-13 ("choose the name you recommend"); it follows the `@synapcity/frontend-*` convention and names what the package owns (site facts, metadata, social card) without claiming ownership of logo geometry, which stays in `frontend-ui`. Every `<pkg>` below means `site`.
- Package topology: a new workspace package under `packages/frontend/`, approved with this manifest.
- Decided here: share three things only — site facts (`site.ts`: name, tagline, default description, locale), a `createMetadata()` builder, and the Open Graph card rendered from the existing `SynapcityLogo` component instead of reading `public/brand-assets` with `process.cwd()`. The package declares `next` as a peer dependency (for the `Metadata` type and `next/og`) and depends on `@synapcity/frontend-ui` for the logo.
- Deliberately left undecided / out of scope: `metadataBase` and any production URL (blocked by the "Deployment topology" candidate in `docs/architecture/decisions/README.md`; `createMetadata()` takes an optional base and leaves it unset); `robots`, `sitemap` and JSON-LD (route-dependent, no approved need); a brand-SVG export script and its CI drift check (proposed as a separate follow-up task); any change to logo geometry, colours or fonts; the `apps/web/public/brand-assets` files, which stay where PRODUCT.md records them.
- Exact destinations and budget:
  - Create 10 — in `packages/frontend/<pkg>/`: `package.json`, `tsconfig.json`, `README.md` (with an "Owns" section), `src/site.ts`, `src/metadata.ts`, `src/opengraph-image.tsx`; in `apps/docs/src/app/`: `opengraph-image.tsx`, `icon.svg`, `apple-icon.png`; plus an ESLint config for the package only if the workspace convention requires one (counts as the 10th).
  - Update 9 — `apps/web/src/app/layout.tsx`, `apps/web/src/app/opengraph-image.tsx`, `apps/docs/src/app/layout.tsx`, `apps/web/package.json`, `apps/docs/package.json`, `pnpm-lock.yaml`, `apps/docs/src/app/favicon.ico` (replace with the brand favicon), `PRODUCT.md` (the brand asset location sentence), and this record.
  - Conditional, up to 2: `apps/web/next.config.js` and `apps/docs/next.config.js`, only if the installed Next requires `transpilePackages` for a TypeScript-source workspace package; check how `@synapcity/frontend-ui` is consumed first and stop if the answer is unclear.
  - Delete/move/rename 0; new dependencies other than workspace links 0; ADRs 0; public APIs beyond the package's own exports 0; persisted schemas 0; commits, pushes, pull requests 0; external systems 0. Disposable verification artifacts may live under `/private/tmp`.
- System of record: the new package owns site facts, the metadata builder and the social card. `logo-mark.tsx` stays the source of truth for logo geometry. Each app owns its own page titles and descriptions and passes them to `createMetadata()`. This record owns execution bounds only.
- Approvals held: the package name (delegated to the assistant), the package topology and this manifest (owner, "ok go", 2026-10-13).
- Execution adjustment: Next rejects `react-dom/server` in a route's import graph, so the card embeds `logo-monochrome.svg` as a string constant instead of rendering `SynapcityLogo`; the package therefore has no runtime dependencies and declares only `next` and `react` as peers. This is a derived copy of the logo geometry; re-export it with the files in `apps/web/public/brand-assets` when `logo-mark.tsx` changes. Final counts: created 10 (7 package files, 3 in `apps/docs`), updated 9 plus the `apps/web/src/app/opengraph-image.tsx` rewrite; `next.config.js` untouched.
- Design adjustments found in preconditions: `workspace-conventions.md` bars `frontend` packages from Next runtime APIs, so the package does not import `next/og`; it exports the card as plain JSX plus the size, alt and content-type values, and each app's `opengraph-image.tsx` calls `ImageResponse` and declares its own `alt`, `size` and `contentType` (the Next docs do not say re-exporting them is supported). `import type { Metadata } from 'next'` is type-only and is the one Next reference the package keeps; it is a peer dependency. File counts are unchanged.
- Preconditions to verify before executing: read the installed Next 16.3.8 bundled docs for the metadata file conventions, and confirm whether `alt`, `size` and `contentType` may be re-exported from a package or must be declared in each app's `opengraph-image.tsx` (AGENTS.md §7a; mark NOT VERIFIABLE if the docs cannot be reached); confirm the turbo, Knip and pnpm-workspace settings pick up the new package; confirm `apps/docs` and `apps/web` build before the change so any new failure is attributable.
- Verification: `pnpm verify` (format, lint, check-types, Knip, build); build both apps and request `/opengraph-image` and `/icon.svg` in each to confirm they render; read the rendered `<head>` for title, description, `og:*` and `twitter:*` tags in each app; confirm the `metadataBase` build warning is unchanged, not newly introduced. No test runner exists, so behaviour is not "tested"; report that.
- Recovery: delete the new package directory and the three new `apps/docs` files, and revert the listed updates from git (the tree was clean on `fix/site-styling` at the start). No reset, stash, clean or history rewrite.
- Stop conditions: no package name or topology approval; a concurrent change to a destination; `metadataBase`, a production URL or any route-dependent SEO file turning out to be required; a required mutation outside this manifest; a conflict with an Accepted ADR.

## Active task: complete shared theme and typography (2026-10-12)

- Goal and mode: implement the owner's clarified request to complete the shared Synapcity theme and typography. Mode: implementing.
- Exact destinations and budget: update `packages/dev/tailwind-config/shared-styles.css`, `apps/web/src/app/layout.tsx`, `apps/web/src/app/page.tsx`, and this record (4 files), on the existing `fix/site-styling` branch. New files, deletions, moves, renames, dependency changes, commits, pushes, external systems, persisted schemas and component APIs: 0. Disposable verification artifacts may live under `/private/tmp`.
- System of record: `DESIGN.md` supplies the documented visual roles and scale; the shared stylesheet owns their current implementation. The archived worktree is historical evidence, not authority; no providers, persistence, components, package topology, runtime theme editor or old imports are adopted.
- Styling surface: extend the shared CSS with the documented neutral/base, primary and accent ramps; semantic surface/action/state/border/sidebar roles; UI/body/code/heading fonts; 13/14/15/17/19/24/30/36/45px scale; radius scale; selected surfaces and focus/selection defaults. Explicit `.light`/`.dark` tokens override OS mode. Preserve source scanning, local font files, existing responsive layout, welcome copy and reduced-motion behavior.
- Approvals held: direct owner clarification to complete shared theme and typography, followed by explicit approval of this concrete four-file extension and its styling surface (2026-10-12).
- Verification: installed Tailwind/PostCSS compilation; disposable token/typography fixtures with real local fonts; light/dark/system combinations; font role/size/radius/focus/reduced-motion checks; actual page responsive rendering; root format/lint/type/dependency/build checks with exact limitations reported.
- Recovery: restore only this pass's hunks from `/private/tmp/synapcity-theme-foundation-review/baseline`, preserving earlier styling work and all other WIP.
- Stop conditions: concurrent edits to a destination, a required new dependency, an unresolved product/architecture choice, or a mutation outside the manifest.

## Active task: repair site-wide styling (2026-10-12)

- Goal and mode: implement the owner's request to fix full-site styling in the existing web application. Mode: implementing.
- Exact destinations and budget: update `packages/dev/tailwind-config/shared-styles.css`, `apps/web/src/styles/globals.css`, `apps/web/src/app/layout.tsx`, `apps/web/src/app/page.tsx`, and this record (5 files). Create 1 Git branch, `fix/site-styling`, carrying current WIP. Repository file creation/deletion/moves/renames, dependencies, persisted schemas, public APIs, commits, pushes, pull requests, and external systems: 0. Disposable review and verification artifacts may live under `/private/tmp`.
- System of record: the existing shared stylesheet owns theme mappings and base styles; the web stylesheet owns its app/UI source scan and existing image visibility helpers; the app owns responsive page layout. This record owns execution bounds only.
- Approvals held: direct owner request to fix site styling, followed by explicit approval of this five-file manifest and branch and confirmation overlapping edits are finished (2026-10-12).
- Preconditions: preserve every existing user change, local Geist fonts, welcome copy, OS-based light/dark colors, the existing dark utility variant and reduced-motion overrides, PostCSS wiring, docs app, shared component APIs, and historical CSS modules. No product or architecture decisions are resolved.
- Verification: compile the real global stylesheet with the installed Tailwind/PostCSS versions; inspect desktop/mobile light/dark rendering, font application and overflow; scoped formatting and lint; root `pnpm verify`, reporting failures and unrun checks precisely.
- Recovery: restore only this task's own hunks from `/private/tmp/synapcity-site-styling-review/baseline`, preserving user WIP. No reset, stash, clean, or history rewrite.
- Stop conditions: concurrent edits to a destination, a new architecture/product decision, or a required mutation outside these five files.

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
Systems of record: @synapcity/frontend-ui-core owns reusable layout presentation; apps/web owns route/action data and supplies Next.js link rendering
Artifact budget:   39 repository-file updates maximum; no dependencies or generated artifacts
Approvals held:    direct user authorization to resolve all previously reported Storybook and web smoke blockers and restore the visible theme preference toggle
Approvals needed:  none for these bounded public layout APIs; broader navigation ownership changes remain out of scope
Preconditions:     preserve all current edits in the listed stories and global error boundary; reuse existing theme provider, preference control, and tests; keep ui-core APIs and base primitive behavior unchanged
Mutation manifest: correct story composition/style errors and the web error-boundary stylesheet import where required; compose the existing dark-mode preference control with the app's existing provider in root-providers; preserve current edits
Verification:      pnpm --filter @synapcity/storybook exec vitest run -c vitest.config.ts [the four listed story files]; pnpm --filter @synapcity/storybook test:storybook; pnpm --filter @synapcity/web test:smoke; pnpm --filter @synapcity/frontend-ui-core typecheck; pnpm --filter @synapcity/web typecheck; pnpm --filter @synapcity/storybook typecheck; pnpm exec eslint [changed files]; pnpm exec prettier --check [changed files]
Stop when:         another concurrent edit affects a listed file or a new failure requires changes outside the listed paths
Recovery:          restore only this task's own hunks, preserving all pre-existing user changes; no Git history or external state is mutated
```

## Cross-system mutation matrix

Complete every row that the task could plausibly touch. Use `read only` or `none` explicitly; a blank cell grants no authority.

| System / mutation class                       | Exact destination          | Allowed action | Artifact budget | Preconditions                                             | Verification                                                   | Recovery               |
| --------------------------------------------- | -------------------------- | -------------- | --------------: | --------------------------------------------------------- | -------------------------------------------------------------- | ---------------------- |
| Repository files                              | Paths listed in Goal scope | update         |              39 | preserve existing edits; keep Next.js routing in apps/web | focused/full Storybook, web smoke, typecheck, lint, formatting | restore only own hunks |
| Git history / branches / pull requests        | none                       | none           |               0 | none                                                      | read-only branch check                                         | none                   |
| GitHub issues / labels / milestones           | none                       | none           |               0 | none                                                      | none                                                           | none                   |
| GitHub Projects or other project metadata     | none                       | none           |               0 | none                                                      | none                                                           | none                   |
| Backlog, task, or planning tools              | none                       | none           |               0 | none                                                      | none                                                           | none                   |
| Dependencies / packages / generated artifacts | none                       | none           |               0 | none                                                      | none                                                           | none                   |
| Other external or local operational state     | none                       | none           |               0 | none                                                      | none                                                           | none                   |

## Rules

- Authorization is artifact- and system-specific. Permission to edit repository documentation does not authorize changing issues, milestones, labels, project fields, a backlog, or another tool, and the reverse is also true.
- Use numeric budgets: for example, `issues: 9`, `milestones: 0`, `local task files: 0`. Do not interpret a qualitative goal such as "organize the work" as an unlimited budget.
- Name one system of record per concern. Do not mirror status, dependencies, milestones, or completion state into a second system unless that duplication and its reconciliation owner were explicitly approved.
- Exact destinations are preconditions, not hints. If a requested path, field, option, repository, project, or value is absent, stop and report it. Never choose the closest available substitute.
- The scope does not widen mid-task. If the manifest changes, a budget would be exceeded, or another mutation class becomes necessary, return to proposal and approval before continuing.
- A human objection, stop instruction, path correction, or scope correction immediately triggers the reset protocol in `.agents/README.md`.
- Record what was left undone and every check not run, not only what was completed.
