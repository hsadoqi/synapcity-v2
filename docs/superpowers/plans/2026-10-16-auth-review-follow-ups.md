# Auth review follow-ups: implementation and verification plan

**Status:** Proposed implementation plan; authoring authorized 2026-10-16. No source changes, dependency additions, new fixture-auth policy or live-provider operations are authorized by authoring this file.  
**Owner / approval authority:** Hanaa Sadoqi.  
**Baseline:** `refactor/auth-features`, HEAD `773060f`, plus the five WIP paths listed below, reviewed 2026-10-16. Refresh before execution.  
**Purpose:** Finish the demonstrated correctness, enforcement, verification and documentation gaps in the implemented auth refactor, without repeating completed migration work.

## 1. Approach and scope

Keep the accepted responsibility split: app-local auth, sibling account capability, common forms, application routing/access policy and Supabase adapters. Repair the development identity mismatch first where approved, strengthen the existing boundary guard, handle sign-out failures, add tests that exercise missing behavior, reconcile the original documents and perform a separately authorized live-auth acceptance pass.

An auth package, a services/auth package or further splitting remains eligible under ADR-0007. This follow-up neither requires nor prohibits one. A future extraction should demonstrate an API/runtime or maintenance benefit; it is not a prerequisite for the repairs here. Avoid forwarding wrappers and dependency upgrades unrelated to the findings.

**In scope:** the review's remaining findings; targeted tests of identity, client lifecycle, callback and form behavior; original auth-document reconciliation; local verification; a bounded, separately approved live-test protocol.

**Outside this plan:** new auth methods, password policy, MFA, roles/sharing, account deletion, profile storage/schema changes, general persistence/routing/state architecture, package-topology changes, deployment configuration, accepting ADR-0005, global coverage thresholds and unrelated shell/fixture cleanup.

### Authority and ownership of planning state

- [ADR-0006](../../architecture/decisions/0006-authentication-with-supabase.md) governs provider/session behavior; [ADR-0007](../../architecture/decisions/0007-app-local-auth-and-account-ownership.md) records selected ownership; [ADR-0008](../../architecture/decisions/0008-auth-actions-and-server-operations.md) governs operations; [ADR-0009](../../architecture/decisions/0009-caller-owned-auth-navigation.md) governs caller-owned navigation.
- The [original spec](../specs/2026-10-13-auth-refactor-design.md) supplies behavioral requirements, subject to accepted decisions. Its outdated status claims are a known contradiction, not a source of new authority.
- Original ARF task completion stays in the [parent](2026-10-13-auth-refactor.md), [foundation](2026-10-13-auth-refactor-foundation.md), [operations](2026-10-13-auth-refactor-operations.md) and [navigation](2026-10-13-auth-refactor-navigation.md) plans. This plan owns only **AHF-00 through AHF-09** and their checkboxes. AHF-07 reconciles original task evidence there; do not mirror their checklists here.
- Each execution batch gets a fresh exact manifest in [task scope](../../../.agents/task-scope.md), including numeric budgets, approvals, checks and recovery. File lists below bound candidate work; they do not authorize every listed mutation automatically. No external tracker is created.

### Review baseline and known contradictions

The 2026-10-16 review observed the implemented module migration, operation contracts, caller-owned navigation, cookie/cache-header repair, unique form message IDs, profile-action tests and removal of duplicate Storybook execution. The root gate returned exit 0; several stages used Turbo cache. Fresh runs passed 244 web unit tests, 244 web coverage tests, 43 web browser tests and 37 Storybook tests. These are historical evidence for this plan, not execution results for the tasks below.

The development-only probe of middleware and ownership returned 5 failed / 2 passed. It demonstrates the current WIP's changed contract; production excludes the bypass. The boundary scanner detected a normal forbidden import but missed comments before specifiers, unlisted server helpers and shared imports of browser-client/environment modules.

