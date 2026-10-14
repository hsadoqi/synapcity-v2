import { createRequire } from 'node:module';
import babelParser from '@babel/eslint-parser';
import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import turboPlugin from 'eslint-plugin-turbo';
import onlyWarn from 'eslint-plugin-only-warn';

const require = createRequire(import.meta.url);

/**
 * Core rules that misreport TypeScript: Babel's scope analysis does not see a
 * name used only in a type position, so these flag imported types as unused or
 * undefined, and declaration merging as redeclaration. The compiler (`pnpm
 * typecheck`) already enforces undefined names and redeclarations.
 *
 * `no-unused-vars` is off for the same reason, which leaves unused locals
 * unchecked until `noUnusedLocals` is enabled in the TypeScript config.
 */
const typescriptCoveredByTheCompiler = {
  'no-undef': 'off',
  'no-redeclare': 'off',
  'no-dupe-class-members': 'off',
  'no-unused-vars': 'off',
};

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  {
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: [require.resolve('@babel/preset-typescript')],
        },
      },
    },
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      'turbo/no-undeclared-env-vars': 'warn',
    },
  },
  /*
   * TypeScript. Without a `files` entry for these extensions ESLint's flat
   * config skips `.ts`/`.tsx` entirely, which is how every workspace passed
   * `pnpm lint` without reading its TypeScript.
   *
   * The parser stays Babel on purpose: the repository is on TypeScript 7 and
   * typescript-eslint (8.71.1) refuses to load against it. The syntax plugins
   * are set directly: Babel 8's preset infers TSX from the filename, which is
   * not reliably passed through ESLint, so `.tsx` was parsed as plain `.ts`.
   */
  {
    files: ['**/*.{ts,mts,cts}'],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: { parserOpts: { plugins: ['typescript'] } },
      },
    },
    rules: typescriptCoveredByTheCompiler,
  },
  {
    files: ['**/*.tsx'],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: { parserOpts: { plugins: ['jsx', 'typescript'] } },
      },
    },
    rules: typescriptCoveredByTheCompiler,
  },
  {
    plugins: {
      onlyWarn,
    },
  },
  {
    ignores: [
      'dist/**',
      '**/coverage/**',
      'storybook-static/**',
      'node_modules/**',
      '.turbo/**',
      '.next/**',
      '.vercel/**',
      '.vscode/**',
      'pnpm-store/**',
      'docs/archive/**',
    ],
  },
];
