// Fails when a static brand export drifts from the logo geometry in
// packages/frontend/ui/src/components/logo-mark.tsx, which is the source of
// truth. Run with `pnpm brand:check`; it is part of `pnpm verify`.
//
// What it checks: the wordmark path and the mark geometry inside the static
// SVGs and the embedded SVG string in the social card, and that every app
// carries identical icon files. What it cannot check: that apple-icon.png and
// favicon.ico (rasters) match the geometry. Re-export those by hand.
//
// Usage: node scripts/check-brand-assets.mjs [repo-root]
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(
  process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..'),
);
const failures = [];
const fail = (file, message) => failures.push(`${file}: ${message}`);

const read = (path) => {
  try {
    return readFileSync(join(root, path), 'utf8');
  } catch {
    fail(path, 'cannot be read');
    return null;
  }
};

/* ---------- Source of truth ---------- */

const SOURCE = 'packages/frontend/ui/src/components/logo-mark.tsx';
const source = read(SOURCE);
if (source === null) report();

const numbers = {};
for (const [, name, value] of source.matchAll(
  /^const ([A-Z_]+) = (-?[\d.]+);$/gm,
)) {
  numbers[name] = Number(value);
}
const strings = {};
for (const [, name, value] of source.matchAll(
  /^const ([A-Z_]+) =\s*'([^']+)';$/gm,
)) {
  strings[name] = value;
}

const need = (kind, table, name) => {
  if (!(name in table)) {
    fail(SOURCE, `${kind} constant ${name} not found; update this script`);
    return undefined;
  }
  return table[name];
};

const grid = need('number', numbers, 'MARK_GRID');
const square = need('number', numbers, 'SQUARE');
const radius = need('number', numbers, 'SQUARE_RADIUS');
const stroke = need('number', numbers, 'STROKE');
const back = need('number', numbers, 'BACK');
const front = need('number', numbers, 'FRONT');
const core = need('number', numbers, 'CORE');
const coreRadius = need('number', numbers, 'CORE_RADIUS');
const wordmarkWidth = need('number', numbers, 'WORDMARK_WIDTH');
const wordmarkHeight = need('number', numbers, 'WORDMARK_HEIGHT');
const logoWidth = need('number', numbers, 'LOGO_WIDTH');
const logoHeight = need('number', numbers, 'LOGO_HEIGHT');
const wordmarkPath = need('string', strings, 'WORDMARK_PATH');
const logoWordmarkPath = need('string', strings, 'LOGO_WORDMARK_PATH');
if (failures.length > 0) report();

// Derived exactly as logo-mark.tsx derives them.
const coreOrigin = grid / 2 - core / 2;
const logoMarkScale = logoHeight / grid;

/* ---------- Expected fragments ---------- */

const markFragments = [
  [
    `<rect x="${back}" y="${back}" width="${square}" height="${square}" rx="${radius}"/>`,
    'back square',
  ],
  [
    `<rect x="${front}" y="${front}" width="${square}" height="${square}" rx="${radius}"/>`,
    'front square',
  ],
  [`stroke-width="${stroke}"`, 'stroke width'],
  [
    `x="${coreOrigin}" y="${coreOrigin}" width="${core}" height="${core}" rx="${coreRadius}"`,
    'core',
  ],
];

const markViewBox = [`viewBox="0 0 ${grid} ${grid}"`, 'mark viewBox'];
const wordmarkOnly = [
  [`viewBox="0 0 ${wordmarkWidth} ${wordmarkHeight}"`, 'wordmark viewBox'],
  [wordmarkPath, 'WORDMARK_PATH'],
];
const logoFragments = [
  [`viewBox="0 0 ${logoWidth} ${logoHeight}"`, 'logo viewBox'],
  [`scale(${logoMarkScale})`, 'logo mark scale'],
  [logoWordmarkPath, 'LOGO_WORDMARK_PATH'],
  ...markFragments,
];

const BRAND = 'apps/web/public/brand-assets';
const exportsToCheck = [
  [`${BRAND}/mark-light.svg`, [markViewBox, ...markFragments]],
  [`${BRAND}/mark-dark.svg`, [markViewBox, ...markFragments]],
  [`${BRAND}/wordmark.svg`, wordmarkOnly],
  [`${BRAND}/wordmark-monochrome.svg`, wordmarkOnly],
  [`${BRAND}/logo.svg`, logoFragments],
  [`${BRAND}/logo-monochrome.svg`, logoFragments],
  ['packages/frontend/site/src/open-graph.tsx', logoFragments],
];

/* ---------- Apps: each carries identical icon files ---------- */

const ICONS = ['icon.svg', 'apple-icon.png', 'favicon.ico'];
const appsDir = join(root, 'apps');
const apps = existsSync(appsDir)
  ? readdirSync(appsDir).filter((name) =>
      existsSync(join(appsDir, name, 'src/app/layout.tsx')),
    )
  : [];

for (const app of apps) {
  const iconSvg = `apps/${app}/src/app/icon.svg`;
  exportsToCheck.push([iconSvg, [markViewBox, ...markFragments]]);
}

for (const [path, fragments] of exportsToCheck) {
  const text = read(path);
  if (text === null) continue;
  for (const [fragment, label] of fragments) {
    if (!text.includes(fragment)) {
      fail(path, `${label} does not match ${SOURCE}`);
    }
  }
}

const [reference, ...others] = apps;
for (const icon of ICONS) {
  const referencePath = `apps/${reference}/src/app/${icon}`;
  let expected = null;
  try {
    expected = readFileSync(join(root, referencePath));
  } catch {
    fail(referencePath, 'missing');
    continue;
  }
  for (const app of others) {
    const path = `apps/${app}/src/app/${icon}`;
    try {
      if (!readFileSync(join(root, path)).equals(expected)) {
        fail(path, `differs from ${referencePath}`);
      }
    } catch {
      fail(path, 'missing');
    }
  }
}

report();

function report() {
  if (failures.length > 0) {
    console.error(
      `brand assets drifted from ${SOURCE} (${failures.length}):\n` +
        failures.map((line) => `  - ${line}`).join('\n') +
        '\nChange the geometry in logo-mark.tsx first, then re-export the files above.',
    );
    process.exit(1);
  }
  console.log(
    `brand assets match ${relative(root, join(root, SOURCE))}: ` +
      `${exportsToCheck.length} exports, ${ICONS.length} icon files across ${apps.length} apps`,
  );
}
