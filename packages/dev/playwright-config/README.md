# @synapcity/dev-playwright-config

Owns: the shared Playwright end-to-end config that an app builds on.

`await createPlaywrightConfig({ app, extraServers?, testDir? })` returns a config that starts the app through `webServer`, matches `**/*.e2e.ts` under `e2e/`, and sets retries, reporter and tracing for local versus CI runs. A server is `{ name, command(port), env?(origin) }`; `extraServers` starts other apps the same way, for a test that crosses apps (`apps/web` serves docs for the shared-look test).

It is built so several checkouts can run at once:

- Each run asks the operating system for a free port per server, prints it (`[e2e] web: http://localhost:<port>`) and uses it as the `baseURL`. The config is async, so an app config uses top-level `await`.
- A listener already on a chosen address stops the run at config load, before any server starts: `[e2e] web: http://localhost:<port> already has a listener ...`. Playwright 1.64.1 checks the address itself with an HTTP request that has no timeout and runs outside `webServer.timeout`, so a listener that accepts connections and never answers (a stuck process on a pinned port) held a run for more than five minutes against the 120 s timeout. The pre-check is a bounded TCP connect to both loopback addresses. It cannot close the few milliseconds between the check and Playwright's own, nor the startup time of earlier servers for a later one; a port taken in that window still waits on Playwright's unbounded request. That belongs upstream (see below).
- `reuseExistingServer` is off everywhere. Playwright always starts the server itself, from the config's directory (the checkout), and fails when something already listens on the address or when its server exits early. It stops the servers it started when the run ends.
- `E2E_<NAME>_URL` (for example `E2E_DOCS_URL`) is set for the tests, and `env(origin)` lets the app point its own settings at the run's origin (`apps/web` sets `SITE_URL`, which its auth redirects and metadata use).
- `E2E_<NAME>_PORT` pins a port instead, for reproducing a run. List it in Turborepo's `globalPassThroughEnv` for it to reach a task run through `turbo`.

An app adds a `playwright.config.ts`:

```ts
import { createPlaywrightConfig } from '@synapcity/dev-playwright-config';

export default await createPlaywrightConfig({
  app: {
    name: 'web',
    command: (port) => `pnpm exec next start --port ${port}`,
  },
});
```

The app declares `@playwright/test` in its own `devDependencies`. Browsers are not installed by `pnpm install`; run `pnpm exec playwright install chromium` once per machine.

`@playwright/test` is pinned to 1.64.0 to match the `playwright` pin in `apps/storybook`.

## Startup time and troubleshooting

A server gets two minutes to answer on its address (`startupTimeout` on the server changes it). Failing that, Playwright reports `Timed out waiting 120000ms from config.webServer.`; the address is the `[e2e]` line printed at the start of the run, and the server's own stderr is shown with it. Cold `next dev` compiles each route on first use, so a slow first answer is not a hang.

- `already has a listener`: something is bound to the port. `lsof -nP -iTCP:<port> -sTCP:LISTEN` names it. Stop it or unset `E2E_<NAME>_PORT`.
- `is already used`: the address answers HTTP (Playwright's own check; the run never reuses it). Same remedy.
- `Process from config.webServer was not able to start`: the server exited, usually because the port was taken after the check or the build is missing. Its output precedes the error.
