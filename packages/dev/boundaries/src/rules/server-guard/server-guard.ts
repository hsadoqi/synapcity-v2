import { join } from 'node:path';

import type { SourceFile, Violation, Workspace } from '../../model/index.ts';
import { byFileThenRule, repoPath } from '../../paths/index.ts';

const GUARD = 'server-only';

/** The export key of the unguarded test-support entry (conventions, entry points rule 8). */
const TESTING = './testing';

/**
 * The file behind each server entry: every export of a `server-*` package
 * except `./testing`, and feature `./server` entries. A subpath of a server
 * package is as server-only as its root, so it carries the guard too.
 */
function serverEntries(workspace: Workspace): Set<string> {
  const entries = new Set<string>();
  for (const pkg of workspace.packages) {
    const targets =
      pkg.category === 'server'
        ? Object.entries(pkg.exports)
            .filter(([key]) => key !== TESTING)
            .map(([, target]) => target)
        : pkg.category === 'features' && pkg.exports['./server']
          ? [pkg.exports['./server']]
          : [];
    for (const target of targets) entries.add(join(pkg.dir, target));
  }
  return entries;
}

/** R10: every server entry file's first statement is `import 'server-only'`, and no other package file imports it. */
export function serverGuardRule(
  files: Map<string, SourceFile>,
  workspace: Workspace,
): Violation[] {
  const rel = (path: string) => repoPath(workspace.root, path);
  const entries = serverEntries(workspace);
  const violations: Violation[] = [];

  for (const entry of entries) {
    const file = files.get(entry);
    if (file?.leadingImport !== GUARD) {
      violations.push({
        rule: 'R10',
        file: rel(entry),
        specifier: GUARD,
        target: null,
        message: `a server entry's first statement must be import '${GUARD}'`,
      });
    }
  }
  for (const file of files.values()) {
    // App server modules may import the guard themselves (Next.js hardening).
    if (
      entries.has(file.path) ||
      !file.production ||
      file.pkg.category === 'app'
    )
      continue;
    if (file.imports.some((record) => record.specifier === GUARD)) {
      violations.push({
        rule: 'R10',
        file: rel(file.path),
        specifier: GUARD,
        target: null,
        message: `only server entry files import '${GUARD}'`,
      });
    }
  }
  return violations.sort(byFileThenRule);
}
