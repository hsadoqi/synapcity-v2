# Scoped execution

1. Fill in a [task scope](../task-scope.md) and confirm the approvals it lists exist.
2. Work on a branch named `type/short-description`, never on `main`.
3. Change only what is in scope. If the work needs more, stop and ask.
4. Commit one purpose at a time as `type: short summary` (subject only).
5. Open a pull request titled `type: short summary`, from `.github/pull_request_template.md`. Write `Related: owner/repo#N` only, and never a closing keyword near an issue reference, even negated. Confirm `gh pr view N --json closingIssuesReferences` is empty.
6. Merge only when CI is green and the human has authorized merging. Afterwards check that no issue closed unexpectedly.
