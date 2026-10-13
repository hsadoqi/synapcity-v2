import { create } from 'storybook/theming';

export type ThemeMode = 'light' | 'dark';

export function buildTheme(
  brand: string,
  mode: ThemeMode,
  configs: Record<string, (typeof brandConfigs)[keyof typeof brandConfigs]>,
  palettes: Record<string, typeof lightPalette | typeof darkPalette>,
  base: Record<string, string | number | boolean>,
): ReturnType<typeof create> {
  const config = configs[brand];
  const palette = mode === 'light' ? palettes.light : palettes.dark;

  return create({
    base: mode,
    brandTitle: config?.title,
    brandUrl: config?.url,
    brandImage: config?.logo?.[mode] ?? config?.logo?.dark,
    colorPrimary: config?.accent,
    colorSecondary: config?.accent,
    ...base,
    ...palette,
  });
}
/**
 * Default brand configurations
 */
export const brandConfigs = {
  synapcity: {
    title: 'Synapcity',
    url: '#',
    logo: {
      light: '/brand-logo-dark.svg',
      dark: '/brand-logo-light.svg',
    },
    accent: '#6b7bff',
  },
} as const;

/**
 * Base theme values shared across all modes
 */
export const baseTheme = {
  fontBase: '"Geist Variable", system-ui, sans-serif',
  fontCode: '"Geist Mono Variable", monospace',
  fontUi: '"Geist Variable", system-ui, sans-serif',
  appBorderRadius: 4,
  inputBorderRadius: 4,
  brandTarget: '_self' as const,
};

/**
 * Light mode color palette
 */
export const lightPalette = {
  appBg: '#f5f5f4',
  appContentBg: '#ffffff',
  appBorderColor: '#e2e8f0',
  textColor: '#0a0a0a',
  textInverseColor: '#ffffff',
  textMutedColor: '#64748b',
  barTextColor: '#0a0a0a',
  barSelectedColor: '#0a0a0a',
  barBg: '#ffffff',
  inputBg: '#ffffff',
  inputBorder: '#e2e8f0',
  inputTextColor: '#0a0a0a',
  sidebarBg: '#ffffff',
  sidebarTextColor: '#0a0a0a',
  sidebarSelectedColor: '#0a0a0a',
  sidebarBorderColor: '#e2e8f0',
  brandTitleColor: '#0a0a0a',
  brandUrlColor: '#0a0a0a',
};

/**
 * Dark mode color palette
 */
export const darkPalette = {
  appBg: '#0b1220',
  appContentBg: '#111827',
  appBorderColor: '#1f2937',
  textColor: '#f9fafb',
  textInverseColor: '#0a0a0a',
  textMutedColor: '#9ca3af',
  barTextColor: '#f9fafb',
  barSelectedColor: '#f9fafb',
  barBg: '#111827',
  inputBg: '#1f2937',
  inputBorder: '#374151',
  inputTextColor: '#f9fafb',
  sidebarBg: '#111827',
  sidebarTextColor: '#f9fafb',
  sidebarSelectedColor: '#f9fafb',
  sidebarBorderColor: '#1f2937',
  brandTitleColor: '#f9fafb',
  brandUrlColor: '#f9fafb',
};

export const defaultTheme = buildTheme(
  'synapcity',
  'dark',
  brandConfigs,
  { light: lightPalette, dark: darkPalette },
  baseTheme,
);
