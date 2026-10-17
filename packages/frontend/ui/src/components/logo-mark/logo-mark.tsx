import * as React from 'react';
import { cn } from 'cn';

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
 * This file is the source of truth for the geometry. The static SVGs in
 * apps/web/public/brand-assets (and apps/web/src/app/icon.svg) are exports of
 * it for places React cannot reach, such as the social card, emails and
 * READMEs. Change the geometry here first, then re-export those files.
 */

/* ---------- Mark geometry (32-unit grid) ---------- */

const MARK_GRID = 32;
const SQUARE = 18;
const SQUARE_RADIUS = 3.5;
const STROKE = 2.25;
const BACK = 3;
const FRONT = 11;
const CORE = 4.5;
const CORE_ORIGIN = MARK_GRID / 2 - CORE / 2;
const CORE_RADIUS = 0.75;

/* ---------- Wordmark outlines (Geist 500, 1000 units per em) ---------- */

const WORDMARK_WIDTH = 4348;
const WORDMARK_HEIGHT = 865;
const WORDMARK_PATH =
  'M0 547 110 542Q117 588 148.5 613Q180 638 239 638Q290 638 318.5 621.5Q347 605 347 571Q347 551 337 538Q327 525 300 515.5Q273 506 220 497Q142 483 96.5 462.5Q51 442 32 411.5Q13 381 13 336Q13 262 69 216.5Q125 171 226 171Q324 171 380.5 219.5Q437 268 449 346L340 352Q332 309 302.5 284.5Q273 260 225 260Q175 260 149 279.5Q123 299 123 332Q123 356 134.5 371Q146 386 171.5 395.5Q197 405 242 412Q325 426 371 446Q417 466 437 495.5Q457 525 457 570Q457 644 396.5 685.5Q336 727 239 727Q166 727 113.5 704.5Q61 682 32.5 641.5Q4 601 0 547ZM561 778H625Q651 778 664.5 770Q678 762 685 743L702 699H669L477 183H589L735 601L875 183H987L775 777Q759 823 727.5 844Q696 865 641 865H561ZM1064 183H1161L1165 325L1152 318Q1165 244 1211.5 207.5Q1258 171 1325 171Q1411 171 1458 226.5Q1505 282 1505 373V715H1399V405Q1399 333 1375 296.5Q1351 260 1296 260Q1238 260 1204 298Q1170 336 1170 405V715H1064ZM1593 582Q1593 514 1634 475Q1675 436 1763 419L1946 384Q1946 322 1917.5 291.5Q1889 261 1832 261Q1782 261 1752 283.5Q1722 306 1712 350L1602 343Q1617 262 1677.5 216.5Q1738 171 1832 171Q1939 171 1995.5 228Q2052 285 2052 390V597Q2052 616 2059 623.5Q2066 631 2081 631H2100V715Q2093 716 2082.5 717Q2072 718 2061 718Q2006 718 1979.5 691.5Q1953 665 1953 602L1964 607Q1953 659 1900 693Q1847 727 1775 727Q1692 727 1642.5 688.5Q1593 650 1593 582ZM1946 498V464L1791 494Q1744 503 1723.5 522Q1703 541 1703 572Q1703 606 1726.5 624.5Q1750 643 1793 643Q1840 643 1874.5 624.5Q1909 606 1927.5 573Q1946 540 1946 498ZM2184 183H2284L2287 297L2275 291Q2294 233 2340 202Q2386 171 2447 171Q2522 171 2573.5 208Q2625 245 2650 308.5Q2675 372 2675 449Q2675 526 2650 589.5Q2625 653 2573.5 690Q2522 727 2447 727Q2407 727 2372 713Q2337 699 2312.5 673Q2288 647 2278 613L2290 601V865H2184ZM2565 449Q2565 361 2528.5 312Q2492 263 2428 263Q2386 263 2354.5 284Q2323 305 2306.5 346.5Q2290 388 2290 449Q2290 510 2306.5 551.5Q2323 593 2354 614Q2385 635 2428 635Q2492 635 2528.5 586Q2565 537 2565 449ZM2738 449Q2738 366 2769.5 302.5Q2801 239 2858 205Q2915 171 2991 171Q3055 171 3105.5 193.5Q3156 216 3188 259.5Q3220 303 3228 364L3118 370Q3110 319 3076 291Q3042 263 2991 263Q2924 263 2886 312Q2848 361 2848 449Q2848 537 2886 586Q2924 635 2991 635Q3042 635 3076 606Q3110 577 3118 520L3228 526Q3220 587 3188.5 632Q3157 677 3106 702Q3055 727 2991 727Q2915 727 2858 693Q2801 659 2769.5 595.5Q2738 532 2738 449ZM3299 183H3405V715H3299ZM3297 0H3408V106H3297ZM3555 571V58H3661V563Q3661 599 3676.5 613.5Q3692 628 3726 628H3802V715H3703Q3627 715 3591 680Q3555 645 3555 571ZM3474 183H3802V270H3474ZM3922 778H3986Q4012 778 4025.5 770Q4039 762 4046 743L4063 699H4030L3838 183H3950L4096 601L4236 183H4348L4136 777Q4120 823 4088.5 844Q4057 865 4002 865H3922Z';

