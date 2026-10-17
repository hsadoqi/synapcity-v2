# ADR-0007: Auth responsibility boundaries and package layout evaluation

**Status:** Proposed  
**Date:** 2026-10-13  
**Deciders:** Hanaa Sadoqi (repository owner); topology selection and acceptance pending.

## Context

[ADR-0006](0006-authentication-with-supabase.md) chooses Supabase Auth and cookie-session behavior. Its initial implementation was placed in `apps/web`; the owner clarified on 2026-10-13 that this was not an enduring restriction on auth packages or splitting code.

The current code distributes forms, session helpers, route policy and actions among `components/auth`, `lib/auth`, `lib/supabase` and route files. Profile editing depends on auth-specific presentation/types. [Architecture principles](../principles.md), section 6, asks for responsibility boundaries before package boundaries. That ordering is a way to assess package choices, not a preference against them.

The filename retains the earlier proposal's slug to preserve links and ADR identity. The app-only proposal is replaced by the evaluation below; no package layout is selected yet.

## Decision

If accepted, define responsibilities independently of their eventual physical location:

- Authentication owns sign-in/up, confirmation/resend, recovery/password changes, sign-out, verified identity access, display-user mapping and client refresh coordination.
- Account management owns existing display-name editing, metadata preservation and pure name validation. Registration may use that pure validator; account presentation does not depend on auth form state.
- Common form presentation owns field/message rendering and reusable error-focus behavior. Auth-specific confirmation/edit state stays with the auth capability unless actual consumers justify broader reuse.
- Application policy owns existing destinations, safe redirects, flow/recovery URLs, route classification and user-area ownership requirements. A reusable identity helper can support that policy without owning application URLs or future resource permissions.
- Provider/platform adapters own SDK setup, environment/cookie integration and request-bound client provisioning. Their placement follows the chosen runtime boundary.
- Framework routes/layouts/proxy remain application entry points and composition. Packages depend on explicit contracts, never on imports from an app.

Evaluate all candidates before selecting topology:

| Candidate                               | What it could own                                                             | Main question                                                                            |
| --------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| App-local modules                       | Auth/account implementation and provider/platform adapters within the web app | Does a package boundary add enough isolation/API value to justify its configuration?     |
| One cohesive auth package               | Auth capability with explicit client, server and safe shared entry points     | Can its runtime dependencies and public API remain clear, with appropriate app adapters? |
| Auth feature plus auth service packages | UI/workflow composition separately from provider/identity operations          | Do those responsibilities change and test independently enough to justify two contracts? |
| Account separation with any candidate   | Profile capability as a sibling module or package                             | Is separate package ownership useful now, or is a module sufficient?                     |

A second app or multiple consumers is not a prerequisite. `apps/web` is already a real consumer. Cohesion, independent testing, enforceable imports, runtime isolation and change coupling can justify a package with one consumer. Conversely, a directory's size alone does not determine the layout.

## Scope

Responsibility classification and evidence-based comparison of app-local and package layouts for current auth/profile functionality. [ARF-00 in the foundation plan](../../superpowers/plans/2026-10-13-auth-refactor-foundation.md) owns the comparison and review deliverable. The [parent plan](../../superpowers/plans/2026-10-13-auth-refactor.md) retains the app-local migration map as one candidate, not the selected architecture.

## What this does NOT decide

The final package count, names, categories, exported APIs or framework coupling; provider/session changes; protected URL selection; schemas/profile storage; roles/sharing; general state management; deployment; or auth requirements for other apps. No existing open decision becomes settled by a successful experiment or by this proposal.

## Unresolved

- Choose a candidate and its exact ownership/import/runtime contracts after ARF-00.
- Current [workspace conventions](../workspace-conventions.md) put server/application-runtime code in apps and permit `dev`/`frontend` categories. A server-capable or framework-specific auth package may require a separately reviewed category/runtime amendment. Record the needed change rather than excluding the candidate or silently overriding the convention.
- The [package checklist](../package-creation-checklist.md) requires a real use case and responsibility; it does not require two consumers.
- Auth metadata and the approved `profiles` table remain distinct sources; future profile storage/ownership is a separate decision.
- Automated import-boundary enforcement remains open; no enforcement tool is selected.

## Governance boundary

The owner approved correcting the restrictive documentation, not a concrete package layout. Record a recommendation and alternatives, then obtain explicit selection and any required canonical amendments before source migration or package creation. Acceptance of responsibility principles alone does not approve physical destinations. A fresh exact mutation manifest must preserve concurrent tracked/untracked work.

## Integration expectations

Preserve current URLs, flow/recovery semantics, client/server separation, safe redirects, server verification, request-scoped caching, event filtering, confirmation/edit/resend behavior and accessibility. UI metadata never authorizes resource access.

Shared presentation stays free of provider/session behavior. An auth service package may depend on the Supabase SDK when its responsibility requires it; the UI package's constraints are not a universal ban on provider dependencies in other packages. Request/platform context reaches operations through an explicit adapter contract when they cannot construct clients independently. No package imports app code or exposes server secrets to client entry points.

## Verification expectations

ARF-00 compares actual imports/consumers and states the candidate recommendation, runtime contracts, exact destinations, governance amendments and test plan. After owner selection, rewrite the candidate inventory and scoped tasks for that layout before executing them. Verify behavior with appropriate tests/manual evidence and the root gate; report provider flows and uncovered behavior separately. No runtime verification is claimed here.

## Reconsideration conditions

Observed coupling, runtime needs, testing/API boundaries or maintenance costs differ from the selected design. Reconsideration may lead to fewer or more packages; it is not contingent on another app appearing.
