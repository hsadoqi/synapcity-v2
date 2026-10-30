# Database parity allowlist

**Status:** Current direction. Differences between a target database and a fresh local build that the owner has reviewed and expects.

`pnpm db:parity` compares a target database with what this checkout's migrations produce on a fresh local stack. Every difference is either listed here, with a reason, or it needs action and the script exits 1. Grants, row-level-security policies, function bodies, `SECURITY DEFINER` and `search_path` are compared exactly, and an allowlist entry is the only way one of them can be expected.

A row's **Difference** is the key the script prints (for example `storage policy some_policy`), exactly. A row without a **Reason** is refused. Entries are added in a pull request and reviewed by the owner; an agent proposes them and does not approve them.

## Allowed differences

| Difference | Reason |
| ---------- | ------ |
| —          | —      |
