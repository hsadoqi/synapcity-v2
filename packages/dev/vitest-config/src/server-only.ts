import { fileURLToPath } from 'node:url';

/*
 * `server-only` resolves to a module that throws unless the `react-server`
 * condition is set, which Next.js sets for server code and Vitest does not.
 * Turning that condition on for a test project would also give `react` its
 * server build and break hooks, so this alias maps only the `server-only`
 * specifier to an empty module. Add it to `resolve.alias` in any project whose
 * tests load a server entry. Production is unaffected: Next.js resolves the
 * guard itself, and `pnpm boundaries` (R3, R10) checks where it is imported.
 */
export const serverOnlyAlias = {
  find: /^server-only$/,
  replacement: fileURLToPath(new URL('./server-only-stub.ts', import.meta.url)),
};
