import type { Mode, ResolvedMode } from '../providers/mode-provider';

export const isMode = (value: unknown): value is Mode =>
  value === 'light' || value === 'dark' || value === 'system';

export const isResolvedMode = (value: unknown): value is ResolvedMode =>
  value === 'light' || value === 'dark';

export const resolveMode = (mode: Mode | undefined): ResolvedMode => {
  if (mode === 'light' || mode === 'dark') return mode;
  return resolveSystemMode();
};

/** The operating system's preference. The server cannot know it, so it is light there. */
export const resolveSystemMode = (): ResolvedMode => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};