Unresolved documentation contradictions include the spec's Proposed-ADR claim, ADR-0007's earlier unselected-layout/enforcement text versus its Selection section, and Proposed/unchecked original plans versus implementation addenda. The original pre-migration WIP recovery baseline and exact execution manifest were not established from committed records. Do not manufacture either retroactively.

Existing WIP to preserve before any implementation:

| Path                                                    | Observed state                                           |
| ------------------------------------------------------- | -------------------------------------------------------- |
| `apps/web/src/features/auth/components/auth-status.tsx` | Modified; fixture label and hidden sign-out              |
| `apps/web/src/features/auth/server/session.ts`          | Modified; synthetic identity returned as verified claims |
| `apps/web/src/lib/supabase/middleware.ts`               | Modified; unconditional development bypass               |
| `packages/frontend/ui/src/components/user-menu.tsx`     | Modified; optional status label                          |
| `apps/web/src/features/auth/shared/development-auth.ts` | Untracked; automatic development flag and fixed user     |

## 2. Recommendations requiring execution approval

These are recommendations, not newly accepted decisions. The implementation owner records the selected contract and exact scope before the affected batch. Other independent batches may continue while a decision is pending.

### D1 — make development identity explicit and consistent

**Recommend:** normal development uses real auth by default. Retain fixture browsing only through an explicit, server-controlled opt-in that cannot activate outside development. Keep fixture display data distinct from verified claims. In fixture mode, browser auth subscriptions and real account/provider mutations must not run against a hidden real session. Show the mode and make unavailable operations clear.

Do not introduce a second credential/session store. A proposed flag such as `SYNAPCITY_DEV_AUTH` is an implementation suggestion, not an adopted durable configuration name. Its final name, values, Turbo environment declaration and documentation must be approved together.

The fixture contract needs an explicit result for owner-area access. If it uses existing user-area pages, identify fixture access separately from verified owner access and enumerate every consuming page. `getVerifiedClaims()` must continue to mean verified provider claims. A fixture must not masquerade as a JWT. Mutations reject fixture mode before constructing the Supabase client, even if called directly as Server Actions.

An alternative is to restore real auth everywhere now and preserve the current bypass outside active source for later design. That requires approval of the exact archival/removal scope; never discard the owner's WIP or silently choose this alternative. If fixture isolation needs new routes, public APIs or a broader access-context redesign, stop and submit that contract rather than extending this plan implicitly.

**Decision evidence required:** mode matrix, fixture/verified access contract, exact environment handling, every affected consumer, mutation policy and recovery snapshot. Record any accepted session/access exception under ADR-0006 with a dated amendment; do not label a proposed policy Accepted through code alone.

### D2 — strengthen existing import checks without a new dependency

**Recommend:** retain the current test-based enforcement and use a small comment-aware lexical scanner for the supported static imports, re-exports and literal dynamic imports. Reject unresolvable dynamic imports in protected layers unless a specifically reviewed exception exists. Replace the hardcoded server-function list with folder ownership plus explicit Server Action entry-point classification. Treat comments as syntax, not as a way to hide a forbidden import.

Cover all source modules marked `use client`, including those outside the current `features`/`components` regex. Shared modules must not import runtime provider clients, environment readers, browser hooks/components, request APIs or ordinary server modules. Preserve the existing permitted pure name-validation and error-mapping dependencies.

This remains a direct-import guard, not proof of the complete client dependency graph. Record that limit explicitly; a transitive graph checker or parser dependency is a separate improvement requiring a new concrete proposal. No parser dependency or production `server-only` dependency is introduced by this recommendation.

### D3 — add consumer-owned DOM test tooling for the uncovered hooks

**Recommend:** use the existing shared React Vitest preset for new web DOM tests. `apps/web` currently uses the Node preset and does not declare the preset's required `jsdom`, `@testing-library/react` and `@testing-library/dom` dependencies. Add those as web dev dependencies only after checking registry versions, Node 24 / React 19 / Vitest 4 compatibility and the shared preset's peer ranges. Reuse existing compatible pins where an exact peer contract requires them and record that reason.

