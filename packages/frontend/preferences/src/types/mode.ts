import type { ThemeSettings } from '@synapcity/domain-preferences';

/** The saved colour mode; the list lives in the domain theme schema. */
export type Mode = ThemeSettings['mode'];
export type ResolvedMode = Exclude<Mode, 'system'>;
