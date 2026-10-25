Each milestone has one outcome; we can refine its scope, decisions, and completion criteria individually.

| #      | Milestone                                | Outcome                                                                                                                                                                         |
| ------ | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1**  | **Isolated workspace and baseline**      | A dedicated worktree containing the current implementation, with the starting state and verification results recorded.                                                          |
| **2**  | **Architecture agreement and documentation** | A clear ownership map for `apps`, `domain`, `frontend`, `server`, `features`, and `dev`, with conflicting guidance reconciled.                                              |
| **3**  | **Package conventions and boundary enforcement** | Consistent package structure, public exports, runtime separation, and automated dependency checks that ratchet down a recorded list of known violations.                |
| **4**  | **Server identity boundary**             | A reusable server-side session and user-context boundary that later server capabilities can depend on, with existing auth behavior preserved.                                   |
| **5**  | **Collection and Spaces pathfinder slice** | The first complete capability works through the new domain, frontend, server, and feature boundaries, consumed by web and demonstrated in Storybook. Foundations it needs (domain contracts, fixtures, shells) are extracted here, just in time. |
| **6**  | **Preferences and Settings migration**   | Preference rules, persistence, platform effects, and the Settings experience have distinct, reusable owners.                                                                    |
| **7**  | **Authentication and Account migration** | Authentication and account capabilities are organized into reusable server and feature packages with their behavior preserved.                                                  |
| **8**  | **Documents and Dashboards migration**   | Whatever Documents and Dashboards capabilities actually exist follow the established contracts, repositories, collection presentation, and feature-composition patterns.        |
| **9**  | **Home and aggregate experience migration** | Home composes the extracted capabilities, with overlapping implementations consolidated and fixture/demo behavior explicitly separated.                                      |
| **10** | **Final verification and sweep**         | Any remaining compatibility layers and obsolete paths are retired, documentation matches the implementation, and the completed architecture is verified.                        |

**The standing expectations across all milestones** are to:

- preserve existing behavior unless a change is explicitly scoped;
- keep apps integrated as capabilities move;
- add relevant Storybook/test coverage alongside the work;
- report verification gaps accurately;
- retire a capability's temporary compatibility exports in the milestone that migrates it, rather than deferring them to the end;
- reduce the boundary-check allowlist (Milestone 3) with every migration, never grow it;
- stop for explicit human approval wherever the repository's approval gates apply (package topology, persisted schemas, public APIs, durable identifiers, auth/security behavior).

Desktop and mobile remain architectural consumers we prepare for throughout this work. Building those applications would be separate milestones beyond this reorganization.

## Ordering rationale

- **Contract and enforcement come before any code moves** (1–3), so every later migration follows an established, checked pattern.
- **Foundations are driven by a real consumer.** Domain contracts, fixtures, and shells are extracted as the first vertical slice (5) needs them, not as speculative horizontal layers. Later migrations reuse and extend them.
- **Server identity precedes the first server capability** (4). Spaces needs an authenticated user and session context, so that boundary exists before Spaces uses it. The full Auth and Account feature migration (7) comes later, once the pattern is proven.
- **Settings precedes full Auth/Account** (6 before 7) because it depends only on the identity boundary from 4, and it exercises the pattern on a lower-risk surface first.
- **Documents and Dashboards** (8) are scoped only after confirming what exists today; fixtures alone are not capabilities.
- **Home last** (9) because it composes everything else.

## Approval gates by milestone

| Milestone | Likely gates                                                                                  |
| --------- | --------------------------------------------------------------------------------------------- |
| 2         | Architectural ownership, package/repository topology                                          |
| 3         | Enforcement tooling or dependency choices with architectural consequence                      |
| 4         | Auth/security-sensitive behavior, public server API                                           |
| 5         | Persisted schemas and durable identifiers (if touched), public package APIs                   |
| 6         | Persistence and preference schema, if changed                                                 |
| 7         | Auth/security-sensitive behavior, session handling                                            |
| 8         | Persisted schemas and lifecycle models, if capabilities are new or changed                    |
| 9         | None expected beyond the standing rules                                                       |
| 10        | Destructive removal of obsolete paths (exact scope and recovery plan required)                |

---

## Milestone 2: Architecture agreement and documentation

Its purpose is to turn our agreed direction into a precise architecture contract before we start extracting packages. The baseline should be recorded before implementation changes begin.

I’d break **Milestone 2: Architecture agreement and documentation** into these parts:

