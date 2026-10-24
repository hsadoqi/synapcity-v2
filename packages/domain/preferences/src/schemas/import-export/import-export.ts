import type { z } from 'zod';
import { settingsSchema, type SettingsPatch } from '../settings';

// Transfers include browser preferences, never account credentials.
export const transferSchema = settingsSchema.pick({
  regional: true,
  appearance: true,
  notifications: true,
  privacy: true,
  theme: true,
});

export type TransferSettings = z.infer<typeof transferSchema>;
export type TransferSettingsPatch = Pick<SettingsPatch, keyof TransferSettings>;
