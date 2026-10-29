# @synapcity/dev-playwright-config

Owns: the shared Playwright end-to-end config that an app builds on.

`await createPlaywrightConfig({ app, extraServers?, testDir? })` returns a config that starts the app through `webServer`, matches `**/*.e2e.ts` under `e2e/`, and sets retries, reporter and tracing for local versus CI runs. A server is `{ name, command(port), env?(origin) }`; `extraServers` starts other apps the same way, for a test that crosses apps (`apps/web` serves docs for the shared-look test).

It is built so several checkouts can run at once:

- Each run asks the operating system for a free port per server, prints it (`[e2e] web: http://localhost:<port>`) and uses it as the `baseURL`. The config is async, so an app config uses top-level `await`.
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
