# Engineering foundation overview

**Status:** Canonical navigation index

This directory holds Synapcity's engineering governance and implementation-planning guidance:

- `documentation.md` — document statuses, authority, approval, supersession, and how stale claims are handled.
- `definition-of-done.md` — the verification standard, including the explicit rule that tested, consumed, exercised, product-required, product-validated, and canonical are different claims, and that a verification report must be able to say "not verified."
- `ai-development.md` — how AI-assisted development is governed: the human-intent-to-Git flow, what AI may do, and what always requires human decision.
- `ai-security-baseline.md` — the security/trust baseline for AI-assisted work and, later, any AI product features.
- `setup.md` — from clone to a verified checkout: prerequisites, commands, environment variables, generated files, and debugging.
- `quality-gates.md` — what counts as done mechanically: verification, CI, hooks, branch, pull request, and commit conventions, and what is not enforced.
- `preservation-policy.md` — how the previous implementation relates to Synapcity, and the rules for destructive changes generally.
- `plans/` — proposed or approved implementation plans derived from architecture, research, discovery, tradeoffs, and ADR decisions. Each plan's own status determines whether it is governing. Approved plans define how approved work should be executed, in what order, what dependencies exist between stages, and what evidence is required to consider each stage complete.
  - `plans/phase-02-technical-foundation-implementation-plan.md` — the proposed Phase 2 execution plan for establishing Synapcity's technical foundation, including workspace/runtime setup, UI and Storybook foundations, testing and accessibility, integration and golden-path validation, the repository verification contract, CI, and deployment.
  - `plans/phase-02-dependency-evidence.md` — Phase 2 dependency-version evidence, including the retrospective reconciliation of build-tooling dependencies and the P2-01 historical contract-violation note.
- `verification/` — durable, dated records of what was actually run to verify a phase, distinct from PR prose or historical claims.
  - `verification/phase-02-verification-record.md` — direct evidence for the Phase 2 contract-reconciliation pass: commands run, probe matrix, and what could not be verified in-session.

These documents apply repository-wide. `AGENTS.md` is the short entry-point contract that links here; read that first for orientation, then follow into whichever of these documents your task actually needs.
