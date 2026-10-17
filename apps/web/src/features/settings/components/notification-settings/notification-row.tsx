import { Switch } from '@synapcity/frontend-ui/core/switch';
import type { NotificationKind } from '../../types/notifications';
import { SettingRow } from '../../shared/setting-row/setting-row';

// Keyed by the schema, so a new notification setting does not compile until
// it has a label and a description here.
const notificationCopy: Record<
  NotificationKind,
  { label: string; description: string }
> = {
  email: {
    label: 'Email notifications',
    description: 'Keep your preference for occasional updates by email.',
  },
  push: {
    label: 'Push notifications',
    description:
      'Allow browser notifications when notification delivery is connected.',
  },
  sound: {
    label: 'Notification sounds',
    description:
      'Play a soft sound for new notifications when notification delivery is connected.',
  },
};

export const NotificationRow = ({
  kind,
  checked,
  onChange,
}: {
  kind: NotificationKind;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => {
  const id = `notifications-${kind}`;
  const { label, description } = notificationCopy[kind];
  return (
    <SettingRow id={id} label={label} description={description}>
      <Switch
        id={id}
        aria-describedby={`${id}-description`}
        checked={checked}
        onCheckedChange={(next) => onChange(next)}
      />
    </SettingRow>
  );
};
