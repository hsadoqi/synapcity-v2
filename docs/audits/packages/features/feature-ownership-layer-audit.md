# Feature ownership layer audit (read-only)

Branch `feat/register-auth-flow`, 2026-11-11. Nothing in the repository was modified. Probes ran from the scratchpad. The uncommitted server work (server-account, server-data testing, the deletion action) was read, not touched.

Scope: the five feature packages (`features-auth`, `-account`, `-settings`, `-spaces`, `-dashboards`, about 11,600 lines without tests) and their web counterparts in `apps/web/src/features` (account, auth, dashboards, documents, home, settings: about 3,800 lines). Shared frontend packages were read as evidence only.

## Summary

| ID   | Finding                                                                                                                                                      | Severity                     | Owner                                     | Reconcile with frontend? |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- | ----------------------------------------- | ------------------------ |
| FA1  | The register form posts `name`; the branch's `signUp` action requires `firstName`. Email registration is refused (verified)                                  | **High, blocks this branch** | features-auth + web action                | No                       |
| FA2  | The `next/` folder split is only nominal: 11 portable modules import from it, and `./frontend` re-exports it                                                 | Medium                       | features-auth, features-account           | **Yes**                  |
| FA3  | The final deletion card ignores `linkRequired`, so an expired link still shows the destructive button (verified)                                             | Medium                       | features-auth                             | No                       |
| FA4  | Auth/account outcome-to-copy mapping lives in the app, settings/spaces put server composition in a feature `./server`, and the settings precedent is shallow | Medium, needs decision       | features-auth/account vs web host         | No                       |
| FA5  | `export *` entries expose far more than consumers use, and Knip cannot see it                                                                                | Low–Medium                   | features-auth, -account, -settings        | No                       |
| FA6  | Two relative-time formatters disagree in wording, rounding and time zone                                                                                     | Medium                       | features-dashboards / frontend-collection | **Yes**                  |
| FA7  | Supabase Auth error codes are the vocabulary of a "portable" feature contract                                                                                | Low                          | features-auth / server-supabase           | No (server)              |
| FA8  | The browser-client capability is typed as the whole Supabase client                                                                                          | Low                          | features-auth / frontend-supabase         | **Yes**                  |
| FA9  | `serverDashboardStorage` is portable feature code sitting in `apps/web/lib`                                                                                  | Low                          | features-dashboards                       | No                       |
| FA10 | Home and the Documents/Dashboards web features: known migration inputs, gated on naming                                                                      | Known, gated                 | home / resource features                  | Partly                   |

Things checked that should **not** change are in section C.

## A. Findings

### FA1. Register form and sign-up action disagree on the name field. High, blocks this branch

- **Evidence.** [register-form.tsx:46-55](packages/features/auth/src/frontend/components/register/register-form.tsx) renders one `name` field and validates in the browser with the legacy `signUpSchema`. On this branch, [actions.ts:112-118](apps/web/src/features/auth/server/actions/actions.ts) parses `firstName`/`lastName` with `registrationSchema`. Nothing maps one to the other.
- **Verified.** A probe that fed `registrationSchema` the values `signUp` builds from the form's real fields (`firstName: ''`) returned: `REFUSED firstName: "Enter your first name."` and `"Use letters, spaces, apostrophes, hyphens or full stops."`.
- **User-visible result.** Every email registration fails. The browser check passes, the server refuses, and the error names `firstName`, a field the form doesn't render, so nothing on screen can be marked or fixed.
- **Why tests pass.** The action tests post `firstName` ([actions.test.ts:187](apps/web/src/features/auth/server/actions/actions.test.ts)). The form tests feed it a `name` state. No test posts the form's real fields to the real action. `auth.e2e.ts:217` fills only "Name", but it checks a client-side refusal, so it never reaches the server path.
- **Scope.** On `main` the action still reads `name` (0 `firstName` matches), so this is branch-only. f5cfac50 changed the action. The `AuthState.data.user.name` comment already calls the form transitional.
- **Recommendation.** Before this branch merges, move the form to `firstName` + optional `lastName` with `registrationSchema` in the browser, so browser and server refuse with the same message on the same field. Then drop the transitional `name` from `AuthState`. Add one test that submits the form's real `FormData` to `signUp`. That's the seam that broke. Relates to domain F1 (null display name), which has the same root cause: the name-model migration was done one layer at a time.

### FA2. The `next/` split doesn't isolate Next.js. Medium, **requires feature/frontend reconciliation**

- **Current owner:** features-auth and features-account.
- **Evidence.** Next.js imports are confined to `frontend/next/**` (7 files). However, these portable modules import from their own `next/` folder:
  - auth: `delete-account`, `password-reset`, `forgot-password-card`, `register-card`, `current-user-avatar` and `connected-accounts`, which use `SignInAgain`, `AuthLinkButton` and `useCurrentUser`
  - account: `profile-setup-form`, `avatar-form`, `avatar-field`, `name-field` and `name-form`, which use `ProfileFormShell` and `useProfileForm`

  Both packages also have a single `./frontend` entry that does `export * from './next/...'`.

