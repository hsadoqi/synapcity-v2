import * as React from 'react';
import { cn } from 'cn';

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
} from '../geometry';

/*
 * synapcity brand marks (PRODUCT.md, "Brand commitments"):
 *
 * - SynapcityMark: two overlapping rounded squares with a solid core at the
 *   centre of their overlap.
 * - SynapcityWordmark: the lowercase word "synapcity", set in Geist 500 with
 *   kerning and -0.02em tracking, converted to outlines so it never changes
 *   with the user's font preference.
 * - SynapcityLogo: the mark beside the wordmark, as one SVG.
 *
 * Everything draws in `currentColor`, so it follows the surrounding text
 * colour (`text-foreground`, `text-muted-foreground`, ...) in both modes.
 * The core can take its own colour. Each component scales as a whole from
 * one `size` prop; the core grows and shrinks with it.
 *
 * The geometry lives in `../geometry.ts`. The static SVGs in `assets/` are
 * built from the same numbers (`../svg.ts`) for places React cannot reach,
 * such as the social card, emails and READMEs.
 */

/* ---------- Sizing ---------- */

type BrandSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Square presets for the mark. */
const markSizes: Record<BrandSize, string> = {
  xs: 'size-4',
  sm: 'size-5',
  md: 'size-6',
  lg: 'size-8',
  xl: 'size-12',
};

/** Height presets for the wordmark; width follows the aspect ratio. */
const wordmarkSizes: Record<BrandSize, string> = {
  xs: 'h-3',
  sm: 'h-4',
  md: 'h-5',
  lg: 'h-6',
  xl: 'h-8',
};

/** Height presets for the logo; the mark in it matches SynapcityMark at the same size. */
const logoSizes: Record<BrandSize, string> = {
  xs: 'h-4',
  sm: 'h-5',
  md: 'h-6',
  lg: 'h-8',
  xl: 'h-12',
};

function isPreset(size: unknown): size is BrandSize {
  // Own keys only: `in` also matches inherited names such as "toString".
  return typeof size === 'string' && Object.keys(markSizes).includes(size);
}

/* ---------- Shared props ---------- */

type BaseProps = Omit<
  React.SVGProps<SVGSVGElement>,
  'children' | 'ref' | 'width' | 'height'
> & {
  /**
   * Size of the whole graphic: a preset (`xs` to `xl`, default `md`) or any
   * CSS length (`40`, `'2rem'`). For the mark it is the width and height;
   * for the wordmark and logo it is the height, and the width follows.
   */
  size?: BrandSize | number | string;
  /** Accessible name. Defaults to "synapcity"; pass `null` when the graphic is decorative. */
  title?: string | null;
};

type CoreProps = {
  /** Classes for the core, e.g. `fill-primary` or `fill-accent-500`. */
  coreClassName?: string;
  /** Any CSS colour for the core, e.g. `var(--primary)`. Prefer `coreClassName`. */
  coreColor?: string;
};

function useA11y(title: string | null | undefined) {
  const id = React.useId();
  const label = title === undefined ? 'synapcity' : title;
  return {
    node: label ? <title id={id}>{label}</title> : null,
    attrs: label
      ? { role: 'img' as const, 'aria-labelledby': id }
      : { 'aria-hidden': true as const },
  };
}

function MarkShape({ coreClassName, coreColor }: CoreProps) {
  return (
    <>
      <g stroke="currentColor" strokeWidth={STROKE} fill="none">
        <rect
          x={BACK}
          y={BACK}
          width={SQUARE}
          height={SQUARE}
          rx={SQUARE_RADIUS}
        />
        <rect
          x={FRONT}
          y={FRONT}
          width={SQUARE}
          height={SQUARE}
          rx={SQUARE_RADIUS}
        />
      </g>
      <rect
        data-slot="synapcity-mark-core"
        x={CORE_ORIGIN}
        y={CORE_ORIGIN}
        width={CORE}
        height={CORE}
        rx={CORE_RADIUS}
        fill={coreColor ?? 'currentColor'}
        className={coreClassName}
      />
    </>
  );
}

/* ---------- Components ---------- */

type SynapcityMarkProps = BaseProps & CoreProps;

function SynapcityMark({
  size = 'md',
  title = null,
  coreClassName,
  coreColor,
  className,
  ...props
}: SynapcityMarkProps) {
  const a11y = useA11y(title);
  const dimension = isPreset(size) ? undefined : size;

  return (
    <svg
      data-slot="synapcity-mark"
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${MARK_GRID} ${MARK_GRID}`}
      width={dimension}
      height={dimension}
      focusable="false"
      className={cn('shrink-0', isPreset(size) && markSizes[size], className)}
      {...a11y.attrs}
      {...props}
    >
      {a11y.node}
      <MarkShape coreClassName={coreClassName} coreColor={coreColor} />
    </svg>
  );
}

type SynapcityWordmarkProps = BaseProps;

function SynapcityWordmark({
  size = 'md',
  title,
  className,
  ...props
}: SynapcityWordmarkProps) {
  const a11y = useA11y(title);

  return (
    <svg
      data-slot="synapcity-wordmark"
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${WORDMARK_WIDTH} ${WORDMARK_HEIGHT}`}
      height={isPreset(size) ? undefined : size}
      focusable="false"
      className={cn(
        'w-auto shrink-0',
        isPreset(size) && wordmarkSizes[size],
        className,
      )}
      {...a11y.attrs}
      {...props}
    >
      {a11y.node}
      <path d={WORDMARK_PATH} fill="currentColor" />
    </svg>
  );
}

type SynapcityLogoProps = BaseProps & CoreProps;

function SynapcityLogo({
  size = 'md',
  title,
  coreClassName,
  coreColor,
  className,
  ...props
}: SynapcityLogoProps) {
  const a11y = useA11y(title);

  return (
    <svg
      data-slot="synapcity-logo"
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${LOGO_WIDTH} ${LOGO_HEIGHT}`}
      height={isPreset(size) ? undefined : size}
      focusable="false"
      className={cn(
        'w-auto shrink-0',
        isPreset(size) && logoSizes[size],
        className,
      )}
      {...a11y.attrs}
      {...props}
    >
      {a11y.node}
      <g transform={`scale(${LOGO_MARK_SCALE})`}>
        <MarkShape coreClassName={coreClassName} coreColor={coreColor} />
      </g>
      <path d={LOGO_WORDMARK_PATH} fill="currentColor" />
    </svg>
  );
}

export { SynapcityMark, SynapcityWordmark, SynapcityLogo };
export type {
  BrandSize,
  SynapcityMarkProps,
  SynapcityWordmarkProps,
  SynapcityLogoProps,
};
