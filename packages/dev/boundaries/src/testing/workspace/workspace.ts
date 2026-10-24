import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

/**
 * Writes a throwaway workspace for a probe. `files` maps root-relative paths to
 * contents; `links` maps a root-relative link path (such as
 * `apps/web/node_modules/@x/a`) to a root-relative target directory, linked the
 * way pnpm links workspace packages.
 */
export function createWorkspace(
  files: Record<string, string>,
  links: Record<string, string> = {},
): { root: string; cleanup(): void } {
  const root = mkdtempSync(join(tmpdir(), 'boundaries-'));
  for (const [path, contents] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, contents);
  }
  for (const [link, target] of Object.entries(links)) {
    const full = join(root, link);
    mkdirSync(dirname(full), { recursive: true });
    symlinkSync(join(root, target), full, 'dir');
  }
  return {
    root,
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}
