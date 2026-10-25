import babelParser from '@babel/eslint-parser';
import js from '@eslint/js';
import pluginNext from '@next/eslint-plugin-next';
import eslintConfigPrettier from 'eslint-config-prettier';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';

/*
 * The parser is Babel, not typescript-eslint: the project is on TypeScript 7 and
 * typescript-eslint (8.72) refuses to load against it. Babel only parses; the compiler
 * (`pnpm check-types`) is what checks types, undefined names and unused locals.
 */
const coveredByTheCompiler = {
  'no-undef': 'off',
  'no-redeclare': 'off',
  'no-dupe-class-members': 'off',
  'no-unused-vars': 'off',
};

const parser = (plugins) => ({
  parser: babelParser,
  parserOptions: {
    requireConfigFile: false,
    babelOptions: { parserOpts: { plugins } },
  },
});

export default defineConfig([
  js.configs.recommended,
  eslintConfigPrettier,
  {
    files: ['**/*.{ts,mts,cts}'],
    languageOptions: { ...parser(['typescript']), globals: globals.browser },
    rules: coveredByTheCompiler,
  },
  {
    files: ['**/*.tsx'],
    languageOptions: {
      ...parser(['jsx', 'typescript']),
      globals: globals.browser,
    },
    rules: coveredByTheCompiler,
  },
  {
    plugins: { '@next/next': pluginNext },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs['core-web-vitals'].rules,
    },
  },
  pluginReactHooks.configs.flat.recommended,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'node_modules/**',
    'playwright-report/**',
    'test-results/**',
  ]),
]);
