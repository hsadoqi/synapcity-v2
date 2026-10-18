import { Switch } from '@synapcity/frontend-ui/core/switch';
import type { PrivacyPurpose } from '../../types/data-privacy';
import { SettingRow } from '../../shared/setting-row/setting-row';

// Say what each purpose collects and who receives it, matching the privacy
// notice at /privacy. Changing what either says means raising that purpose's
// number in PRIVACY_POLICY_VERSIONS, so people are asked again.
export const purposeCopy: Record<
  PrivacyPurpose,
  { label: string; description: string }
> = {
  analytics: {
    label: 'Activity tracking',
    description:
      'Record which pages and features you use, to help decide what to improve. Off by default.',
  },
  errorReports: {
    label: 'Error reports',
    description:
      'When something breaks, send the error to Sentry, our error-monitoring service, so it can be fixed. Off by default.',
  },
  sharing: {
    label: 'Data sharing with third parties',
    description:
      'Allow usage data to be shared with external partners. Off by default.',
  },
};

export const PrivacyConsentRow = ({
  purpose,
  checked,
  blocked,
  onChange,
}: {
  purpose: PrivacyPurpose;
  /** Whether collection is allowed: the saved choice, unless `blocked`. */
  checked: boolean;
  /** A browser signal overrides the saved choice: shown, not changeable. */
  blocked: boolean;
  onChange: (granted: boolean) => void;
}) => {
  const id = `privacy-${purpose}`;
  const { label, description } = purposeCopy[purpose];
  return (
    <SettingRow
      id={id}
      toggle
      label={label}
      description={
        blocked
          ? `${description} Your browser sends Global Privacy Control, so this stays off.`
          : description
      }
    >
      <Switch
        id={id}
        aria-describedby={`${id}-description`}
        checked={checked}
        // Read-only rather than disabled, so it can still be focused and its
        // description (which says why) is announced.
        readOnly={blocked}
        onCheckedChange={(granted) => onChange(granted)}
      />
    </SettingRow>
  );
};