| Part    | Focus                                    | What we need to establish                                                                                                                                      |
| ------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **2.1** | **Category responsibilities**            | What belongs in `domain`, `frontend`, `server`, `features`, `dev`, and `apps`, including how to handle responsibilities that cross those boundaries            |
| **2.2** | **Dependency and runtime rules**         | Which categories may depend on which; how feature frontend/server entry points stay separate; where framework and platform integration belongs                 |
| **2.3** | **Package grouping and public interfaces** | When related modules belong in one package, when a separate package is useful, and how consumers access supported entry points                               |
| **2.4** | **Current-to-target ownership map**      | Where the existing schemas, collection mechanics, shells, preferences, auth/account operations, fixtures, and feature composition should land                  |
| **2.5** | **Migration and preservation rules**     | How we keep the app working during the transition, handle temporary compatibility exports, and distinguish structural moves from behavior changes              |
| **2.6** | **Documentation reconciliation**         | Record the decisions and update conflicting architecture docs, package conventions, ADR references, and agent guidance                                         |

**We’ve already agreed on the direction.** These discussions should refine its boundaries rather than reopen every choice. For example:

- `frontend/shells` will group multiple shell implementations.
- `features` will own product-level composition.
- `server` will provide reusable backend capabilities.
- `dev/fixtures` will supply synthetic data and scenarios.
- Planned consumers and your preference for early optimization count when evaluating package boundaries.

**The remaining questions are more specific.** For instance, whether generic collection mechanics belong in a frontend package while product browsing composition belongs in a feature package; how much orchestration a feature’s server entry point owns; and which related server responsibilities should initially share a package.

Milestone 2 should finish with three concrete results:

1. **An ownership contract** explaining where responsibilities belong.
2. **A dependency/runtime matrix** explaining which connections are allowed.
3. **A migration map** connecting the current implementation to the intended owners.

---

## Milestone 3: Package conventions and boundary enforcement

**Next on our roadmap is Milestone 3: package conventions and boundary enforcement.** This is where we decide how packages are structured, how consumers access them, and how the repository checks the boundaries described in the READMEs.

The umbrella READMEs give us the first concrete part of Milestone 2. Its remaining ADR/convention reconciliation is still a prerequisite for implementation; we can discuss Milestone 3 now without treating that reconciliation as complete.

I’d break this milestone into five focused parts:

| Part    | Discussion                                       | Result                                                                                           |
| ------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| **3.1** | **Package grouping and naming**                  | Rules for when modules belong together, when to create a package, and how packages are named     |
| **3.2** | **Public entry points and runtime separation**   | Clear interfaces for portable contracts, frontend code, and server code                          |
| **3.3** | **Internal file organization**                   | A predictable structure that avoids unnecessary folders, wrappers, and barrels                   |
| **3.4** | **Dependency enforcement**                       | Automated checks for allowed imports, runtime isolation, and cycles, with a violation allowlist  |
| **3.5** | **Build, test, and catalogue integration**       | Consistent expectations for checking packages and exercising their public interfaces             |

**I’d start with 3.1—package grouping and naming.** It determines the units that the other rules will apply to.

My proposed principles are:

- **Group by cohesive responsibility.** `frontend/shells` can contain several shells; a data package can contain several related repositories. A new component or query does not automatically need another package.
- **Create a separate package when the boundary earns its place.** Useful reasons include ownership, runtime isolation, independent testing, different dependencies, expected reuse, or a different rate of change.
- **Count planned consumers.** Desktop/mobile and Storybook are legitimate design inputs now. A second active consumer is not a prerequisite.
- **Keep package names consistent with their umbrella.** I would retain the repository’s existing `@synapcity/<category>-<name>` convention—for example, `@synapcity/frontend-shells`, `@synapcity/server-auth`, and `@synapcity/features-settings`. Those are naming examples; the complete package inventory still needs refinement.
- **Allow packages to grow internally before splitting them.** Explicit modules and public entry points can provide useful separation within one package.

For **3.2**, the important question is which interfaces a consumer can reach. A feature containing frontend and backend composition needs distinct entry points so importing its presentation cannot pull in its server implementation. Internal files should remain private unless they deliberately form part of the public interface.

For **3.3**, I’d favor a shallow structure with meaningful groups. We should avoid imposing the same `shared/server/client/components` tree on every package or requiring a folder and barrel for every small helper. Structure should reflect the responsibilities actually present.

For **3.4**, the checks should enforce concrete failures:

- A package imports source from an app.
- A frontend entry point reaches server implementation, including indirectly.
- A domain module reaches framework or platform code.
- A consumer bypasses a package’s public interface.
- Dependencies introduce a cycle.
- A shipped entry point reaches fixture or test infrastructure.