Keep pure/server tests in Node; scope DOM configuration/setup to the component tests. Do not borrow another workspace's undeclared dependencies, switch the whole suite to jsdom by accident, upgrade shared dependencies or accept the broader Proposed testing ADR as a side effect. If the approved dependency setup cannot be resolved, mark AHF-05 blocked and continue independent tasks.

## 3. Task sequence and dependencies

| Task   | Outcome                                                            | Depends on                                                 |
| ------ | ------------------------------------------------------------------ | ---------------------------------------------------------- |
| AHF-00 | Fresh source baseline, preservation snapshot and execution bounds  | Implementation authorization                               |
| AHF-01 | Approved development/test contracts and exact affected manifests   | AHF-00                                                     |
| AHF-02 | Consistent development/verified identity behavior                  | D1 / AHF-01                                                |
| AHF-03 | Negative-tested import-boundary repair                             | AHF-00; approval of D2                                     |
| AHF-04 | Defined and tested sign-out failure handling                       | AHF-00; approval of failure contract                       |
| AHF-05 | Behavioral coverage for provider, confirmation, cooldown and forms | D3 / AHF-01; AHF-02 for fixture behavior                   |
| AHF-06 | Callback handler coverage at its SDK boundary                      | AHF-00                                                     |
| AHF-07 | Original decisions/spec/plans reconciled against evidence          | AHF-02–06 outcomes; blocked items may be recorded honestly |
| AHF-08 | Final local gate and reviewable evidence                           | All approved local source/config changes finished          |
| AHF-09 | Separately authorized live acceptance and bounded handoff          | AHF-08; explicit live-test scope                           |

Execution batches are sequential by default. Independent tasks do not require concurrent agents, and builds/browser suites sharing `.next` must not overlap. A pending D1 or D3 does not block AHF-03, AHF-04 or AHF-06.

### AHF-00 — capture the live baseline and preservation evidence

- [ ] Confirm checkout, branch, HEAD, source status and concurrent ownership; re-read the five WIP files and all intended consumers.
- [ ] Save tracked diffs and complete copies of untracked originals in an approved recovery directory. Include a manifest of paths/checksums and the actual HEAD; a patch alone does not preserve untracked content.
- [ ] Capture the ordinary web unit result and the development-mode ownership/middleware probe before repairing it. Record expected failures separately from environmental failures.
- [ ] Write the next batch's exact create/update/move/remove list and numeric budgets into `.agents/task-scope.md`. Recheck files immediately before mutation; stop on concurrent changes.

**Files:** `.agents/task-scope.md`; this plan only for its own execution evidence. Source is read-only at this checkpoint. Recovery files/logs stay outside the repository under the approved temporary directory; never include secrets in a report.

**Acceptance:** the implementer can restore each authorized hunk and every original untracked file without resetting or cleaning the checkout. Current verification is distinguished from the unproven original ARF-01 baseline. Do not backdate a newly captured snapshot.

### AHF-01 — record selected contracts and dependency preflight

- [ ] Present D1's concrete mode/access/mutation matrix and proposed environment contract for approval. Preserve current URLs unless a separately approved contract requires otherwise.
- [ ] Present D3's exact dependency versions, compatibility evidence, manifest/lockfile changes and Node-versus-DOM test setup. Recheck installed Vitest 4 APIs rather than relying on latest-site examples alone.
- [ ] Record accepted behavior changes as dated ADR-0006 amendments and updated web setup guidance where applicable; retain rejected/deferred alternatives as evidence, not active runtime paths.
- [ ] Produce a final AHF-02 manifest from the chosen mode contract. Count all route/provider/action consumers and any retirement of the untracked shared helper explicitly.

**Candidate documents/configuration:** ADR-0006; `apps/web/README.md`; `.agents/task-scope.md`; this plan; `apps/web/package.json`; `pnpm-lock.yaml`; `apps/web/vitest.config.ts`; `turbo.json` only if the approved fixture flag requires a declaration. Dependency/runtime changes are not executed merely by recording this task.

