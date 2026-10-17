'use client';

import { FieldGroup } from '@synapcity/frontend-ui/components/ui/field';
import { Separator } from '@synapcity/frontend-ui/components/ui/separator';
import { SettingsTabShell } from '../../shared/settings-tabs/settings-tab-shell/settings-tab-shell';
import { canCollect, isBlockedBySignals } from '../../shared/privacy-consent';
import { privacyPurposes } from '../../types/data-privacy';
import { PrivacyConsentRow } from './data-privacy-rows';
import { DataPrivacyDisclaimer } from './data-privacy-disclaimer';
import { useDataPrivacySettings } from '../../hooks/use-data-privacy-settings';

export function DataPrivacySettings() {
  const { privacy, signals, setConsent } = useDataPrivacySettings();
  return (
    <SettingsTabShell
      title="Data privacy"
      description="Your space. Your data. Your choice."
    >
      <FieldGroup>
        {privacyPurposes.map((purpose) => (
          <PrivacyConsentRow
            key={purpose}
            purpose={purpose}
            // The switch shows what collectors are allowed, through the same gate.
            checked={canCollect(privacy, purpose, signals)}
            blocked={isBlockedBySignals(purpose, signals)}
            onChange={(granted) => setConsent(purpose, granted)}
          />
        ))}
      </FieldGroup>
      <Separator />
      <DataPrivacyDisclaimer />
    </SettingsTabShell>
  );
}