Because code has not yet moved, the checks will initially fail on existing code. The check should therefore start from a **recorded allowlist of known violations that can only shrink**: new violations fail immediately, and each migration milestone removes the entries it fixes. A portability check (importing `domain` in a plain Node test with no DOM or framework) should be part of this, since desktop and mobile are planned consumers.

The existing architecture test gives us a starting point, but its direct-import scan inside web is too narrow for the intended workspace boundaries.

For **3.5**, each package should participate in the repository checks appropriate to what it owns. Feature presentation should also be consumable by Storybook with fixtures and fake capabilities, while backend tests exercise operations through controlled provider boundaries.

**The milestone’s completion criterion would be a small, documented package convention plus working checks that demonstrably reject new forbidden dependencies, with the known-violation allowlist recorded.** That would make the later migrations follow an established pattern.

---

## Milestone 4: Server identity boundary

Its purpose is to give server capabilities a single, reusable way to obtain the authenticated user and session context, before the first server-backed capability (Milestone 5) depends on it. This is a deliberately small slice of the Authentication work, not the full Auth and Account migration (Milestone 7).

| Part    | Focus                           | What we need to establish                                                                                                                              |
| ------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **4.1** | **Identity contract**           | What a server operation receives: user identity, session, and how an unauthenticated caller is represented, as a portable contract (no framework types) |
| **4.2** | **Provider boundary**           | Where the Supabase/Next-specific session reading lives, and how tests substitute a controlled provider                                                  |
| **4.3** | **Current auth consumers**      | Which existing auth code is rewired onto the boundary now, and which stays put until Milestone 7                                                        |

Decisions to settle:

- The package that owns the identity contract and the one that owns the framework-specific adapter.
- Whether any existing auth call site is moved now or only wrapped.

**Completion criterion:** Server code in a package can obtain user/session context only through the boundary; sign-in, sign-out, and session behavior in web are unchanged; the relevant boundary checks pass with a reduced allowlist.

**Risks:** This is security-sensitive. Behavior preservation must be demonstrated by tests that reach session handling, and any gap must be reported explicitly.

---

## Milestone 5: Collection and Spaces pathfinder slice

Its purpose is to migrate the first complete capability through the new domain, frontend, server, and feature boundaries, consumed by web and demonstrated in Storybook. It is the proof of the pattern for every later migration, so it should be kept as thin as the capability allows (listing and pinning Spaces) rather than migrating everything related at once.

Foundations are extracted here **only as this slice needs them**:

| Part    | Focus                                         | What we need to establish                                                                                                                                                |
| ------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **5.1** | **Domain contracts for Spaces and Collection** | Which schemas, types, and semantic rules move to `domain`, and which remain app-local; public entry points                                                              |
| **5.2** | **Generic collection mechanics**              | Which collection displays and primitives live in `frontend` versus product browsing composition in `features`                                                           |
| **5.3** | **Server operations**                         | Spaces repository and operations behind the identity boundary (Milestone 4), including pinning and last-viewed behavior                                                  |
| **5.4** | **Fixtures and scenarios for this slice**     | Deterministic, contract-aligned Spaces/Collection fixtures in `dev/fixtures`, reused by tests and Storybook; explicit separation from production adapters                |
| **5.5** | **Shells needed by the slice**                | Only the shell or layout responsibilities the slice requires in `frontend/shells`; broader shell work is left for the capabilities that need it                         |
| **5.6** | **Feature composition and consumers**         | The feature package's separate frontend and server entry points, web consuming them, and Storybook running them with fixtures and fake capabilities                      |

**Completion criterion:** Spaces and Collection work in web through the new boundaries with behavior preserved; Storybook demonstrates them using fixtures; compatibility exports for the moved code are retired; the allowlist has shrunk; and the pattern, including anything that turned out to be wrong in the Milestone 2 contract, is recorded as the template for Milestones 6–8.

**Retrospective:** At the end, explicitly decide what the slice taught us about package grouping and boundaries, and amend the ownership map before continuing.

**Risks:** Persisted schema or durable identifier changes would need explicit approval; the plan should aim to move structure without changing them.

---

## Milestone 6: Preferences and Settings migration

Its purpose is to give preference rules, persistence, platform effects, and the Settings experience distinct, reusable owners, following the Milestone 5 template.