**Acceptance:** D1 and D3 are each accepted, declined or pending with an identified next action. No source implementation assumes a pending answer. Dependency approval is not an upgrade budget for existing packages.

### AHF-02 — repair the development identity path

- [ ] Write failing mode-matrix tests first: development without opt-in, development with opt-in, test, and production even when opt-in is present. Isolate environment/module evaluation and restore stubs after every case.
- [ ] Restore provider verification as the meaning of `getVerifiedClaims`; keep React request-scoped memoization and request-bound client construction. Never globally cache an authenticated client.
- [ ] Implement only the approved fixture presentation/access contract. Normal development must exercise guest redirects, owner matching and session refresh. Fixture access must be visibly and structurally distinct from verified claims.
- [ ] If fixture mode is retained, bypass real browser subscriptions and reject sign-in/up, OAuth, resend, recovery, profile and password mutations at their server entry points before SDK construction. Provide the approved UI explanation; a disabled control alone is insufficient.
- [ ] Preserve cookie/cache-header propagation on all real-auth middleware branches. Test that production cannot take the fixture branch regardless of flag values.
- [ ] Adapt every enumerated consumer and verify no fixture display is combined with a hidden real mutation identity. Preserve the optional menu status presentation unless an explicitly approved API change removes it.
- [ ] Archive/retire the original untracked helper only within the approved exact removal/move scope. Do not leave a duplicate active authority or unused source file to evade preservation requirements.

**Existing source candidates, relative to the repository root:**

- `apps/web/src/features/auth/server/session.ts` and new `session.test.ts` beside it.
- `apps/web/src/lib/supabase/middleware.ts` and `middleware.test.ts`.
- `apps/web/src/lib/access/require-owner.ts` and `require-owner.test.ts`.
- `apps/web/src/features/auth/components/auth-status.tsx`, `client/user-provider.tsx`, `server/actions.ts` and `server/actions.test.ts` within that feature.
- `apps/web/src/features/account/server/actions.ts` and `actions.test.ts`; `components/profile-form.tsx` if fixture-mode presentation changes.
- `apps/web/src/app/layout.tsx`, `app/[userId]/layout.tsx`, `app/[userId]/page.tsx`, `app/[userId]/home/page.tsx`, `app/[userId]/home/[...path]/page.tsx`, `app/[userId]/settings/page.tsx` and `app/auth/update-password/page.tsx` if the approved access/display contract reaches them.
- `apps/web/src/features/auth/shared/development-auth.ts` is existing untracked WIP. A replacement server-owned configuration/helper and tests must have exact names in AHF-01 before creation; do not place environment readers in pure shared code.
- `packages/frontend/ui/src/components/user-menu.tsx` only if the selected presentation needs a change; no new provider behavior belongs in the UI package.

**Acceptance:** ordinary development and production obey verified-auth invariants; any approved fixture mode cannot cause real account mutations and cannot activate in production. The existing ownership/middleware suites pass under the supported mode matrix, with fixture-specific assertions rather than deleted or weakened expectations.

### AHF-03 — close the demonstrated boundary-check gaps

- [ ] Add negative cases reproducing all four review misses: comment before specifier, previously unlisted ordinary server helper, shared browser-client import and shared environment-reader import.
- [ ] Retain regression cases for side-effect, multiline, relative, alias, `.js`, index, re-export and literal dynamic imports; include leading comments and directive prologues.
- [ ] Classify server modules by ownership/directives. A module-level `use server` action entry point remains callable from clients; ordinary server functions and mixed barrels remain forbidden.
- [ ] Scan all client-marked source modules and enforce the documented shared-layer restrictions. Assert permitted imports too, so enforcement cannot pass by forbidding every import.
- [ ] Emit importer, target and rule in failures. Ensure scanner discovery is nonempty and include a temporary-file fixture that proves a real forbidden source import fails the integrated check.
- [ ] Document direct-import and supported-syntax limits. Update the stale comment claiming TypeScript is not linted; current ESLint does lint it.

