// Shared by scripts/sync-brand-assets.mjs and scripts/check-brand-assets.mjs.
//
// @synapcity/frontend-brand owns the geometry (src/geometry.ts), the SVG
// builders (src/svg.ts) and the file list (src/manifest.ts). This module turns
// that into the exact set of files every host must carry:
//
//   canonical   packages/frontend/brand/assets/*            built from the package
//   web         apps/web/public/brand-assets/*              copies, same names (public URLs)
//   storybook   apps/storybook/public/brand-assets/<alias>  copies under the old Storybook names
//   icons       apps/{web,docs}/src/app/icon.svg            Next metadata file, built from the package
//   legacy      public/...                                  root copies kept until their external use is ruled out
//
// It reads the package's TypeScript directly (Node strips the types). The hook
// below resolves the package's extensionless relative imports the way the
// bundlers do.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (/^\.\.?\//.test(specifier) && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      try {
        return nextResolve(`${specifier}.ts`, context);
      } catch {
        // fall through to the default resolution and its error
      }
    }
    return nextResolve(specifier, context);
  },
});

export const BRAND_PACKAGE = 'packages/frontend/brand';
const CANONICAL_DIR = `${BRAND_PACKAGE}/assets`;
const WEB_DIR = 'apps/web/public/brand-assets';
const STORYBOOK_DIR = 'apps/storybook/public/brand-assets';
/** Apps whose `src/app` carries Next metadata icons. */
export const NEXT_APPS = ['web', 'docs'];
/** Root `public/`: not served by a checked-in app; see the brand package README. */
const LEGACY_PUBLIC = 'public';

/**
 * The rasters have no generator: they are checked, not built. Change the
 * checksum here only together with an intentional change to the PNG or ICO.
 */
export const RASTERS = [
  {
    file: 'apple-icon.png',
    format: 'png',
    width: 180,
    height: 180,
    sha256: '61a228bbd8daa574f7c6ae056589411753720cb769817b8545daf0cfdd61949a',
  },
  {
    file: 'favicon.ico',
    format: 'ico',
    sizes: ['16x16', '32x32', '48x48'],
    // Storybook serves it as the tab icon (its built index.html links ./favicon.ico).
    extra: ['apps/storybook/public/favicon.ico'],
    sha256: 'c786cd8ae7ac5fa5ffa3b78200fdcc32fd3c40d4201a633ad72d240d32bf57d6',
  },
];

export async function loadBrand(root) {
  const base = join(root, BRAND_PACKAGE, 'src');
  const [manifest, geometry] = await Promise.all([
    import(pathToFileURL(join(base, 'manifest.ts')).href),
    import(pathToFileURL(join(base, 'geometry.ts')).href),
  ]);
  return { ...manifest, geometry };
}

/**
 * Every generated or copied text file, keyed by repo-relative path.
 * `source` names what the file must equal, for failure messages.
 */
export function plannedFiles(brand) {
  const files = new Map();
  const put = (path, content, source) => files.set(path, { content, source });
  const byName = new Map(brand.canonicalAssets.map((a) => [a.file, a]));

  for (const asset of brand.canonicalAssets) {
    put(
      `${CANONICAL_DIR}/${asset.file}`,
      asset.content(),
      `${BRAND_PACKAGE}/src/manifest.ts (${asset.file})`,
    );
  }
  for (const name of brand.webPublicFiles) {
    put(
      `${WEB_DIR}/${name}`,
      byName.get(name).content(),
      `${CANONICAL_DIR}/${name}`,
    );
    put(
      `${LEGACY_PUBLIC}/brand-assets/${name}`,
      byName.get(name).content(),
      `${CANONICAL_DIR}/${name}`,
    );
  }
  for (const { alias, target } of brand.storybookAliases) {
    put(
      `${STORYBOOK_DIR}/${alias}`,
      byName.get(target).content(),
      `${CANONICAL_DIR}/${target} (Storybook alias ${alias})`,
    );
  }
  for (const app of NEXT_APPS) {
    put(
      `apps/${app}/src/app/${brand.appIcon.file}`,
      brand.appIcon.content(),
      `${BRAND_PACKAGE}/src/svg.ts (appIconSvg)`,
    );
  }
  put(
    `${LEGACY_PUBLIC}/${brand.appIcon.file}`,
    brand.appIcon.content(),
    `${BRAND_PACKAGE}/src/svg.ts (appIconSvg)`,
  );
  return files;
}

/** Directories that may hold only the planned files. */
export function exclusiveDirectories(brand) {
  return [
    [CANONICAL_DIR, brand.canonicalAssets.map((a) => a.file)],
    [WEB_DIR, [...brand.webPublicFiles]],
    [STORYBOOK_DIR, brand.storybookAliases.map((a) => a.alias)],
    [`${LEGACY_PUBLIC}/brand-assets`, [...brand.webPublicFiles]],
  ];
}

export function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

/** Dimensions of a PNG, or the sizes listed in an ICO directory. */
export function describeRaster(buffer, format) {
  if (format === 'png') {
    const isPng =
      buffer.length > 24 && buffer.subarray(1, 4).toString('latin1') === 'PNG';
    return isPng
      ? { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
      : null;
  }
  if (
    buffer.length < 6 ||
    buffer.readUInt16LE(0) !== 0 ||
    buffer.readUInt16LE(2) !== 1
  )
    return null;
  const count = buffer.readUInt16LE(4);
  const sizes = [];
  for (let i = 0; i < count; i += 1) {
    const at = 6 + i * 16;
    sizes.push(`${buffer[at] || 256}x${buffer[at + 1] || 256}`);
  }
  return { sizes };
}

const SKIPPED = new Set([
  'node_modules',
  '.git',
  '.next',
  '.turbo',
  'dist',
  'coverage',
  'storybook-static',
  'playwright-report',
  'test-results',
  '.playwright-mcp',
  '.serena',
  '.superpowers',
  '.impeccable',
  '.claude',
]);
const TEXT = /\.(svg|ts|tsx|mts|js|jsx|mjs|cjs|css|html)$/;

/** Every file under `root` that could carry a hand-copied logo, repo-relative. */
export function* walk(root, dir = root) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIPPED.has(entry.name) || entry.name.startsWith('.DS_Store')) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(root, path);
    else if (TEXT.test(entry.name)) yield relative(root, path);
  }
}

export function read(root, path) {
  const full = join(root, path);
  return existsSync(full) && statSync(full).isFile()
    ? readFileSync(full)
    : null;
}
