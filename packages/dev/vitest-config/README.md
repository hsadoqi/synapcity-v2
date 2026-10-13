# @synapcity/dev-vitest-config

Owns: the shared Vitest presets that workspaces compose with `mergeConfig`.

| Export      | Gives                                                                         |
| ----------- | ----------------------------------------------------------------------------- |
| `./base`    | `baseConfig`: Node environment, `src/**/*.test.{ts,tsx}`, no globals          |
| `./react`   | `reactConfig`: `baseConfig` plus jsdom and automatic Testing Library cleanup  |
| `./browser` | `chromiumBrowser()`: headless Chromium through Playwright, for `test.browser` |

A workspace adds a `vitest.config.ts`:

```ts
import { reactConfig } from '@synapcity/dev-vitest-config/react';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(reactConfig, defineConfig({}));
```

The workspace also declares `vitest`, and for `./react` `jsdom`, `@testing-library/react` and `@testing-library/dom`, in its own `devDependencies`. Coverage is opt-in: the presets configure the `v8` provider (text and HTML reports in `coverage/report`, no thresholds), but it only runs with `--coverage`, via a workspace's `test:coverage` script. The workspace declares `@vitest/coverage-v8` (4.1.11) itself.

Versions: `vitest` and `@vitest/browser-playwright` are pinned to 4.1.11 to match `apps/storybook`. Moving to Vitest 5 is a separate change.
