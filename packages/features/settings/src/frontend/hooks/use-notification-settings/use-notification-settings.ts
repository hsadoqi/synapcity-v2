'use client';

import { useCallback } from 'react';
import type { NotificationSettingsPatch } from '@synapcity/domain-preferences';
import { useSettings } from '../use-settings';

export function useNotificationSettings() {
  const { settings, updateSettings } = useSettings();
  const updateNotifications = useCallback(
    (patch: NotificationSettingsPatch) => {
      updateSettings({ notifications: patch });
    },
    [updateSettings],
  );
  return { notifications: settings.notifications, updateNotifications };
}
