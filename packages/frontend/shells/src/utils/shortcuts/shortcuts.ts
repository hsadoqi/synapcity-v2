import type { KeyboardShortcut } from '@synapcity/frontend-ui/hooks/use-keyboard-shortcut';

/**
 * The shell's window-level shortcuts. Each has one owner that listens for it
 * and one control that advertises it through `aria-keyshortcuts`.
 */

/** Opens or folds the sidebar. Owned by SidebarShell; advertised by the header's sidebar toggle. */
export const SIDEBAR_SHORTCUT: KeyboardShortcut = { key: 'b', mod: true };

/** Opens or closes the command palette. Owned by CommandPalette. */
export const COMMAND_PALETTE_SHORTCUT: KeyboardShortcut = {
  key: 'k',
  mod: true,
};

/** Closes the unlocked global panel. Owned by GlobalPanelShell. */
export const CLOSE_PANEL_SHORTCUT: KeyboardShortcut = { key: 'Escape' };
