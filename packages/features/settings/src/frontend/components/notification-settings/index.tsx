'use client';

import { FieldGroup } from '@synapcity/frontend-ui/core/field';
import {
  useNotificationPermission,
  type NotificationPermissionState,
} from '../../hooks/use-notification-permission';
import { useSettingsDraft } from '../../hooks/use-settings-draft';
import {
  notificationKinds,
  type NotificationKind,
} from '@synapcity/domain-preferences';
import { SettingsTabShell } from '../../shared/settings-tabs/settings-tab-shell';
import { NotificationRow } from './notification-row';

const pushBlockedReason: Partial<Record<NotificationPermissionState, string>> =
  {
    denied:
      'Notifications are blocked for this site in your browser settings, so this stays off.',
    unsupported: 'This browser cannot show notifications, so this stays off.',
  };

export function NotificationSettings() {
  const draft = useSettingsDraft('notifications');
  const notifications = draft.draft;
  const updateNotifications = draft.change;
  const { permission, requestPermission } = useNotificationPermission();

  // A saved "on" means nothing without the browser's permission, so push
  // shows on only when both agree, and is drafted on only once permission is
  // given. The permission prompt itself is the browser's, and answers at once.
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
      draft={draft}
    >
      <FieldGroup>
        {notificationKinds.map((kind) => (
          <NotificationRow key={kind} kind={kind} {...rowProps(kind)} />
        ))}
      </FieldGroup>
    </SettingsTabShell>
  );
}
