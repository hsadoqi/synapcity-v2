export type Mode = 'light' | 'dark' | 'system';
export type ResolvedMode = Exclude<Mode, 'system'>;
