import z from 'zod';

export const notificationsSchema = z.object({
  email: z.boolean(),
  push: z.boolean(),
  sound: z.boolean(),
});

export type NotificationSettings = z.infer<typeof notificationsSchema>;
export type NotificationSettingsPatch = Partial<NotificationSettings>;

/** Every notification switch, in the order the tab shows them. */
export const notificationKinds = notificationsSchema.keyof().options;
export type NotificationKind = keyof NotificationSettings;

export const notificationsDefaults: NotificationSettings = {
  email: true,
  push: false,
  sound: true,
};
