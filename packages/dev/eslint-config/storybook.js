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
];
