import {
  BACK,
  CORE,
  CORE_ORIGIN,
  CORE_RADIUS,
  FRONT,
  LOGO_HEIGHT,
  LOGO_MARK_SCALE,
  LOGO_WIDTH,
  LOGO_WORDMARK_PATH,
  MARK_GRID,
  SQUARE,
  SQUARE_RADIUS,
  STROKE,
  WORDMARK_HEIGHT,
  WORDMARK_PATH,
  WORDMARK_WIDTH,
} from './geometry';

/*
 * Server-safe SVG strings built from `geometry.ts`: no React, no hooks, no
 * DOM, so an image renderer (Open Graph) or a build script can use them. The
 * React components draw the same geometry with `currentColor`; these draw it
 * with a fixed ink or, for the adaptive variants, with a `prefers-color-scheme`
 * style block.
 *
 * `...Svg(ink)` returns the SVG without a trailing newline, ready to embed.
 * The canonical files in `assets/` are these strings plus one newline, see
 * `manifest.ts`.
 */

/** Ink for artwork that sits on a light background. */
export const INK_ON_LIGHT = '#000';
/** Ink for artwork that sits on a dark background. */
export const INK_ON_DARK = '#ebebeb';

const NAMESPACE = 'xmlns="http://www.w3.org/2000/svg"';
const NAMED = 'role="img" aria-label="synapcity"';

/* The colour-scheme-aware artwork reads these two classes. */
const ADAPTIVE_STYLE =
  '<style>.f{fill:#0a0a0a}.s{stroke:#0a0a0a}@media (prefers-color-scheme:dark){.f{fill:#ebebeb}.s{stroke:#ebebeb}}</style>';

const SQUARES = [BACK, FRONT]
  .map(
    (origin) =>
      `<rect x="${origin}" y="${origin}" width="${SQUARE}" height="${SQUARE}" rx="${SQUARE_RADIUS}"/>`,
  )
  .join('');

const coreAttributes = `x="${CORE_ORIGIN}" y="${CORE_ORIGIN}" width="${CORE}" height="${CORE}" rx="${CORE_RADIUS}"`;

const logoViewBox = `viewBox="0 0 ${LOGO_WIDTH} ${LOGO_HEIGHT}"`;
const wordmarkViewBox = `viewBox="0 0 ${WORDMARK_WIDTH} ${WORDMARK_HEIGHT}"`;
const markViewBox = `viewBox="0 0 ${MARK_GRID} ${MARK_GRID}"`;

/** The logo (mark beside the wordmark) in one fixed ink. */
export function logoSvg(ink: string): string {
  return (
    `<svg ${NAMESPACE} ${logoViewBox} ${NAMED}>` +
    `<g transform="scale(${LOGO_MARK_SCALE})" fill="none">` +
    `<g stroke="${ink}" stroke-width="${STROKE}">${SQUARES}</g>` +
    `<rect fill="${ink}" ${coreAttributes}/></g>` +
    `<path fill="${ink}" d="${LOGO_WORDMARK_PATH}"/></svg>`
  );
}

/** The logo following the viewer's colour scheme. */
export function logoAdaptiveSvg(): string {
  return (
    `<svg ${NAMESPACE} ${logoViewBox} ${NAMED}>${ADAPTIVE_STYLE}` +
    `<g transform="scale(${LOGO_MARK_SCALE})" fill="none">` +
    `<g class="s" stroke-width="${STROKE}">${SQUARES}</g>` +
    `<rect class="f" ${coreAttributes}/></g>` +
    `<path class="f" d="${LOGO_WORDMARK_PATH}"/></svg>`
  );
}

/** The wordmark in one fixed ink. */
export function wordmarkSvg(ink: string): string {
  return (
    `<svg ${NAMESPACE} ${wordmarkViewBox} ${NAMED}>` +
    `<path fill="${ink}" d="${WORDMARK_PATH}"/></svg>`
  );
}

/** The wordmark following the viewer's colour scheme. */
export function wordmarkAdaptiveSvg(): string {
  return (
    `<svg ${NAMESPACE} ${wordmarkViewBox} ${NAMED}>${ADAPTIVE_STYLE}` +
    `<path class="f" d="${WORDMARK_PATH}"/></svg>`
  );
}

/** The mark in one fixed ink, laid out over several lines for readable diffs. */
export function markSvg(ink: string): string {
  return [
    `<svg ${NAMESPACE} ${markViewBox} fill="none">`,
    `  <g stroke="${ink}" stroke-width="${STROKE}">`,
    ...[BACK, FRONT].map(
      (origin) =>
        `    <rect x="${origin}" y="${origin}" width="${SQUARE}" height="${SQUARE}" rx="${SQUARE_RADIUS}"/>`,
    ),
    '  </g>',
    `  <rect fill="${ink}" ${coreAttributes}/>`,
    '</svg>',
  ].join('\n');
}

/** The mark following the viewer's colour scheme, with its own class names. */
export function markAdaptiveSvg(): string {
  return [
    `<svg ${NAMESPACE} ${markViewBox} fill="none">`,
    '  <style>',
    '    .m { stroke: #171717; } .c { fill: #171717; }',
    '    @media (prefers-color-scheme: dark) { .m { stroke: #ebebeb; } .c { fill: #ebebeb; } }',
    '  </style>',
    `  <g class="m" stroke-width="${STROKE}">`,
    ...[BACK, FRONT].map(
      (origin) =>
        `    <rect x="${origin}" y="${origin}" width="${SQUARE}" height="${SQUARE}" rx="${SQUARE_RADIUS}"/>`,
    ),
    '  </g>',
    `  <rect class="c" ${coreAttributes}/>`,
    '</svg>',
  ].join('\n');
}

/**
 * The browser-tab icon Next.js picks up as `src/app/icon.svg`. It is an
 * unnamed, single-line variant of the mark with the colour-scheme style block.
 */
export function appIconSvg(): string {
  return (
    `<svg ${NAMESPACE} ${markViewBox}>` +
    '<style>.s{stroke:#171717}.f{fill:#171717}@media (prefers-color-scheme:dark){.s{stroke:#ebebeb}.f{fill:#ebebeb}}</style>' +
    `<g stroke-width="${STROKE}" fill="none" class="s">${SQUARES}</g>` +
    `<rect class="f" ${coreAttributes}/></svg>`
  );
}
