# ADR-0008: PR hygiene checks and additional boundary rules

**Status:** Accepted
**Date:** 2026-09-26
**Deciders:** Founder (technical direction)
**Amends:** ADR-0005 (enforcement coverage), ADR-0006 (CI jobs)

## Context

Three merged pull requests (`#10`, `#11`, `#12`) shut several open issues, because their descriptions put GitHub closing keywords near issue references and GitHub ignores negation. ADR-0006 documented the commit and PR-title convention but did not enforce it. ADR-0005 listed rules that were documented but not machine-enforced, two of which can be checked by path.

## Decision

1. **`pr-hygiene` CI job** runs `.github/scripts/check-pr-text.sh` on pull requests. It requires a conventional-commit title (`type: short summary` with type chore, feat, fix, docs, refactor, or test) and rejects closing keywords (close, closes, closed, closing, fix, fixes, fixed, resolve, resolves, resolved) placed near an issue reference in the title or body. The body check is skipped for Dependabot, whose bodies quote upstream release notes.
2. **Two more boundary rules** in `.dependency-cruiser.cjs`: `dev-not-imported` (shared, domain, ui, and apps source must not import `dev`; renamed from `foundation-not-imported` during the Phase 2 architecture reconciliation, when the `foundation` category was renamed `dev`) and `domain-no-framework-bindings` (domain must not import react, react-dom, lexical, `@lexical`, react-grid-layout, or next, in resolved or unresolved form).
3. **A third boundary rule**, added during the Phase 2 architecture reconciliation: `ui-no-application-runtime` (ui must not import next, in resolved or unresolved form). This distinguishes `domain` (no framework, DOM, or runtime bindings at all) from `ui` (React/web presentation capabilities allowed; Next.js/application-runtime coupling prohibited). It is not a blanket framework prohibition for `ui`. dependency-cruiser can only catch a literal disallowed import; it cannot prove the broader semantic concept of application-runtime ownership, so that boundary remains partly a documented, human-reviewed expectation rather than a fully machine-verifiable one.
4. The script is covered by `tests/pr-text.test.ts`, and all boundary rules by the existing boundary fixtures.

## Scope

Governs PR text checks and these two boundary rules.

## What this does NOT decide

- Whether these checks block a merge. They do not while branch protection is unavailable (ADR-0006).
- Checking commit messages in a branch. Squash-only merges make the PR title the only message that reaches `main`.
- A general list of banned domain libraries. The list is the libraries named in ADR-0001 and ADR-0002 plus react, react-dom, and next, and grows by decision.
- A general list of application-runtime concerns banned from `ui` beyond the named `next` import. Further restrictions grow by decision, the same way the domain list does.

## Unresolved

- Whether GitHub treats every keyword form the script covers, and whether it links some forms the script does not. The script was built from GitHub's documented keywords plus the observed "closing" case, and it flags the text of all three PRs that closed issues.

## Governance boundary

Changing the banned-library list or the PR text rules needs founder approval.

## Integration expectations

The `pr-hygiene` job runs beside `verify` and `security`. The boundary rules run in `pnpm verify`.

## Verification expectations

Per `docs/engineering/definition-of-done.md`. The script flags the real text of PRs `#10`, `#11`, and `#12` and passes `#13`. The framework ban was checked by hand in the real repository with a temporary probe: it fires on a resolved pnpm store path when the library is banned and passes otherwise (a first pattern missed pnpm's store paths and only this manual check found it). The fixture test covers the unresolved form only. The `pr-hygiene` job itself is proven only by a real CI run.

## Reconsideration conditions

Revisit if GitHub changes its keyword behavior, if the checks produce false positives, or if branch protection becomes available and these should be required.