**Files:** `apps/web/src/architecture.test.ts`. Prefer keeping the repair there. If extraction improves clarity, approve exactly `apps/web/src/architecture/import-boundaries.ts` and `import-boundaries.test.ts` before creation and include their own layer classification. No dependency addition is planned.

**Acceptance:** every demonstrated violation fails, legal action/shared imports pass, and the actual source scan runs in `pnpm test`. The report does not describe this as full transitive client-bundle isolation.

### AHF-04 — handle sign-out failures without hiding them

- [ ] Add tests invoking the real `signOut` action for success and a returned provider error. Assert sign-out is called once, layout revalidation and redirect still occur, and the failure is observed through the approved logging contract.
- [ ] Implement the previously recommended behavior: redirect anyway and log a sanitized operation/code. Never log the SDK object, cookie, JWT, password, email or complete session. Assert sentinel secret strings cannot appear in emitted logs.
- [ ] Define thrown/unexpected SDK failures explicitly before implementation. Recommend the same redirect with sanitized failure logging for this action; obtain approval if only returned-error handling was authorized. Do not swallow framework redirect control flow inside a broad catch.
- [ ] Retain real SDK sign-out semantics; do not add manual cookie deletion, a new session store or unapproved global-revocation behavior.

**Files:** `apps/web/src/features/auth/server/actions.ts` and `actions.test.ts` only, plus execution scope/evidence.

**Acceptance:** returned provider errors are observable without exposing secrets; approved redirect/revalidation behavior is tested. The result does not claim local or global session revocation was proved by a mock.

### AHF-05 — test the client and form behavior that the current suite misses

- [ ] Add the approved consumer-owned DOM dependencies/configuration, keeping Node tests in Node and applying shared setup only where needed. Validate that a new component test is actually discovered by the normal root test command.
- [ ] Mount the real `UserProvider` with a stubbed SDK subscription. Assert server-prop updates reach consumers; meaningful events refresh once; unchanged sign-in/initial-session/token-refresh events follow the existing filter; unmount unsubscribes; fixture mode never subscribes when that policy is selected. Do not copy sessions into state for test convenience.
- [ ] Exercise `useConfirmation` through a rendered consumer: success enters confirmation, edit returns to populated non-secret fields and focuses email, and a later successful result shows confirmation again. Ensure passwords are not restored from state.
- [ ] Exercise `useCooldown` with controlled time: initial wait/no-wait, countdown to zero, accepted resend restart, failed resend behavior and timer cleanup. Advance timers within React update boundaries and restore real timers.
- [ ] Extend profile-form coverage to a real submit through `useActionState` with only the server-action boundary mocked. Assert invalid-name focus/association, general-error message focus, success status and pending/re-enabled controls. Keep the existing static rendering tests where they still add distinct value.
- [ ] Test `AuthConfirmation` heading focus and the shared error-focus hook's first-empty, first-invalid and message-fallback order. Render simultaneous form messages and assert distinct IDs and correct associations.
- [ ] Extend the existing browser suite for approved confirmation/edit/resend behavior where deterministic public-boundary control is possible. Do not add a production test-only action, endpoint, global hook or broad provider mock to make the test pass.

**Existing update candidates:** `apps/web/package.json`, `pnpm-lock.yaml`, `apps/web/vitest.config.ts`, `apps/web/src/features/account/components/profile-form.test.tsx`, `apps/web/e2e/auth.e2e.ts`.

**Proposed creates:** `apps/web/src/test/setup-dom.ts`; tests beside `user-provider.tsx`, `use-confirmation.ts`, `use-cooldown.ts`, `auth-confirmation.tsx` and `use-focus-first-error.ts`. The execution manifest must enumerate those five colocated filenames and the setup file. Setup must not be imported by production code. Source repairs, if tests expose a defect, require naming the owning source file in scope before editing it.