- **Consequence.** A non-Next host (the planned desktop/mobile hosts, or a plain Vite Storybook) can't import even `RegisterCard` without `next/navigation`. The folder suggests a boundary that neither the package entry nor `pnpm boundaries` enforces.
- **Underlying issue.** The Next.js need is small: `usePathname` (for sign-in-again return paths and the profile form shell), `useRouter().push/refresh`, and link rendering. These are host navigation capabilities.
- **Cross-package dependency.** Links come from `@synapcity/frontend-ui/next/link-button`. `frontend-collection` already solves the same problem with a host-supplied `CollectionNavigationProvider`. Whether a navigation capability is shared frontend infrastructure or a feature-level prop is the frontend agent's call.
- **Recommended target.** Keep the auth/account components in their features. Inject navigation (a current path, a push/refresh function, a link component) through one host-bound provider or through props, and expose `./next` as a separate entry if Next-specific wrappers remain.
- **Migration requirements.** About 11 components and their tests/stories. The web app mounts one provider. Account's `ProfileFormShell` context must move out of `next/` because portable fields consume `useProfileForm`. Adding an entry such as `./next` is a public-API change (§5 approval).
- **Do not independently redesign:** the navigation capability's shape and home.

### FA3. The last deletion step ignores `linkRequired`. Medium

- **Evidence.** The web action returns `{ linkRequired: true, error }` when the link has expired. The only consumers of `linkRequired` are the action test and a card test that checks only the error text. [DeleteAccountCard](packages/features/auth/src/frontend/next/components/delete-account-card/delete-account-card.tsx) renders `state.error` and keeps the enabled "Permanently delete my account" button.
- **User-visible result.** After expiry the person can keep pressing a destructive button that can only fail again. The way forward ("Ask for a new link from your settings") sits behind a link labelled "Keep my account". The page's own non-fresh branch already renders the right state ("Ask for a new link" plus "Back to settings").
- **Recommendation.** When `linkRequired` is set, the card should drop the delete button and show the settings path as the primary action, matching the page's non-fresh state. This changes only features-auth presentation, with no change to the active server work. The test should assert that the button is gone, not just that the text is present.

### FA4. Where feature server composition and copy live. Medium, **owner decision**

- **Evidence.**
  - Auth and account have no `./server` entry. Their server orchestration (about 1,100 lines in `apps/web/src/features/{auth,account}/server`) maps server outcomes to product copy, for example the new deletion outcomes in [delete-account/actions.ts](<apps/web/src/app/(auth)/auth/delete-account/actions.ts>) and the `saveAvatar` reasons in [save-avatar.ts](apps/web/src/features/account/server/save-avatar.ts).
  - The features README and the ownership map say product operation copy belongs to the feature. Logging, revalidation, fixture mode and `'use server'` are host policy, as the settings README already says.
- **The existing precedent is weak.** `features-settings/server` is a 12-line pass-through on the **read** path, and the web app wraps it again. The **write** action bypasses it and calls `server-account` directly. Copying that pattern to auth/account would add a layer without a rule.
- **Tradeoff.**
  - (a) Keep copy in the host. Each new host would duplicate it.
  - (b) Put an outcome-to-message mapper in a feature contract. Feature contracts may depend only on domain, so the outcome unions (`deleteOwnAccount`'s, `saveAvatar`'s) would need a domain or feature-contract home rather than `server-account`.
  - (c) Add a feature `./server` entry that owns orchestration plus copy, while the host keeps `'use server'`, logging, revalidation and redirects.
- **Recommendation.** Decide one rule and apply it to settings, spaces, auth and account together. Do this **after** the active server-account work lands, because the files overlap. It's a public-API/topology choice (§5).

### FA5. Public surface width. Low–Medium

Names that consumers import, compared with what the entries expose:

| Entry                        | Consumed names                                                                                  | Exposed                                                                            |
| ---------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `features-settings/frontend` | 6 (`SettingsPageShell`, `SettingsContent`, `AccountPreferencesSync`, three tab/accordion parts) | 33 `export *` modules (every hook, draft helper and the import/download utilities) |
| `features-account/frontend`  | 3 (`ProfileAvatar`, `ProfileSetupForm`, `ProfileSummary`)                                       | All forms and fields                                                               |
| `features-auth/frontend`     | 19                                                                                              | 5 nested `export *`                                                                |

Knip treats `exports` entries as public, so it can't flag unused names behind `export *`. Spaces and dashboards already name their exports, and fc24ee49 narrowed identity for the same reason. Recommendation: name the exports, keep what has consumers, and do it package by package. This removes nothing internal, so `AvatarForm` and `NameForm` stay because `ProfileSummary` uses them.

### FA6. Relative time is formatted two ways. Medium, **requires feature/frontend reconciliation**

- **Current owners:**
  - features-dashboards: [relative-time.ts](packages/features/dashboards/src/frontend/utils/relative-time/relative-time.ts), used by the feed widget
  - frontend-collection: `formatAgo`, `formatUpdated` and `formatEntityDate`
