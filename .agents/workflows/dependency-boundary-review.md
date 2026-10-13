# Dependency and boundary review

1. For a new package, complete `docs/architecture/package-creation-checklist.md` and follow `docs/architecture/workspace-conventions.md`.
2. Check import direction (apps depend on packages, never the reverse; ADR-0001) and that cross-package imports use only the package `exports`.
3. No boundary-checking tool exists. Enforce direction by reading the new package's imports and its consumers' imports; a formal rule is an open candidate decision.
4. For a new dependency, follow `AGENTS.md` section 7a: check the registry version, peer ranges, and current documentation for the declared version, cite them, and get approval when it has architectural or security consequences. Do not upgrade an existing dependency as part of this review.
5. Run `pnpm deps` for unused dependencies.