**Acceptance:** tests drive actual effects, user actions, focus and cleanup rather than injecting the desired final state. Assertions fail when the corresponding behavior is removed. DOM tests do not count as live-provider, cross-tab or browser-layout proof.

### AHF-06 — cover the actual callback handler

- [ ] Invoke the real exported callback `GET` using `NextRequest`, stubbing only Supabase exchange at the adapter boundary.
- [ ] Cover a valid code/user and safe next path; missing/unsafe next falls back to the authenticated user's home; external and normalized protocol-relative destinations cannot escape the app.
- [ ] Cover missing code, exchange error and absent returned user across confirm/reset/OAuth/unknown flow reasons. Assert the exact recovery destination and that missing code never calls the exchange.
- [ ] Assert raw provider messages/session/token sentinels never appear in redirect locations or client-visible responses.
- [ ] Keep existing callback origin, PKCE, flow semantics and cookie integration unchanged. If a test exposes a response-cookie/cache defect, reproduce it against installed SDK/framework behavior and scope the repair separately before editing the adapter.

**Files:** create `apps/web/src/app/auth/callback/route.test.ts`; read `route.ts`, routing helpers and Supabase server adapter. Update `route.ts` only for a demonstrated defect within a separately approved repair manifest. Existing safe-next/flow helper tests remain.

**Acceptance:** the Route Handler's real decision path is covered. Mocked code exchange is labeled as such; it does not prove a real PKCE link or OAuth session.

### AHF-07 — reconcile original documents using evidence

- [ ] Read the accepted decision text and implementation addenda together. Separate already accepted choices from genuinely open questions; preserve the owner's willingness to create auth/service packages.
- [ ] Correct the spec's outdated ADR/status claims and the selected-layout/enforcement contradictions. Preserve proposal history through a dated reconciliation note rather than silently rewriting history or declaring all requirements approved.
- [ ] In each original owning ARF plan, mark an item complete only when its actual acceptance evidence exists. For mixed implementation/manual items, explain the remaining work rather than treating source existence as verification.
- [ ] Record the original ARF-01 manifest/baseline evidence as unavailable unless it is actually recovered. A fresh AHF-00 snapshot is not a substitute for that historical proof. Do not claim original execution sequencing from current tests.
- [ ] Update the web README's outdated claim that actions/proxy are untested and document the approved development/test contract. Keep live-email/OAuth/RLS limitations explicit.
- [ ] Keep profile metadata versus `profiles` ownership, broader permissions, package reconsideration, testing ADR and deployment questions open where governing decisions leave them open.

**Exact document candidates:** ADR-0007, ADR-0008, ADR-0009; `docs/superpowers/specs/2026-10-13-auth-refactor-design.md`; `docs/superpowers/specs/2026-10-14-arf-00-layout-evidence.md`; the four original ARF plans linked in section 1; `apps/web/README.md`. ADR-0006 is additionally eligible only for the approved D1 amendment. Update this AHF plan only for its own task state/evidence and `.agents/task-scope.md` for bounds. No PRODUCT, glossary, engineering-policy or unrelated ADR changes are included.

**Acceptance:** a reader can distinguish selected topology, implemented code, tested behavior, unavailable historical evidence and remaining live acceptance without resolving contradictory status labels. Decisions remain owned by ADRs; original ARF checklists remain in their existing files.

### AHF-08 — run the final local checks and review the complete diff

- [ ] Review the final diff against every approved batch manifest and AHF-00 preservation evidence. Confirm no concurrent work was overwritten, no unintended old auth copies remain and no dependency/public-API change escaped its scope.
- [ ] Run relevant focused suites directly, including the mode matrix and scanner negative fixtures, then `pnpm --filter web exec vitest run --coverage`. Record meaningful uncovered behavior, not just percentages.
- [ ] Run `pnpm verify` once after all source/config changes are finished. Record the actual exit and each stage; identify cache reuse and stages not reached after any failure. Do not alter the chain or suppress tests to produce green output.
- [ ] Ensure browser tests use the intended production build and do not accidentally reuse a fixture/dev server. Inspect port ownership before starting; never terminate a user-owned server. Run builds and `.next` consumers sequentially.
- [ ] Exercise available signed-out/navigation/focus/responsive behavior in light/dark modes and with reduced motion as relevant to changed UI. Distinguish manual observation from automated browser assertions.
- [ ] Record results with source revision/WIP identity, runtime/package-manager versions, commands, counts, failures, cache use and unverified cases. If changed source invalidates evidence, rerun only affected checks plus the required final gate.

