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
- `plans/` — implementation plans derived from architecture, research, discovery, tradeoffs, and ADR decisions. Each plan's own status determines whether it is governing. The directory is currently empty.
- `verification/` — durable, dated records of what was actually run to verify a piece of work, distinct from PR prose or historical claims. The directory is currently empty.

These documents apply repository-wide. `AGENTS.md` is the short entry-point contract that links here; read that first for orientation, then follow into whichever of these documents your task actually needs.
