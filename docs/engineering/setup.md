# Local setup and health checks

**Status:** Canonical developer workflow

## Prerequisites

- **Node.js 24 or newer**, declared in `package.json` `engines`. `.npmrc` sets `engine-strict`, so an older Node fails at install instead of causing odd errors later. The repository does not yet pin an exact Node version file (see ADR-0001, Unresolved); the last verified runtime was Node 24.20.0.
- **pnpm 11.25.0**, pinned in `package.json` `packageManager`. Activate it with Corepack: `corepack enable pnpm`.

## From clone to a verified checkout

```bash
git clone https://github.com/hsadoqi/synapcity.git
cd synapcity
corepack enable pnpm
pnpm install --frozen-lockfile
git config core.hooksPath .githooks   # optional: run verify before every push
pnpm verify
```

The pre-push hook is a convenience and is not activated by install; the `prepare` script that used to do it is gone. `pnpm verify` and CI are the authoritative gates.

## Commands

| Command                             | What it does                                                                        |
| ----------------------------------- | ----------------------------------------------------------------------------------- |
| `pnpm verify`                       | Runs `format:check`, `lint`, `check-types`, `deps` and `build`; stops at first fail |
| `pnpm format:check` / `pnpm format` | Check or apply Prettier formatting                                                  |
| `pnpm lint`                         | ESLint in every workspace, through Turbo                                            |
| `pnpm check-types`                  | `tsc --noEmit` in every workspace (Next apps run `next typegen` first)              |
| `pnpm deps`                         | Knip: unused files, exports and dependencies                                        |
| `pnpm build`                        | Builds every workspace through Turbo                                                |
| `pnpm dev`                          | Runs every workspace's dev server; `pnpm dev:web` and `pnpm dev:docs` run one       |
| `pnpm ui:add <component>`           | Adds a shadcn component from the root, writing into `@synapcity/ui`                 |

There is no test command. A passing `pnpm verify` proves the repository's formatting, lint, types, unused-code and build checks pass; it does not prove behavior, and does not prove a product feature exists, is product-required, or is product-validated.

`pnpm dev:web` serves `apps/web` on port 8080.

## Environment variables

- No environment variables exist yet. When one is added, add it to a committed `.env.example` with a placeholder value in the same change.
- Real values go in an untracked `.env` or `.env*.local` file, both git-ignored. Never commit secrets. The `security` CI job scans history for them.

## Generated files and caches

- Committed: source, `pnpm-lock.yaml`, and configuration. Generated output is never committed.
- Git-ignored: `node_modules`, `.next`, `dist`, `.turbo`, local tool folders (`.history`, `.remember`, `.serena`, `.vscode`), and `.env` files.
- All ignored output is safe to delete and is rebuilt by the commands above.

## Debugging a failing check

- Run one check on its own instead of `pnpm verify`, for example `pnpm exec eslint path/to/file.ts` or `pnpm --filter web check-types`.
- To reproduce a CI failure, use a fresh clone and the commands above. Differences between a local run and CI usually come from a stale `node_modules`, so delete it and reinstall.
- To skip the pre-push hook in an emergency, use `git push --no-verify`. CI still runs.

## Editor

For lint and format feedback, install the ESLint and Prettier extensions. Editor settings folders are git-ignored and not shared. Whether `.claude/` is repository-owned or local-only state has not been decided.