/* In the lockup the mark is 1100 units tall and the wordmark sits 420 units
   to its right, with the mark centred on the x-height. */
const LOGO_WIDTH = 5868;
const LOGO_HEIGHT = 1100;
const LOGO_MARK_SCALE = LOGO_HEIGHT / MARK_GRID;
const LOGO_WORDMARK_PATH =
  'M1520 647 1630 642Q1637 688 1668.5 713Q1700 738 1759 738Q1810 738 1838.5 721.5Q1867 705 1867 671Q1867 651 1857 638Q1847 625 1820 615.5Q1793 606 1740 597Q1662 583 1616.5 562.5Q1571 542 1552 511.5Q1533 481 1533 436Q1533 362 1589 316.5Q1645 271 1746 271Q1844 271 1900.5 319.5Q1957 368 1969 446L1860 452Q1852 409 1822.5 384.5Q1793 360 1745 360Q1695 360 1669 379.5Q1643 399 1643 432Q1643 456 1654.5 471Q1666 486 1691.5 495.5Q1717 505 1762 512Q1845 526 1891 546Q1937 566 1957 595.5Q1977 625 1977 670Q1977 744 1916.5 785.5Q1856 827 1759 827Q1686 827 1633.5 804.5Q1581 782 1552.5 741.5Q1524 701 1520 647ZM2081 878H2145Q2171 878 2184.5 870Q2198 862 2205 843L2222 799H2189L1997 283H2109L2255 701L2395 283H2507L2295 877Q2279 923 2247.5 944Q2216 965 2161 965H2081ZM2584 283H2681L2685 425L2672 418Q2685 344 2731.5 307.5Q2778 271 2845 271Q2931 271 2978 326.5Q3025 382 3025 473V815H2919V505Q2919 433 2895 396.5Q2871 360 2816 360Q2758 360 2724 398Q2690 436 2690 505V815H2584ZM3113 682Q3113 614 3154 575Q3195 536 3283 519L3466 484Q3466 422 3437.5 391.5Q3409 361 3352 361Q3302 361 3272 383.5Q3242 406 3232 450L3122 443Q3137 362 3197.5 316.5Q3258 271 3352 271Q3459 271 3515.5 328Q3572 385 3572 490V697Q3572 716 3579 723.5Q3586 731 3601 731H3620V815Q3613 816 3602.5 817Q3592 818 3581 818Q3526 818 3499.5 791.5Q3473 765 3473 702L3484 707Q3473 759 3420 793Q3367 827 3295 827Q3212 827 3162.5 788.5Q3113 750 3113 682ZM3466 598V564L3311 594Q3264 603 3243.5 622Q3223 641 3223 672Q3223 706 3246.5 724.5Q3270 743 3313 743Q3360 743 3394.5 724.5Q3429 706 3447.5 673Q3466 640 3466 598ZM3704 283H3804L3807 397L3795 391Q3814 333 3860 302Q3906 271 3967 271Q4042 271 4093.5 308Q4145 345 4170 408.5Q4195 472 4195 549Q4195 626 4170 689.5Q4145 753 4093.5 790Q4042 827 3967 827Q3927 827 3892 813Q3857 799 3832.5 773Q3808 747 3798 713L3810 701V965H3704ZM4085 549Q4085 461 4048.5 412Q4012 363 3948 363Q3906 363 3874.5 384Q3843 405 3826.5 446.5Q3810 488 3810 549Q3810 610 3826.5 651.5Q3843 693 3874 714Q3905 735 3948 735Q4012 735 4048.5 686Q4085 637 4085 549ZM4258 549Q4258 466 4289.5 402.5Q4321 339 4378 305Q4435 271 4511 271Q4575 271 4625.5 293.5Q4676 316 4708 359.5Q4740 403 4748 464L4638 470Q4630 419 4596 391Q4562 363 4511 363Q4444 363 4406 412Q4368 461 4368 549Q4368 637 4406 686Q4444 735 4511 735Q4562 735 4596 706Q4630 677 4638 620L4748 626Q4740 687 4708.5 732Q4677 777 4626 802Q4575 827 4511 827Q4435 827 4378 793Q4321 759 4289.5 695.5Q4258 632 4258 549ZM4819 283H4925V815H4819ZM4817 100H4928V206H4817ZM5075 671V158H5181V663Q5181 699 5196.5 713.5Q5212 728 5246 728H5322V815H5223Q5147 815 5111 780Q5075 745 5075 671ZM4994 283H5322V370H4994ZM5442 878H5506Q5532 878 5545.5 870Q5559 862 5566 843L5583 799H5550L5358 283H5470L5616 701L5756 283H5868L5656 877Q5640 923 5608.5 944Q5577 965 5522 965H5442Z';

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
