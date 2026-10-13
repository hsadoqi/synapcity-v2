import type { Mode, ResolvedMode } from '../providers/mode-provider';

export const isMode = (value: unknown): value is Mode =>
  value === 'light' || value === 'dark' || value === 'system';

export const isResolvedMode = (value: unknown): value is ResolvedMode =>
  value === 'light' || value === 'dark';

export const resolveMode = (mode: Mode | undefined): ResolvedMode => {
  if (mode === 'light' || mode === 'dark') return mode;
  return resolveSystemMode(mode);
};

export const resolveSystemMode = (mode: Mode | undefined): ResolvedMode => {
  if (typeof window === 'undefined') return 'light';
  if (typeof window !== 'undefined') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    if (isDark) return 'dark';
    if (isLight) return 'light';
  }
  return 'light';
};