| Part    | Focus                           | What we need to establish                                                                                                                                   |
| ------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **6.1** | **Preference domain rules**     | Portable preference contracts and rules (theme, regional, privacy, notifications, fonts) separated from browser and framework code                         |
| **6.2** | **Persistence and sync**        | Server persistence and account sync behind the identity boundary, with controlled provider boundaries for tests                                              |
| **6.3** | **Platform effects**            | Where DOM/runtime effects (theme attributes, font overrides, cookies/storage) live so web and future desktop/mobile can supply their own                    |
| **6.4** | **Settings feature**            | The Settings experience as a feature with separate frontend and server entry points; reusable UI stays in `frontend`                                        |

**Completion criterion:** Settings behavior is unchanged in web; preference rules are testable without a DOM; platform effects are replaceable; Storybook covers the Settings UI with fixtures; compatibility exports are retired and the allowlist has shrunk.

---

## Milestone 7: Authentication and Account migration

Its purpose is to organize the full authentication and account capabilities into reusable server and feature packages with behavior preserved, building on the identity boundary from Milestone 4.

| Part    | Focus                               | What we need to establish                                                                                                                                                |
| ------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **7.1** | **Auth domain contracts**           | Portable contracts and validation for sign-in, registration, recovery, and email-change flows                                                                             |
| **7.2** | **Server auth operations**          | Operations for registration, recovery, resend cooldown, unconfirmed-email, change-email, and OAuth callback handling behind provider boundaries                           |
| **7.3** | **Auth and Account features**       | Auth UI and Account composition as features with separate entry points; reusable form and feedback pieces stay in `frontend`                                              |
| **7.4** | **Security regression coverage**    | Tests that reach the flows listed above, so “behavior preserved” is demonstrated rather than assumed                                                                      |

**Completion criterion:** All existing auth and account flows behave as before in web; the server and feature packages are consumed only through their public entry points; compatibility exports are retired and the allowlist has shrunk.

**Risks:** Security-sensitive; changes to session handling, redirects, or RLS-related behavior need explicit approval and are out of scope unless separately authorized. Coverage gaps must be reported.

---

## Milestone 8: Documents and Dashboards migration

Its purpose is to migrate the Documents and Dashboards capabilities that actually exist onto the established patterns.

**Scoping step first (8.0):** Confirm what is a shipped capability and what is currently only fixtures or placeholders. Only shipped capabilities are migrated; fixtures-only areas are recorded as such rather than turned into new product work. If both are real, split them:

| Part    | Focus                       | What we need to establish                                                                                                                              |
| ------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **8.0** | **Existing-state audit**    | Which Documents and Dashboards behaviors are shipped, tested, and consumed, versus fixture-only                                                         |
| **8.1** | **Documents**               | Contracts, repository, and feature composition; how editor concerns (if present) are owned and kept out of `domain`                                     |
| **8.2** | **Dashboards**              | Contracts, repository, and composition, reusing collection presentation and feature-composition patterns                                                |

**Completion criterion:** Each shipped capability works through the new boundaries with behavior preserved and Storybook coverage; compatibility exports are retired; the allowlist has shrunk.

**Risks:** New lifecycle models or persisted schemas require approval; the audit decides whether any are implied.

---

## Milestone 9: Home and aggregate experience migration

Its purpose is to have Home compose the extracted capabilities, consolidate overlapping implementations, and separate fixture/demo behavior from production behavior explicitly.

| Part    | Focus                                 | What we need to establish                                                                                                                            |
| ------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **9.1** | **Composition**                       | Home as a feature that composes Spaces, Collection, Documents, and Dashboards through their public entry points                                       |
| **9.2** | **Consolidation**                     | Remove duplicate collection-preview and overview implementations in favor of the shared owners                                                        |
| **9.3** | **Fixture and demo separation**       | Fixture/demo data and adapters available only to Storybook, tests, and explicit demo entry points, never to shipped production entry points           |

**Completion criterion:** Home renders from real capabilities in web, fixture/demo behavior cannot reach production entry points (enforced by a check), and the allowlist has shrunk.

---

## Milestone 10: Final verification and sweep

Its purpose is to confirm the end state, not to unwind a backlog. Because each migration retired its own shims, this milestone should be small.

- Verify no compatibility exports or obsolete paths remain, and that the boundary-check allowlist is empty (or any remaining entry is justified and recorded).
- Reconcile architecture documentation, ADRs, package READMEs, and agent guidance with the implementation as it actually is.
- Run the full repository verification (`pnpm verify`) and the portability check, and report exactly what ran, what passed, and what remains unverified.
- Record deferred decisions and the readiness state for the future desktop and mobile consumers.

Any destructive removal needs exact scope and a recovery plan, and prefers archiving over deleting.
