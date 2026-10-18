'use client';

import { FieldGroup } from '@synapcity/frontend-ui/core/field';
import {
  useNotificationPermission,
  type NotificationPermissionState,
} from '../../hooks/use-notification-permission';
import { useNotificationSettings } from '../../hooks/use-notification-settings';
import {
  notificationKinds,
  type NotificationKind,
} from '../../types/notifications';
import { SettingsTabShell } from '../../shared/settings-tabs/settings-tab-shell/settings-tab-shell';
import { NotificationRow } from './notification-row';

const pushBlockedReason: Partial<Record<NotificationPermissionState, string>> =
  {
    denied:
      'Notifications are blocked for this site in your browser settings, so this stays off.',
    unsupported: 'This browser cannot show notifications, so this stays off.',
  };

export function NotificationSettings() {
  const { notifications, updateNotifications } = useNotificationSettings();
  const { permission, requestPermission } = useNotificationPermission();

  // A saved "on" means nothing without the browser's permission, so push
  // shows on only when both agree, and is saved on only once permission is given.
  const changePush = async (checked: boolean) => {
    if (!checked) return updateNotifications({ push: false });
    const granted =
      permission === 'granted' || (await requestPermission()) === 'granted';
    if (granted) updateNotifications({ push: true });
  };

  const rowProps = (kind: NotificationKind) =>
    kind === 'push'
      ? {
          checked: notifications.push && permission === 'granted',
          onChange: changePush,
          blockedReason: pushBlockedReason[permission],
        }
      : {
          checked: notifications[kind],
          onChange: (checked: boolean) =>
            updateNotifications({ [kind]: checked }),
        };

  return (
    <SettingsTabShell
      title="Notifications"
      description="Choose how Synapcity reaches you. Nothing is sent yet; your choices are saved for when it is."
    >
      <FieldGroup>
        {notificationKinds.map((kind) => (
          <NotificationRow key={kind} kind={kind} {...rowProps(kind)} />
        ))}
      </FieldGroup>
    </SettingsTabShell>
  );
}
