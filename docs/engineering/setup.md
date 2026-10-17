# Local setup and health checks

**Status:** Canonical developer workflow

## Prerequisites

- **Node.js 24 or newer**, declared in `package.json` `engines`. `.npmrc` sets `engine-strict`, so an older Node fails at install instead of causing odd errors later. `.node-version` pins 24.20.0, the version CI uses and the last verified runtime.
- **pnpm 11.25.0**, pinned in `package.json` `packageManager`. Activate it with Corepack: `corepack enable pnpm`.

## From clone to a verified checkout

```bash
git clone https://github.com/hsadoqi/synapcity-v2.git
cd synapcity-v2
corepack enable pnpm
pnpm install --frozen-lockfile
pnpm exec playwright install chromium   # once per machine
pnpm verify
```

`pnpm install` runs the root `prepare` script, which sets `core.hooksPath` to `.githooks` so `pnpm verify` runs before every push. pnpm skips it when an install has nothing to do, so in a checkout that was already installed run `pnpm run prepare` once. Outside a Git checkout it prints a notice and install still succeeds. The hook is a convenience; `pnpm verify` and CI are the authoritative gates.

## Commands

| Command                             | What it does                                                                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm verify`                       | Runs `format:check`, `lint`, `typecheck`, `deps`, `brand:check`, `test`, `test:coverage`, `test:e2e`, `test:storybook` and `build`; stops at first fail |
| `pnpm format:check` / `pnpm format` | Check or apply Prettier formatting                                                                                                                      |
| `pnpm lint`                         | ESLint in every workspace, through Turbo                                                                                                                |
| `pnpm check-types`                  | `tsc --noEmit` in every workspace (Next apps run `next typegen` first)                                                                                  |
| `pnpm deps`                         | Knip: unused files, exports and dependencies                                                                                                            |
| `pnpm brand:check`                  | Static brand exports match the logo geometry in `logo-mark.tsx` (not the rasters)                                                                       |
| `pnpm test`                         | Vitest unit tests in every workspace that has them, through Turbo                                                                                       |
| `pnpm test:coverage`                | The same tests with v8 coverage (no thresholds)                                                                                                         |
| `pnpm test:e2e`                     | Playwright smoke test of `apps/web` against a production build (Chromium)                                                                               |
| `pnpm test:storybook`               | Storybook story tests in Chromium, including the a11y addon's axe checks                                                                                |
| `pnpm report`                       | One combined v8 coverage report for the workspace, in `coverage/report`; not part of `verify`                                                           |
| `pnpm build`                        | Builds every workspace through Turbo                                                                                                                    |
| `pnpm dev`                          | Runs every workspace's dev server; `pnpm dev:web` and `pnpm dev:docs` run one                                                                           |
| `pnpm ui:add <component>`           | Adds a shadcn component from the root, writing into `@synapcity/frontend-ui`                                                                            |

A passing `pnpm verify` proves the repository's formatting, lint, types, unused-code and build checks pass, and that the existing tests pass. Test coverage is thin, so it proves behavior only where a test exercises it, and it does not prove a product feature exists, is product-required, or is product-validated. The browser tests need Chromium, which `pnpm install` does not download (`pnpm exec playwright install chromium`, once per machine).

`pnpm dev:web` serves `apps/web` on port 8080; `pnpm dev:docs` serves `apps/docs` on port 4000.

## Environment variables

- `apps/web` needs three: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SITE_URL`. Copy `apps/web/.env.example` to `apps/web/.env.local` and fill them in; the README table in `apps/web` says what each is for.
- When another variable is added, add it to the committed `.env.example` with a placeholder value in the same change.
- Real values go in an untracked `.env` or `.env*.local` file, both git-ignored. Never commit secrets. The `security` CI job scans history for them.

## Deployments

Three Vercel projects deploy from this repository. These are the Vercel-generated addresses (no custom domain yet), as given by the owner on 2026-10-13.

| App              | Live address                                   | Deploys                                                 |
| ---------------- | ---------------------------------------------- | ------------------------------------------------------- |
| `apps/web`       | `https://web-iota-three-69.vercel.app`         | `main`, and every feature branch except `dependabot/**` |
| `apps/storybook` | `https://synapcity-storybook-sigma.vercel.app` | `main` only                                             |
| `apps/docs`      | `https://synapcity-v2.vercel.app`              | `main` only                                             |

The branch rules and why they exist are in `quality-gates.md` ("Vercel deployments").

When the address of `apps/web` changes (for example a custom domain), change these together. The first two are dashboard settings; nothing in the repository holds them:

1. **Vercel, `web` project, Production environment variables:** set `SITE_URL` to the new address including `https://`. A value without the scheme fails the build on purpose. `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` must be set before the build, because they are inlined into the browser bundle.
2. **Supabase, Authentication, URL Configuration:** set Site URL to the same address, and list exactly `<address>/auth/callback` as a Redirect URL (plus `http://localhost:8080/auth/callback` for local work). Avoid wildcards: with a wildcard such as `*.vercel.app`, anyone can host a page that the redirect list would accept.
3. **Google and GitHub consoles:** nothing to change. They hold only Supabase's own callback address.
4. **Email:** a custom SMTP provider needs SPF and DKIM records on the sending domain.

`SITE_URL` also sets `metadataBase`, so share images resolve against the real address. If it is unset, Next falls back to `http://localhost:3000` and warns at build.

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
