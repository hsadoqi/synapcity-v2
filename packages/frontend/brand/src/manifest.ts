import {
  appIconSvg,
  INK_ON_DARK,
  INK_ON_LIGHT,
  logoAdaptiveSvg,
  logoSvg,
  markAdaptiveSvg,
  markSvg,
  wordmarkAdaptiveSvg,
  wordmarkSvg,
} from './svg';

/*
 * The list of canonical brand files and the compatibility names hosts still
 * serve. Data only, no file system access: the sync and check scripts walk it
 * and hosts decide where each file lands.
 */

export type BrandAsset = {
  /** File name under `assets/` (and under a host's `/brand-assets/`). */
  file: string;
  /** The exact bytes of the file. */
  content: () => string;
};

const file = (name: string, build: () => string): BrandAsset => ({
  file: name,
  content: () => `${build()}\n`,
});

/** Canonical static exports: `assets/<file>` is exactly `content()`. */
export const canonicalAssets: readonly BrandAsset[] = [
  file('logo.svg', logoAdaptiveSvg),
  file('logo-monochrome.svg', () => logoSvg(INK_ON_LIGHT)),
  file('logo-on-dark.svg', () => logoSvg(INK_ON_DARK)),
  file('mark-dark.svg', markAdaptiveSvg),
  file('mark-light.svg', () => markSvg(INK_ON_LIGHT)),
  file('wordmark.svg', wordmarkAdaptiveSvg),
  file('wordmark-monochrome.svg', () => wordmarkSvg(INK_ON_LIGHT)),
];

/**
 * The files served at `/brand-assets/...` by `apps/web`. These URLs are
 * public; none is renamed or removed. `logo-on-dark.svg` is not part of the
 * set because the web app never served it.
 */
export const webPublicFiles: readonly string[] = [
  'logo.svg',
  'logo-monochrome.svg',
  'mark-dark.svg',
  'mark-light.svg',
  'wordmark.svg',
  'wordmark-monochrome.svg',
];

export type CompatibilityAlias = {
  /** The name a host still serves. */
  alias: string;
  /** The canonical file it must be byte-identical to. */
  target: string;
};

/**
 * Storybook names that differ from the canonical ones. `logo-dark.svg` is the
 * logo in dark ink for a light background (the monochrome logo); the fixed
 * light-ink logo for a dark background is canonical as `logo-on-dark.svg`.
 */
export const storybookAliases: readonly CompatibilityAlias[] = [
  { alias: 'logo-dark.svg', target: 'logo-monochrome.svg' },
  { alias: 'logo-light.svg', target: 'logo.svg' },
  { alias: 'wordmark-dark.svg', target: 'wordmark-monochrome.svg' },
  { alias: 'wordmark-light.svg', target: 'wordmark.svg' },
];

/** `src/app/icon.svg` of each Next app: Next only recognises it there. */
export const appIcon: BrandAsset = file('icon.svg', appIconSvg);
