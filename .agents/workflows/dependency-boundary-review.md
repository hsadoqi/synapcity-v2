# Dependency and boundary review

1. For a new package, complete `docs/architecture/package-creation-checklist.md` and follow `docs/architecture/workspace-conventions.md`.
2. Check import direction between categories (ADR-0005) and that cross-package imports use only the package `exports`.
3. Run `pnpm deps:boundaries`. With no packages it cruises nothing, so a pass is weak evidence; prove a new rule with a fixture in `tests/boundaries/fixtures` and a manual check against a real workspace package.
4. For a new dependency, follow `AGENTS.md` section 7a: check the registry version, peer ranges, and current documentation for the declared version, cite them, and get approval when it has architectural or security consequences. Do not upgrade an existing dependency as part of this review.
5. Run `pnpm deps` for unused dependencies.
