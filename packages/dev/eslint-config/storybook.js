import storybook from 'eslint-plugin-storybook';
import { nextJsConfig } from './next.js';

/**
 * ESLint configuration for the Storybook app: the shared Next.js config plus the
 * recommended Storybook rules.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const storybookConfig = [
  ...nextJsConfig,
  ...storybook.configs['flat/recommended'],
  {
    // Storybook has no Next routes (no `pages` or `app` directory), so the rule
    // finds nothing to check: it only prints a missing-directory warning.
    rules: { '@next/next/no-html-link-for-pages': 'off' },
  },
];