**Files:** read-only final diff; `.agents/task-scope.md` and this plan for scoped execution evidence. Verification outputs stay in ignored tool directories or the approved external evidence directory. Repairs return to their owning task and exact manifest.

**Acceptance:** the standard gate passes on the final approved tree, all critical targeted checks run freshly, and the report can still say NOT VERIFIED for what local checks do not reach. No commit, push, PR, merge or deployment is implied.

### AHF-09 — run a bounded live acceptance pass and hand off

- [ ] Obtain explicit authorization naming the Supabase project/environment, app origin, disposable account/mailbox ownership, second-account scope, permitted email/OAuth/profile/password mutations and cleanup. Availability of credentials alone is not this authorization.
- [ ] Use real auth mode to exercise the matrix below; fixture mode must be disabled. Record a precondition, action and observable outcome for each case; redact account identifiers and secrets.
- [ ] Inspect environment/callback allow-list and deployed caching behavior read-only where authorized. Provider settings, schema/migration changes, SMTP configuration and deployment remain outside this plan's execution scope.
- [ ] Record test-account cleanup only within the approved recovery scope. Account deletion or provider-configuration cleanup needs its own exact authorization; never improvise it.
- [ ] Produce a final handoff naming completed follow-ups, blocked/declined items, open decisions, current uncommitted artifacts, exact local/live evidence and the next safe action. Leave this task incomplete if live access is unavailable, even when AHF-08 passes.

| Live case                              | Required observable result                                                                                                                                                   |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Password sign-in and sign-out          | Correct account appears; sign-out returns to public state; protected direct navigation requires auth again                                                                   |
| New-account signup and confirmation    | Neutral signup response; actual link returns through configured callback; expected account/session appears                                                                   |
| Confirmation resend and address edit   | Existing privacy/rate-limit contract; correct address/context retained; later submission works                                                                               |
| Recovery and password update           | Real reset link reaches update form; password change works; expired/reused link has a usable recovery path                                                                   |
| Google and GitHub                      | Each permitted provider completes at the configured app origin; callback failure has the correct recovery destination                                                        |
| Profile update and refresh             | Name changes for the real caller; header reflects it; unrelated metadata remains                                                                                             |
| Two-account URL ownership              | A cannot read B's user-area route; URL changes do not change mutation identity; actual resource/RLS claims require separately available data evidence                        |
| Cross-tab sign-out and session refresh | Other tab updates appropriately; expired/refreshed session survives navigation without stale identity or redirect loops                                                      |
| Deployed response isolation            | Where an approved deployed environment exists, cookie-writing responses carry appropriate cache restrictions; no cross-account response reuse is observed in the scoped test |

**Acceptance:** each applicable row has live evidence or an explicit NOT VERIFIED / unavailable result. A successful application-route check is not represented as a complete RLS audit. Outstanding required live rows remain open completion work.

## 4. Validation commands and evidence rules

Confirm these commands against live manifests before execution. The inspected repository uses pnpm 11.25.0, Node >=24, Next.js 16.3.8, React 19.2.8, Supabase SSR 0.12.7 / JS 2.117.3 and Vitest 4.1.11. No existing dependency upgrade is proposed.

