import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { EXCEPTIONS, applyExceptions } from '../exceptions/index.ts';
import type { Exception, Violation } from '../model/index.ts';
import { cycleRule } from '../rules/cycles/index.ts';
import { buildEdges, edgeRules } from '../rules/edge-rules/index.ts';
import { reachabilityRule } from '../rules/reachability/index.ts';
import { serverGuardRule } from '../rules/server-guard/index.ts';
import { loadWorkspace } from '../workspace/index.ts';

export interface CheckResult {
  violations: Violation[];
  stale: Exception[];
  /** Source files found per package name. */
  fileCounts: Record<string, number>;
}

/** Runs every boundary rule over the workspace at `root` and applies the exception list. */
export function check(
  root: string,
  exceptions: readonly Exception[] = EXCEPTIONS,
): CheckResult {
  const workspace = loadWorkspace(root);
  const { files, edges } = buildEdges(workspace);

  const fileCounts: Record<string, number> = {};
  for (const pkg of workspace.packages) fileCounts[pkg.name] = 0;
  for (const file of files.values())
    fileCounts[file.pkg.name] = (fileCounts[file.pkg.name] ?? 0) + 1;
  for (const pkg of workspace.packages) {
    if (fileCounts[pkg.name] === 0 && existsSync(join(pkg.dir, 'src'))) {
      throw new Error(
        `boundaries: no source files found in ${pkg.name}; the scan would pass silently`,
      );
    }
  }

  const violations = [
    ...edgeRules(files, edges, workspace),
    ...reachabilityRule(files, edges, workspace),
    ...cycleRule(workspace, edges),
    ...serverGuardRule(files, workspace),
  ].sort(
    (a, b) =>
      a.file.localeCompare(b.file) ||
      a.rule.localeCompare(b.rule, 'en', { numeric: true }),
  );

  const { remaining, stale } = applyExceptions(violations, exceptions);
  return { violations: remaining, stale, fileCounts };
}
