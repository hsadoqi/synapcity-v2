# ADR-0014: Deployment topology

**Status:** Accepted
**Date:** 2026-09-27
**Deciders:** Founder (technical direction)

## Context

The Phase 2 plan (§10, design §12.2) proposes GitHub Actions as the sole
authority for repository correctness and two independent Vercel projects
(one for `apps/web`, one for `apps/storybook`) as the deployability
authority, connected to the same repository via Vercel's native monorepo
support. This decision has no version-sensitive npm dependency of its own —
it is a platform/topology choice — but it does involve external-state
changes (creating Vercel projects, connecting GitHub) that `AGENTS.md` §5
requires explicit authorization for before they happen, separately from
accepting the decision itself.

## Decision

1. GitHub Actions runs `pnpm verify` (per ADR-0013) as the repository
   correctness workflow. It provisions environment and handles
   artifact/report steps only; it does not reconstruct a second set of
   correctness rules in workflow YAML.
2. CI installs only Chromium (with system dependencies) via Playwright's
   documented CI approach — no Firefox/WebKit in Phase 2.
3. Two Vercel projects are created, each connected to this repository with a
   distinct root directory: one for `apps/web`, one for `apps/storybook`.
   No `ui-core` npm publishing occurs; both deployments consume the
   workspace package directly via `workspace:` resolution.
4. Deployment dependency behavior must follow the workspace graph: a
   web-only change affects only the web project; a Storybook-only change
   affects only the Storybook project; a shared `@synapcity/frontend-ui/core` change
   affects both. Vercel's native dependency-aware build skipping is used
   first; custom ignored-build-step logic is added only if that proves
   insufficient.
5. Each Phase 2 pull request should produce independent preview URLs for
   both projects when affected; `main` produces independent production
   deployments for both. Production naming, domains, and access policy are
   deployment configuration decided when the projects are actually created,
   not architectural commitments of this ADR.
6. **This ADR's acceptance authorizes recording the decision. It does not by
   itself authorize creating the Vercel projects or connecting GitHub** —
   that external-state action still needs its own explicit go-ahead per
   `AGENTS.md` §5 at Slice 8, when it actually happens.

## Scope

Governs the division of authority between GitHub Actions (correctness) and
Vercel (deployability), the two-project topology, and the dependency-aware
build-skipping expectation. Does not create any account, project, or
connection.

## What this does NOT decide

- The exact correctness contract Actions runs (ADR-0013 governs that).
- Vercel project names, team/account placement, custom domains, or access
  policy.
- Any custom ignored-build-step script, decided only if native behavior
  proves inadequate.

## Unresolved

- Vercel project/account names — the design (§18) notes "Synapcity UI"
  remains a portfolio description, not an adopted product name; naming
  happens when the projects are actually created.
- Whether server-side GitHub branch protection is configured, versus
  conventionally required checks only (design §12.1 flags this as a known
  Phase 1 limitation carried forward).

## Governance boundary

Changing the GitHub Actions/Vercel authority split or moving off a
two-project topology requires founder approval and an amending ADR. Creating
the actual Vercel projects and connecting them requires a separate explicit
authorization at Slice 8 time, per `AGENTS.md` §5 and §9 (Git and GitHub
safety) of the Phase 2 execution instructions.

## Integration expectations

Depends on ADR-0013's `pnpm verify` contract existing and passing locally
before Slice 7 automates it in CI (plan's stated rule: CI must not become
the environment in which the architecture is first integrated or debugged).

## Verification expectations

Per `docs/engineering/definition-of-done.md`. Originally deferred to Slices 7–8
(Stage 6 acceptance criteria): PR correctness workflow passes; web and Storybook
previews deploy; both production artifacts deploy.

Verified at Phase 2 closeout (evidence in
`docs/engineering/verification/phase-02-verification-record.md`, Round 3): the
correctness workflow runs green on hosted CI for `main` @ `fbc4db3`; the
`synapcity-web` (root `apps/web`) and `synapcity-design` (root `apps/storybook`)
Vercel projects both serve production from `main`; native monorepo skipping
behaved as intended (web-only change deploys web and skips Storybook,
Storybook-only change the reverse, a shared `@synapcity/frontend-ui/core` change deploys
both). No `vercel.json`, custom ignored-build script or path filter is used.
This ADR left the project names open; `synapcity-web` and `synapcity-design`
are the names that were created.

## Reconsideration conditions

Revisit if Vercel's native monorepo dependency-skipping proves insufficient
in practice, if the two-project split creates real operational friction, or
if a different CI/deployment split is later required by product needs.
