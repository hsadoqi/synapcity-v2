# Local setup and health checks

**Status:** Canonical developer workflow

## Prerequisites

- **Node.js 24.20.0**, pinned in `.node-version` and `package.json` `engines`. Use any version manager that reads `.node-version` (for example fnm, mise, asdf, or nodenv). `.npmrc` sets `engine-strict`, so a wrong Node version fails at install instead of causing odd errors later.
- **pnpm 10.24.0**, pinned in `package.json` `packageManager`. The project uses the Corepack bundled with its pinned Node runtime to activate that exact pnpm version.

**Upstream guidance:** the current pnpm 10 Corepack instructions recommend updating Corepack to its latest version first because older releases contain outdated signing keys.

**Synapcity's project-specific decision:** do not install or upgrade Corepack separately. Node 24.20.0 bundles Corepack 0.35.0, while the relevant npm-registry signing-key update shipped in Corepack 0.31.0. Using the bundled version avoids an additional global tool installation and keeps bootstrap anchored to the pinned Node runtime. The bootstrap command remains `corepack enable pnpm`.

## From clone to a verified checkout

```bash
git clone https://github.com/hsadoqi/synapcity.git
cd synapcity
corepack enable pnpm
pnpm install --frozen-lockfile
pnpm browsers:install
pnpm verify
```

`pnpm install` tries to activate the pre-push hook (`prepare` sets `core.hooksPath` to `.githooks`). If that fails, for example outside a Git checkout, install still succeeds and prints a warning; run `git config core.hooksPath .githooks` to activate it. `pnpm browsers:install` provisions the Chromium binary used by Storybook browser/accessibility tests and the application smoke test; it is an explicit bootstrap prerequisite rather than a network-mutating part of `pnpm verify`. The hook is a convenience. `pnpm verify` and CI are the authoritative gates. CI runs the same browser-install script with `--with-deps` for Linux system dependencies and then invokes the same `pnpm verify`, so a green run there and a green run from this documented fresh-clone path exercise the same repository checks.

**Verification status of this procedure.** The pins, the `engine-strict` check, `pnpm install --frozen-lockfile`, browser provisioning, and `pnpm verify` have been exercised locally or on a fresh CI runner. `corepack enable pnpm` itself was not run during the Phase 1 closeout because it changes global shims on the machine, so that Corepack step remains documented from first-party guidance rather than re-exercised in every audit.

## Commands

| Command | What it does |
|---|---|
| `pnpm verify` | Runs every check below in order and stops at the first failure |
| `pnpm format:check` / `pnpm format` | Check or apply Prettier formatting (Markdown is excluded) |
| `pnpm lint` | ESLint with type-aware rules |
| `pnpm browsers:install` | Installs the Chromium binary required by browser verification; run once after a fresh install |
| `pnpm typecheck` | Type-checks the root and every current workspace through Turbo |
| `pnpm test` | Runs the registered root and `ui-core` Vitest projects; new test-owning workspaces must be registered deliberately |
| `pnpm test:storybook` | Runs real-browser Storybook story and accessibility tests |
| `pnpm test:smoke` | Starts `apps/web` and drives its minimum real-application path in Chromium |
| `pnpm deps` | Knip, unused files, exports, and dependencies |
| `pnpm deps:boundaries` | dependency-cruiser package boundary rules |
| `pnpm docs:check` | ADR index and documentation link consistency |
| `pnpm build` | Builds/type-checks every current workspace through Turbo |
| `pnpm dev` | Runs workspace development tasks in parallel through Turbo |

The current workspaces are `apps/web`, `apps/storybook`, and `packages/ui/core`. A passing `pnpm verify` proves their declared technical-foundation builds and tests run; it does not prove a product feature exists, is product-required, or is product-validated.

## Environment variables

- No environment variables exist yet. `.env.example` is the committed list of every variable the repository reads, with placeholder values only.
- Real values go in an untracked `.env` or `.env*.local` file, both git-ignored. Never commit secrets. The `security` CI job scans history for them.
- A new variable is added to `.env.example` in the same change that starts reading it.

## Generated files and caches

- Committed: source, `pnpm-lock.yaml`, and configuration. Generated output is never committed.
- Git-ignored: `node_modules`, `dist`, `coverage`, `.turbo`, local tool folders (`.history`, `.remember`, `.serena`, `.vscode`), and `.env` files.
- All ignored output is safe to delete and is rebuilt by the commands above.

## Debugging a failing check

- Run one check on its own instead of `pnpm verify`, for example `pnpm exec vitest run tests/pr-text.test.ts` or `pnpm exec eslint path/to/file.ts`.
- For boundary failures, `pnpm exec depcruise packages --config .dependency-cruiser.cjs --output-type err-long` explains each violation.
- To reproduce a CI failure, use a fresh clone and the commands above. Differences between a local run and CI usually come from a stale `node_modules`, so delete it and reinstall.
- To skip the pre-push hook in an emergency, use `git push --no-verify`. CI still runs.

## Editor

`.editorconfig` sets indentation, line endings, and final newlines for any editor. For lint and format feedback, install the ESLint and Prettier extensions. Editor settings folders are git-ignored and not shared. Whether `.claude/` is repository-owned or local-only state has not been decided: Prettier ignores it, but Git does not.
