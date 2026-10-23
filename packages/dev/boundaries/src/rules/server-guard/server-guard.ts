import { join, relative, sep } from 'node:path';

import type { SourceFile, Violation, Workspace } from '../../model/index.ts';

const GUARD = 'server-only';

/** The file behind each server entry: `server-*` root entries and feature `./server` entries. */
function serverEntries(workspace: Workspace): Set<string> {
  const entries = new Set<string>();
  for (const pkg of workspace.packages) {
    const key =
      pkg.category === 'server'
        ? '.'
        : pkg.category === 'features'
          ? './server'
          : null;
    const target = key ? pkg.exports[key] : undefined;
    if (target) entries.add(join(pkg.dir, target));
  }
  return entries;
}

/** R10: every server entry file starts with `import 'server-only'`, and no other file imports it. */
export function serverGuardRule(
  files: Map<string, SourceFile>,
  workspace: Workspace,
): Violation[] {
  const rel = (path: string) =>
    relative(workspace.root, path).split(sep).join('/');
  const entries = serverEntries(workspace);
  const violations: Violation[] = [];

  for (const entry of entries) {
    const file = files.get(entry);
    const first = file?.imports[0];
    if (!file || first?.kind !== 'side-effect' || first.specifier !== GUARD) {
      violations.push({
        rule: 'R10',
        file: rel(entry),
        specifier: GUARD,
        target: null,
        message: `a server entry's first import must be import '${GUARD}'`,
      });
    }
  }
  for (const file of files.values()) {
    if (entries.has(file.path) || !file.production) continue;
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
  return violations.sort((a, b) => a.file.localeCompare(b.file));
}
