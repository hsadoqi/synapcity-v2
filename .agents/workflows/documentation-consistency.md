# Documentation consistency

1. There is no documentation check script. Verify by hand that `docs/architecture/decisions/README.md`'s index matches the ADR files (rows, titles, statuses, numbering) and that relative links and backticked `docs/` and workspace paths resolve (`ls` each one). Run `pnpm format:check` for formatting.
2. Then check what a script cannot: a changed decision is reflected in `AGENTS.md`, `PRODUCT.md`'s open decisions, and `docs/glossary.md` where they apply, and a diagram still matches its text.
3. Update statuses in the same change as the decision. Do not leave a Proposed label on something already applied.
4. Report any statement you could not confirm as unverified.
