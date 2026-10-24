import { create } from 'storybook/theming';
import type { ResolvedMode } from '@synapcity/frontend-preferences';

/*
 * Storybook's manager (sidebar, toolbar, panels) is a separate page that never loads our
 * stylesheet, and its theming parses colours with a library that does not read `oklch()` or
 * CSS variables. The hex values below are therefore the sRGB form of the design-system tokens
 * in packages/frontend/tailwind-config/tokens (default theme, achromatic graphite). Change a
 * token there, then update the matching value here.
 *
 * Token key, light / dark:
 *   background  100%     #ffffff  / base-950 #0a0a0a  (content, toolbar)
 *   sidebar     base-50  #fafafa  / base-900 #171717  (sidebar, app chrome)
 *   muted       base-100 #f5f5f5  / base-800 #262626  (hover, buttons)
 *   divider     base-200 #e5e5e5  / base-800 #262626  (seams between regions)
 *   foreground  base-950 #0a0a0a  / base-50  #fafafa
 *   muted-fg    52%      #696969  / 70.8%    #a1a1a1
 *   input       60%      #808080  / 40% white on card #ababab
 *   primary     #171717 (oklch 20.5%, DESIGN.md §2)  / #e5e5e5 (oklch 92.2%)
 */
// Deliberate hex: the manager cannot parse oklch() or read CSS variables (see the table above).
const light = {
  primary: '#171717',
  background: '#ffffff',
  sidebar: '#fafafa',
  muted: '#f5f5f5',
  divider: '#e5e5e5',
  foreground: '#0a0a0a',
  mutedForeground: '#696969',
  input: '#808080',
  inverse: '#fafafa',
} as const;

const dark = {
  primary: '#e5e5e5',
  background: '#0a0a0a',
  sidebar: '#171717',
  muted: '#262626',
  divider: '#262626',
  foreground: '#fafafa',
  mutedForeground: '#a1a1a1',
  input: '#ababab',
  inverse: '#0a0a0a',
} as const;

type Palette = typeof light | typeof dark;

/**
 * Storybook theme variables from a token palette. Roles follow the app: neutral ground, the
 * sidebar a half-step off the content, primary only on what is selected or focused.
 */
function paletteToVars(p: Palette) {
  return {
    colorPrimary: p.primary,
    colorSecondary: p.primary,
    appBg: p.background,
    appContentBg: p.background,
    appPreviewBg: p.background,
    appHoverBg: p.muted,
    appBorderColor: p.divider,
    textColor: p.foreground,
    textInverseColor: p.inverse,
    textMutedColor: p.mutedForeground,
    barTextColor: p.mutedForeground,
    barHoverColor: p.foreground,
    barSelectedColor: p.foreground,
    barBg: p.background,
    buttonBg: p.muted,
    buttonBorder: p.divider,
    booleanBg: p.divider,
    booleanSelectedBg: p.background,
    inputBg: p.background,
    inputBorder: p.input,
    inputTextColor: p.foreground,
  };
}

/** Light-mode and dark-mode theme variables, keyed by mode. */
export const lightPalette = paletteToVars(light);
export const darkPalette = paletteToVars(dark);

/**
 * Brand registry. `logo[mode]` is the artwork for that mode's background: ink dark enough to
 * read on light, ink light enough to read on dark. The files are fixed-colour on purpose; the
 * adaptive logo follows the OS colour scheme, which can disagree with Storybook's own mode.
 */
export const brandConfigs = {
  synapcity: {
    title: 'Synapcity',
    url: '/',
    logo: {
      light: '/brand-assets/logo-dark.svg',
      dark: '/brand-assets/logo-on-dark.svg',
    },
  },
} as const;

/**
 * Typography and shape shared by both modes. Inter and Geist Mono are loaded for the manager
 * by manager-head.html; the stacks fall back to platform fonts if that request fails.
 */
export const baseTheme = {
  fontBase: 'Inter, system-ui, sans-serif',
  fontCode: '"Geist Mono", ui-monospace, monospace',
  appBorderRadius: 4,
  inputBorderRadius: 4,
  brandTarget: '_self',
};

export function buildTheme(
  brand: string,
  mode: ResolvedMode,
  configs: Record<string, (typeof brandConfigs)[keyof typeof brandConfigs]>,
  palettes: Record<'light' | 'dark', typeof lightPalette | typeof darkPalette>,
  base: typeof baseTheme,
): ReturnType<typeof create> {
  const config = configs[brand];

  return create({
    base: mode,
    ...base,
    ...palettes[mode],
    brandTitle: config?.title,
    brandUrl: config?.url,
    brandImage: config?.logo[mode],
  });
}

const themeFor = (mode: ResolvedMode) =>
  buildTheme(
    'synapcity',
    mode,
    brandConfigs,
    { light: lightPalette, dark: darkPalette },
    baseTheme,
  );

export const darkDocsTheme = themeFor('dark');
export const lightDocsTheme = themeFor('light');