```sh
pnpm --filter web exec vitest run src/architecture.test.ts
pnpm --filter web exec vitest run src/lib/supabase/middleware.test.ts src/lib/access/require-owner.test.ts
pnpm --filter web exec vitest run src/features/auth/server/actions.test.ts src/features/account/server/actions.test.ts
pnpm --filter web exec vitest run src/app/auth/callback/route.test.ts
pnpm --filter web exec vitest run
pnpm --filter web exec vitest run --coverage
pnpm --filter web check-types
pnpm --filter @synapcity/frontend-ui test
pnpm verify
```

The callback command applies after its test exists. Run newly added DOM tests by their exact filenames as well as through the ordinary suite. Run the original `NODE_ENV=development` middleware/owner reproduction before repair; after repair, use isolated mode tests so opt-in fixture expectations and normal auth expectations are both deliberate. Do not mutate global runtime settings to hide a failing branch.

`pnpm verify` runs formatting, lint, types, Knip, brand checks, unit tests, coverage, web e2e, Storybook/a11y and builds. It stops on the first failure. The web e2e task's build prerequisite must complete before its server starts. Browser installation and local ports are prerequisites; an environment failure is not an auth regression. A temporary runtime launcher is acceptable when needed, but record the actual pinned version and do not modify project configuration to work around a host launcher.

**Test quality:** mock SDK/framework boundaries, not the behavior under test. Call real actions/handlers, render real hooks/forms, assert exact safe outcomes and user-visible behavior, use fake time only for time-dependent behavior and prove new guards fail on planted violations. Coverage percentages are evidence of execution, not acceptance of the security contract.

### Version-sensitive evidence

Checked during plan authoring on 2026-10-16:

- Installed `apps/web/node_modules/vitest/dist/index.d.ts` declares `vi.stubEnv`, `vi.unstubAllEnvs` and `vi.resetModules`; these support isolated environment/module tests with the installed Vitest 4 release.
- [Vitest environment guide](https://vitest.dev/guide/environment.html) describes Node/DOM environments and per-file selection. The current site references Vitest 5, while this repo uses 4; the version-specific archive was inaccessible during authoring. Reconfirm any proposed configuration against installed Vitest 4 declarations before changing it; this plan does not adopt a Vitest 5 API.
- [React act reference](https://react.dev/reference/react/act) supports flushing component updates in tests. Use the existing shared setup rather than inventing production update hooks.
- [Next.js data security](https://nextjs.org/docs/app/guides/data-security) explains action-level authorization and limited data exposure; [Supabase SSR client guidance](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs&queryGroups=framework) explains client/server separation, verified claims and cookie/cache-header propagation.

New dev-dependency versions are deliberately not selected here. AHF-01 must verify them from the registry and installed peer/runtime constraints. Unreachable authoritative evidence is reported as NOT VERIFIABLE rather than filled from memory. Upstream guidance informs the implementation; accepted Synapcity decisions govern its scope.

## 5. Recovery, stopping and completion

Each batch must be independently reviewable and recoverable from its captured live baseline. Preserve current untracked content and unrelated edits; never use blanket checkout/reset/stash/clean as recovery. Revert only approved task hunks, and reverse dependency manifests/lockfile together when dependency recovery is authorized. Test artifacts can be discarded only within the approved temporary/ignored-output scope; do not delete user data or account state as cleanup.

Stop the affected batch on source drift, a new dependency/API/route/storage requirement, missing scope, an unresolved decision, an unknown live-account owner or a required mutation outside its named files. Report the precise condition; continue independent authorized tasks. If a fix changes the manifest, update and obtain approval before executing the new mutation class.

Completion has two explicit stages: **local implementation verified** after approved source changes, document reconciliation and AHF-08; **live acceptance verified** only after the applicable AHF-09 evidence. Partial, declined or blocked items remain visible. Never translate a green local gate into live-provider, database-isolation or product-validation claims.

Final evidence must name what changed and why, preserved auth behavior, approved deviations, decisions left open, fresh/cached checks and their exits, negative-test results, unverified cases, pre-existing failures, remaining WIP and the next safe action. Keep this plan Proposed until implementation approval is actually recorded; authoring it does not approve execution.
