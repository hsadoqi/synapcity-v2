import { Switch } from '@synapcity/frontend-ui/core/switch';
import type { NotificationKind } from '../../types/notifications';
import { SettingRow } from '../../shared/setting-row/setting-row';

// Keyed by the schema, so a new notification setting does not compile until
// it has a label and a description here. Say what the channel does; whether
// anything is sent yet is said once, in the tab's description.
const notificationCopy: Record<
  NotificationKind,
  { label: string; description: string }
> = {
  email: {
    label: 'Email notifications',
    description: 'Account and security alerts, and occasional product news.',
  },
  push: {
    label: 'Push notifications',
    description:
      'Alerts from your browser, even when Synapcity is not open. Your browser asks for permission first.',
  },
  sound: {
    label: 'Notification sounds',
    description: 'Play a soft sound when a notification arrives.',
  },
};

export const NotificationRow = ({
  kind,
  checked,
  onChange,
  blockedReason,
}: {
  kind: NotificationKind;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Why the browser keeps this off. Shown, and the switch cannot be changed. */
  blockedReason?: string;
}) => {
  const id = `notifications-${kind}`;
  const { label, description } = notificationCopy[kind];
  return (
    <SettingRow
      id={id}
      label={label}
      description={
        blockedReason ? `${description} ${blockedReason}` : description
      }
    >
      <Switch
        id={id}
        aria-describedby={`${id}-description`}
        checked={checked}
        // Read-only rather than disabled, so it can still be focused and its
        // description (which says why) is announced.
        readOnly={blockedReason !== undefined}
        onCheckedChange={(next) => onChange(next)}
      />
    </SettingRow>
  );
};
