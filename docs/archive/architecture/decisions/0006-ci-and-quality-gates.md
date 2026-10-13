# ADR-0006: CI and quality gates

**Status:** Accepted
**Amended by:** ADR-0008
**Date:** 2026-09-26
**Deciders:** Founder (technical direction)

## Context

P1-04 (`hsadoqi/synapcity#5`) requires repository correctness to be mechanically checked, not only expected. `pnpm verify` already exists (ADR-0004, ADR-0005). The repository is private on a plan where branch protection and required status checks are unavailable, has one contributor, and had no CI, hooks, or pull request conventions. GitHub Actions and Dependabot were confirmed available.

## Decision

1. **CI:** a GitHub Actions workflow (`.github/workflows/ci.yml`) runs on pull requests and pushes to `main`. A `verify` job runs `pnpm install --frozen-lockfile` and `pnpm verify` using the Node version from `.node-version` and the pnpm version from `packageManager`. A separate `security` job runs `pnpm audit --audit-level=moderate` and a full-history secret scan.
2. **Third-party actions:** only `actions/checkout`, `actions/setup-node`, and `pnpm/action-setup`, each pinned by commit SHA with the version in a comment, under `permissions: contents: read`.
3. **Secret scanning:** gitleaks runs as a downloaded binary with a pinned version and verified SHA-256, so no additional third-party action is trusted.
4. **Dependency updates:** Dependabot weekly for npm and GitHub Actions, with `chore` commit prefixes.
5. **Pre-push hook:** a plain `.githooks/pre-push` running `pnpm verify`, activated by the `prepare` script through `core.hooksPath`. No hook-manager dependency.
6. **Merges:** squash-only, with the PR title as the commit subject and an empty body, and merged branches deleted automatically. These are repository settings and were applied through the GitHub API.
7. **Commits:** subject-only (`type: short summary`), with no trailers. Provenance lives in pull request records.
8. **Pull request template** (`.github/pull_request_template.md`) carries the Definition of Done report format.
9. **Accessibility checks** are deferred until a runnable UI exists.
10. The workflow, conventions, and what is not enforced are documented in `docs/engineering/quality-gates.md`.

## Scope

Governs CI, security scanning, hooks, merge and commit conventions, and the pull request template.

## What this does NOT decide

- Branch protection or required checks. Unavailable on the current plan; revisit with a collaborator or a deployment pipeline.
- Deployment, releases, or environments.
- Accessibility tooling and browser tests (first vertical slice).
- Commit-message linting on branches. Only the PR title reaches `main` with squash merges, and ADR-0008 checks it.
- Any product test strategy beyond the repository baseline.

## Unresolved

- Whether to upgrade the plan or change repository visibility to make CI a required gate.
- Whether Dependabot is available and behaves as expected on this repository. It is configured but has not yet run.

## Governance boundary

Changing CI providers, adding third-party actions, or changing scanning or merge policy needs founder approval (`AGENTS.md` §5). Routine action and tool version updates follow `AGENTS.md` §7a and arrive through Dependabot.

## Integration expectations

CI must run the same `pnpm verify` a developer runs. Anything added to `verify` runs in CI and in the pre-push hook.

## Verification expectations

Per `docs/engineering/definition-of-done.md`. Locally verified: `pnpm verify`, the hook passing on a clean tree and failing on a bad file, and a baseline gitleaks scan and `pnpm audit` with no findings. The workflow file itself is only proven by a real CI run, and a passing run on an empty codebase proves the toolchain runs, not product behavior.

## Reconsideration conditions

Revisit when a second contributor joins, when deployment is added, when a required-check gate becomes available, or if CI minutes or supply-chain concerns change the tradeoffs.

## Amendments

The sections above are kept as written on 2026-09-26.

- **Dependabot (as of 2026-09-26):** version-update jobs have executed. The GitHub Actions job succeeded. The npm/pnpm job hit a dependency-resolution failure involving Dependabot's release-age (cooldown) behavior, not a configuration error, and no update pull request has been produced yet. "Has not yet run" above refers to the state when this ADR was written. The configuration was assessed as valid.
- **Deferred dependency-automation policy question:** Dependabot proposed a major-version update for `@types/node`, which ADR-0004 keeps on the pinned Node major. Whether and how to constrain such updates, or to set an explicit release-age policy, is not decided here and is not a Phase 1 defect.
- **Pre-push hook activation (Phase 1 hardening):** activation by the `prepare` script is non-fatal. If `git config core.hooksPath .githooks` fails, install continues and prints a warning. `pnpm verify` and CI remain the authoritative gates.
- **Phase 1 closeout workflow exception (accepted 2026-09-27):** commit `00c0129977c67095dee193e16ef5a20b3b409791` was pushed directly to `main`, bypassing the documented branch, pull-request, and human-review workflow. That exact commit later passed the complete CI and security workflow, and the repository owner explicitly accepted the exception for Phase 1 closeout. This is a historical exception, not precedent, and does not amend the workflow decided above: subsequent changes return to the documented branch-and-pull-request process.
