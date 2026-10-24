import type { TransferSettingsPatch } from '@synapcity/domain-preferences';

/** What the import and export controls report back. Settings screen only (moves with features-settings in M6.4). */
export type TransferFeedback = {
  type: 'success' | 'error';
  message: string;
};

export type ImportResult =
  | { type: 'success'; message: string; patch: TransferSettingsPatch }
  | { type: 'error'; message: string };
