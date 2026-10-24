import { relative, sep } from 'node:path';

import type { Violation } from '../model/index.ts';

/** Repository-relative path with POSIX separators, the form violations and exceptions use. */
export function repoPath(root: string, path: string): string {
  return relative(root, path).split(sep).join('/');
}

/** Orders violations by file, then by rule number (R2 before R10), independent of locale. */
export function byFileThenRule(a: Violation, b: Violation): number {
  return (
    a.file.localeCompare(b.file, 'en') ||
    a.rule.localeCompare(b.rule, 'en', { numeric: true })
  );
}
