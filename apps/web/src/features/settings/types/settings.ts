import z from 'zod';

import { appearanceSchema, appearanceDefaults } from './appearance';
import { notificationsSchema, notificationsDefaults } from './notifications';
import { dataPrivacySchema, dataPrivacyDefaults } from './data-privacy';
import { themeSchema, themeDefaults } from './theme';
import { regionalDefaults, regionalSchema } from './regional';

export const settingsSchema = z.object({
  regional: regionalSchema.clone().optional().default(regionalDefaults),
  appearance: appearanceSchema.clone().optional().default(appearanceDefaults),
  notifications: notificationsSchema
    .clone()
    .optional()
    .default(notificationsDefaults),
  privacy: dataPrivacySchema.clone().optional().default(dataPrivacyDefaults),
  theme: themeSchema.clone().optional().default(themeDefaults),
});

export type Settings = z.infer<typeof settingsSchema>;
export type SettingsPatch = {
  [Section in keyof Settings]?: Partial<Settings[Section]>;
};

export const settingsDefaults: Settings = {
  appearance: appearanceDefaults,
  notifications: notificationsDefaults,
  privacy: dataPrivacyDefaults,
  theme: themeDefaults,
  regional: regionalDefaults,
};
