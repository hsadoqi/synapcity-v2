// Fails when any brand file drifts from @synapcity/frontend-brand, the owner of
// the logo geometry (packages/frontend/brand/src/geometry.ts). Run with
// `pnpm brand:check`; it is part of `pnpm verify`. `pnpm brand:sync` rewrites
// the files this reports.
//
// It compares exact bytes, not selected fragments:
//   - every canonical SVG, web public output, Storybook alias and app icon.svg
//     equals what the package builds;
//   - the directories that hold them contain nothing else;
//   - no other SVG or source file carries a copy of the logo outlines or the
//     mark geometry (the Open Graph card embeds none and imports the builder);
//   - apple-icon.png and favicon.ico are identical across apps and match the
//     recorded format, dimensions and checksum.
// What it cannot check: that those two rasters were drawn from the geometry.
// No generator exists, so a changed raster needs its checksum updated by hand
// in brand-assets-lib.mjs.
//
// Usage: node scripts/check-brand-assets.mjs [repo-root]
import { dirname, join, resolve } from 'node:path';
import { readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  BRAND_PACKAGE,
  describeRaster,
  exclusiveDirectories,
  loadBrand,
  NEXT_APPS,
  plannedFiles,
  RASTERS,
  read,
  sha256,
  walk,
} from './brand-assets-lib.mjs';

const root = resolve(
  process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..'),
);
const failures = [];
const fail = (file, message) => failures.push(`${file}: ${message}`);

let brand;
try {
  brand = await loadBrand(root);
} catch (error) {
  fail(`${BRAND_PACKAGE}/src`, `cannot be loaded (${error.message})`);
  report();
}

const planned = plannedFiles(brand);

/* ---------- Generated and copied SVGs: exact bytes ---------- */

for (const [path, { content, source }] of planned) {
  const actual = read(root, path);
  if (actual === null) fail(path, `missing; expected output of ${source}`);
  else if (actual.toString('utf8') !== content)
    fail(path, `differs from ${source}`);
}

/* ---------- Directories hold only the planned files ---------- */

for (const [dir, names] of exclusiveDirectories(brand)) {
  if (!existsSync(join(root, dir))) continue;
  for (const name of readdirSync(join(root, dir))) {
    if (!names.includes(name) && !name.startsWith('.DS_Store')) {
      fail(
        `${dir}/${name}`,
        `unexpected file; ${dir} holds only ${names.join(', ')}`,
      );
    }
  }
}

/* ---------- No second copy of the geometry anywhere ---------- */

const { WORDMARK_PATH, LOGO_WORDMARK_PATH } = brand.geometry;
// The mark core is looked for in SVG files only; code names its numbers.
const signatures = [
  [WORDMARK_PATH.slice(0, 80), 'wordmark outline', /./],
  [LOGO_WORDMARK_PATH.slice(0, 80), 'logo wordmark outline', /./],
  [
    `x="${brand.geometry.CORE_ORIGIN}" y="${brand.geometry.CORE_ORIGIN}"`,
    'mark core',
    /\.svg$/,
  ],
];
const owners = new Set([`${BRAND_PACKAGE}/src/geometry.ts`, ...planned.keys()]);
for (const path of walk(root)) {
  if (owners.has(path)) continue;
  const text = read(root, path)?.toString('utf8') ?? '';
  for (const [signature, label, files] of signatures) {
    if (files.test(path) && text.includes(signature)) {
      fail(
        path,
        `carries its own copy of the ${label}; it belongs to ${BRAND_PACKAGE}/src/geometry.ts`,
      );
    }
  }
}

/* ---------- Consumers use the package, not literals ---------- */

const consumer = (path, needle, why) => {
  const text = read(root, path)?.toString('utf8');
  if (text === undefined || text === null) return fail(path, 'missing');
  if (!text.includes(needle)) fail(path, `${why} (expected "${needle}")`);
};
consumer(
  'packages/frontend/site/src/open-graph.tsx',
  '@synapcity/frontend-brand/svg',
  'the social card must build its logo with the brand package',
);
consumer(
  'packages/frontend/ui/src/components/logo-mark/logo-mark.tsx',
  '@synapcity/frontend-brand/react',
  'the compatibility entry must re-export the brand package',
);

/* ---------- Rasters: identical across apps, recorded format and checksum ---------- */

for (const raster of RASTERS) {
  const copies = [
    ...NEXT_APPS.map((app) => `apps/${app}/src/app/${raster.file}`),
    `public/${raster.file}`,
    ...(raster.extra ?? []),
  ];
  for (const path of copies) {
    const data = read(root, path);
    if (data === null) {
      fail(path, 'missing');
      continue;
    }
    const detail = describeRaster(data, raster.format);
    if (detail === null) {
      fail(path, `is not a ${raster.format.toUpperCase()} file`);
    } else if (
      raster.format === 'png' &&
      (detail.width !== raster.width || detail.height !== raster.height)
    ) {
      fail(
        path,
        `is ${detail.width}x${detail.height}, expected ${raster.width}x${raster.height}`,
      );
    } else if (
      raster.format === 'ico' &&
      detail.sizes.join() !== raster.sizes.join()
    ) {
      fail(
        path,
        `holds ${detail.sizes.join(', ')}, expected ${raster.sizes.join(', ')}`,
      );
    }
    const sum = sha256(data);
    if (sum !== raster.sha256) {
      fail(
        path,
        `checksum ${sum.slice(0, 12)}... differs from the recorded ${raster.sha256.slice(0, 12)}... (update RASTERS in scripts/brand-assets-lib.mjs only for an intentional change)`,
      );
    }
  }
  const [first, ...rest] = copies;
  const reference = read(root, first);
  for (const path of rest) {
    const data = read(root, path);
    if (reference && data && !data.equals(reference))
      fail(path, `differs from ${first}`);
  }
}

report();

function report() {
  if (failures.length > 0) {
    console.error(
      `brand files drifted from ${BRAND_PACKAGE} (${failures.length}):\n` +
        failures.map((line) => `  - ${line}`).join('\n') +
        '\nChange the geometry in packages/frontend/brand/src/geometry.ts first, then run `pnpm brand:sync`.',
    );
    process.exit(1);
  }
  console.log(
    `brand files match ${BRAND_PACKAGE}: ${planned.size} generated or copied SVGs, ` +
      `${RASTERS.length} raster files across ${NEXT_APPS.length} apps (plus the root copy)`,
  );
}
