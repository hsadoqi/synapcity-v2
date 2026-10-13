import { fileURLToPath } from 'node:url';

import { mergeConfig } from 'vitest/config';

import { baseConfig } from './base.ts';

/*
 * Component tests in jsdom. The consumer declares `jsdom`,
 * `@testing-library/react` and `@testing-library/dom` itself; vitest resolves
 * the environment from the consumer's `node_modules`, not from this package.
 */
export const reactConfig = mergeConfig(baseConfig, {
  test: {
    environment: 'jsdom',
    setupFiles: [fileURLToPath(new URL('./setup-react.ts', import.meta.url))],
  },
});
