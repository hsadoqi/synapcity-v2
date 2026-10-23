import { resolve } from 'node:path';

import { check } from '../check/index.ts';
import { EXCEPTIONS } from '../exceptions/index.ts';
import { APP_SERVER_ONLY } from '../rules/reachability/index.ts';

const root = resolve(import.meta.dirname, '../../../../..');
let result: ReturnType<typeof check>;
try {
  result = check(root, EXCEPTIONS, APP_SERVER_ONLY);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(2);
}
const { violations, stale, fileCounts } = result;

for (const v of violations) {
  console.log(
    `${v.rule} ${v.file} -> ${v.specifier || '(file)'}${v.target ? ` (${v.target})` : ''}: ${v.message}`,
  );
}
for (const e of stale) {
  console.log(
    `stale exception ${e.rule} ${e.file}${e.specifier ? ` -> ${e.specifier}` : ''}: it no longer matches; remove it`,
  );
}

const files = Object.values(fileCounts).reduce((sum, count) => sum + count, 0);
const packages = Object.keys(fileCounts).length;
if (violations.length > 0 || stale.length > 0) {
  console.log(
    `\nboundaries: ${violations.length} violation(s), ${stale.length} stale exception(s) in ${files} files across ${packages} workspaces`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `boundaries: ${files} files across ${packages} workspaces, no violations`,
  );
}
