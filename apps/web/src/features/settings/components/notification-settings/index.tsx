'use client';

import { FieldGroup } from '@synapcity/frontend-ui/components/ui/field';
import { useNotificationSettings } from '../../hooks/use-notification-settings';
import { notificationKinds } from '../../types/notifications';
import { SettingsTabShell } from '../../shared/settings-tabs/settings-tab-shell/settings-tab-shell';
import { NotificationRow } from './notification-row';

export function NotificationSettings() {
  const { notifications, updateNotifications } = useNotificationSettings();
  return (
    <SettingsTabShell
      title="Notifications"
      description="Stay in the loop, without the noise."
    >
      <FieldGroup>
        {notificationKinds.map((kind) => (
          <NotificationRow
            key={kind}
            kind={kind}
            checked={notifications[kind]}
            onChange={(checked) => updateNotifications({ [kind]: checked })}
          />
        ))}
      </FieldGroup>
    </SettingsTabShell>
  );
}