- **Observed differences.**

  | Formatter                 | Wording                             | Rounding                                | Days                                                            |
  | ------------------------- | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------- |
  | dashboards `relativeTime` | "12 min ago", "3 hr ago", "2 d ago" | `Math.round`, so 30 s reads "1 min ago" | Elapsed 24 h blocks                                             |
  | collection `formatAgo`    | "12m ago", "3h ago", "Yesterday"    | Floor                                   | Calendar days in a time zone, so late last night is "Yesterday" |

  Dashboards ignores the user's time zone preference.

- **Underlying issue.** One product concept, "how long ago", has two owners and no shared rule, so the same instant can read differently on Home and on a dashboard.
- **Recommended target:** for the frontend agent to decide. Plausibly one formatter in a frontend package, or in domain-preferences next to the existing `Intl` formatting. Product wording stays a feature decision.
- **Migration requirements.** The feed widget and its tests. Wording changes are visible and need owner sign-off.
- **Do not independently relocate.**

### FA7. Supabase error codes in auth's portable contracts. Low

[error-messages.ts](packages/features/auth/src/contracts/utils/error-messages/error-messages.ts) maps 28 Supabase Auth codes (`invalid_credentials`, `over_email_send_rate_limit` and others) to copy, and server-supabase passes raw `outcome.code` through. The copy rightly lives in the feature, but the vocabulary belongs to the provider, so the "portable contract" is Supabase-shaped. This is the feature-side twin of domain F7. A neutral reason union returned by server-supabase would be the clean seam. That's a server-owned change, so it's recorded here only. The anti-enumeration rule in that file (account-existence codes fall to the default) must be preserved in any change.

### FA8. The browser-client capability is the whole SDK client. Low, **reconciliation**

`UserProvider` and `EmailChange` correctly receive `createClient` from the host, but they type it as `ReturnType<typeof createBrowserSupabaseClient>`. They use only `auth.onAuthStateChange` and `auth.refreshSession`. A narrow capability type would make the contract honest and easier to fake. Its home (feature contract or `frontend-supabase`) is for the frontend agent to decide.

### FA9. `serverDashboardStorage` lives in the app. Low

[server-dashboard-storage.ts](apps/web/src/features/dashboards/lib/server-dashboard-storage/server-dashboard-storage.ts) imports only `domain-dashboards` and `features-dashboards/contracts`, and takes the Server Action as a parameter. It's the sibling of `browserDashboardStorage`, which the feature already exports. It's a candidate to move into `features-dashboards/frontend`, which would add one export, but it isn't urgent.

### FA10. Known migration inputs. Recorded, not new

- **Sample content on Home.** The production Home route renders fixtures (items, tabs and `FIXTURE_NOW`) behind a visible "This is sample content" alert. The ownership map already lists this.
- **Resource copy in Home.** `home/lib/resources/{dashboards,documents,spaces}.ts` hold resource copy that the map assigns to each resource's feature. Spaces already has a feature, so its config can move. Documents and Dashboards are "strong working term", not final, in the glossary, so a `features-documents` package needs the §3 naming step first.

## B. Observations on the active (uncommitted) server work

Not fixed, and not part of the feature scope. Listed because they will stop `pnpm verify`:

- `pnpm boundaries`: 1 violation. R7: `packages/server/data/src/testing/index.ts` imports `./db/stack-env` directly instead of through its folder index.
- `pnpm deps` (Knip): 2 unused exports: `DELETION_MARKER_WINDOW_MS` (`server-account/src/account-deletion/deletion-marker.ts:10`) and `deferred` (`server-account/src/testing/fake-account-client.ts:307`).
- FA3 and FA4 touch the deletion action that this work rewrites. Sequence them after it lands.

## C. Checked and recommended to keep

- **The three `toCollectionItem` mappers** (dashboards, documents, spaces). They have the same shape but different routes and details (space count vs. contents). Consolidating them would couple three resources to save about 10 lines each. Keep them separate.
- **Deletion and profile-setup UI in `features-auth`.** Server deletion now lives in `server-account`, so the feature and server placements differ. The ownership map (M7.5) placed the cards in auth deliberately, and `features-auth → features-account` is acyclic. This is an owner decision, not a defect.
- **`UserProvider` design.** It holds no copy of the user in state, uses only synchronous auth-event handling, and treats a fixture user explicitly. Sound.
- **Spaces and dashboards entries.** Named exports, a `server-only` guard on spaces' `./server`, and fixtures kept in `testing/` and dev fixtures, not in production paths.

## D. Verification

| Check                                                | Result                                                  |
| ---------------------------------------------------- | ------------------------------------------------------- |
| `pnpm boundaries`                                    | Failed: 1 violation, in the active server work (B)      |
| `pnpm deps`                                          | Failed: 2 unused exports, in the active server work (B) |
| Registration schema probe (scratchpad Vitest config) | Confirmed FA1 at the schema level                       |
| FA3                                                  | Confirmed by source and test inspection                 |

**Not run:** `pnpm lint`, `typecheck`, `test`, `test:e2e`, `test:storybook`, `build`, and any browser check. FA1's end-to-end effect (a refused submit in a running app) is inferred from the schema probe and source, not observed in a browser.

Probe files in the scratchpad: `probe.test.ts`, `vitest.probe.config.mts`, `consumers.mjs`.
