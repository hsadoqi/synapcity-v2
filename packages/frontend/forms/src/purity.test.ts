import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));

/*
 * The pure modules import neither React nor React Hook Form, so they can move
 * to a domain package if a server consumer appears. A new pure unit is added to
 * this list; units that render or bind the form library, and the renderer
 * types in `types/field-renderer.ts`, are not on it.
 */
const PURE = [
  'types/field-config.ts',
  'types/form-definition.ts',
  'utils/define-form',
  'utils/describe-schema-field',
  'utils/is-empty-value',
  'utils/resolve-field-states',
  'utils/build-schema',
  'utils/define-form-from-schema',
];

const FORBIDDEN = [
  /^react$/,
  /^react\//,
  /^react-dom(\/|$)/,
  /^react-hook-form(\/|$)/,
  /^@hookform\//,
];

function sources(directory: string): string[] {
  if (!existsSync(directory)) return [];
  if (statSync(directory).isFile()) return [directory];
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry) ? [path] : [];
  });
}

function specifiers(source: string): string[] {
  const found = source.matchAll(
    /(?:from\s+|import\s*\(\s*|import\s+)['"]([^'"]+)['"]/g,
  );
  return [...found].map((match) => match[1] ?? '');
}

describe('pure modules', () => {
  const files = PURE.flatMap((unit) => sources(join(here, unit)));

  it('are found', () => {
    expect(files.length).toBeGreaterThanOrEqual(8);
  });

  it('import neither react nor react-hook-form', () => {
    const offenders = files.flatMap((file) =>
      specifiers(readFileSync(file, 'utf8'))
        .filter((specifier) =>
          FORBIDDEN.some((pattern) => pattern.test(specifier)),
        )
        .map(
          (specifier) => `${file.slice(here.length + 1)} imports ${specifier}`,
        ),
    );
    expect(offenders).toEqual([]);
  });
});
