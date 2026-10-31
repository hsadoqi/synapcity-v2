// Writes every generated or copied brand file from @synapcity/frontend-brand:
// the canonical SVGs in the package, the web public outputs, the Storybook
// aliases and each Next app's icon.svg. Deterministic: running it twice
// changes nothing. `pnpm brand:check` verifies the result without writing.
//
// It never touches apple-icon.png or favicon.ico (no generator exists), and it
// removes nothing: a stray file is reported by the check, not deleted here.
//
// Usage: node scripts/sync-brand-assets.mjs [repo-root]
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadBrand, plannedFiles } from './brand-assets-lib.mjs';

const root = resolve(
  process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..'),
);
const brand = await loadBrand(root);

let written = 0;
for (const [path, { content }] of plannedFiles(brand)) {
  const full = join(root, path);
  let current = null;
  try {
    current = readFileSync(full, 'utf8');
  } catch {
    // missing: write it
  }
  if (current === content) continue;
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
  written += 1;
  console.log(`wrote ${path}`);
}
console.log(
  written === 0
    ? 'brand files already in sync'
    : `${written} brand file(s) written`,
);
