import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { LOGO_WORDMARK_PATH, WORDMARK_PATH } from './geometry';
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

const assets = join(import.meta.dirname, '..', 'assets');

describe('svg builders', () => {
  it('draw the logo at the shipped box with the wordmark outline', () => {
    const svg = logoSvg(INK_ON_LIGHT);

    expect(svg).toContain('viewBox="0 0 5868 1100"');
    expect(svg).toContain('transform="scale(34.375)"');
    expect(svg).toContain(`d="${LOGO_WORDMARK_PATH}"`);
    expect(svg).toContain(
      'x="13.75" y="13.75" width="4.5" height="4.5" rx="0.75"',
    );
  });

  it('draw the wordmark at the shipped box', () => {
    const svg = wordmarkSvg(INK_ON_LIGHT);

    expect(svg).toContain('viewBox="0 0 4348 865"');
    expect(svg).toContain(`d="${WORDMARK_PATH}"`);
  });

  it('use one fixed ink throughout a fixed-ink variant', () => {
    const svg = logoSvg(INK_ON_DARK);

    expect(svg.split(INK_ON_DARK)).toHaveLength(4);
    expect(svg).not.toContain(INK_ON_LIGHT);
    expect(svg).not.toContain('<style>');
  });

  it('follow the colour scheme in the adaptive variants', () => {
    for (const svg of [
      logoAdaptiveSvg(),
      wordmarkAdaptiveSvg(),
      markAdaptiveSvg(),
      appIconSvg(),
    ]) {
      expect(svg).toContain('prefers-color-scheme');
    }
    for (const svg of [
      logoSvg(INK_ON_LIGHT),
      wordmarkSvg(INK_ON_LIGHT),
      markSvg(INK_ON_LIGHT),
    ]) {
      expect(svg).not.toContain('prefers-color-scheme');
    }
  });

  it('are plain strings with no script or external reference', () => {
    for (const svg of [
      logoSvg(INK_ON_LIGHT),
      logoAdaptiveSvg(),
      wordmarkSvg(INK_ON_DARK),
      markSvg(INK_ON_LIGHT),
      appIconSvg(),
    ]) {
      expect(svg).not.toMatch(/<script|href=|url\(|<image/);
    }
  });

  // The Open Graph card embeds this string; it used to carry its own copy.
  it('make the monochrome logo file one newline longer than the embeddable string', () => {
    expect(readFileSync(join(assets, 'logo-monochrome.svg'), 'utf8')).toBe(
      `${logoSvg(INK_ON_LIGHT)}\n`,
    );
  });
});
