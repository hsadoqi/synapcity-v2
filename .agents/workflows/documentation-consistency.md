# Documentation consistency

1. Run `pnpm docs:check`. It verifies the ADR index matches the ADR files (rows, titles, statuses, numbering) and that relative links and backticked `docs/` paths resolve.
2. Then check what a script cannot: a changed decision is reflected in `AGENTS.md`, `PRODUCT.md`'s open decisions, and `docs/glossary.md` where they apply, and a diagram still matches its text.
3. Update statuses in the same change as the decision. Do not leave a Proposed label on something already applied.
4. Report any statement you could not confirm as unverified.
