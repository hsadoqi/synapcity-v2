# @synapcity/dev-playwright-config

Owns: the shared Playwright end-to-end config that an app builds on.

`createPlaywrightConfig({ port, command, testDir? })` returns a config that starts the app through `webServer`, matches `**/*.e2e.ts` under `e2e/`, and sets retries, reporter and tracing for local versus CI runs.

An app adds a `playwright.config.ts`:

```ts
import { createPlaywrightConfig } from '@synapcity/dev-playwright-config';

export default createPlaywrightConfig({ port: 8080, command: 'pnpm start' });
```

The app declares `@playwright/test` in its own `devDependencies`. Browsers are not installed by `pnpm install`; run `pnpm exec playwright install chromium` once per machine.

`@playwright/test` is pinned to 1.64.0 to match the `playwright` pin in `apps/storybook`.
