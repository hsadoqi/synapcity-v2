'use client';

import { FieldGroup } from '@synapcity/frontend-ui/core/field';
import { Separator } from '@synapcity/frontend-ui/core/separator';
import { SettingsTabShell } from '../shared/settings-tabs/settings-tab-shell';
import { canCollect, isBlockedBySignals } from '@synapcity/domain-preferences';
import {
  choose,
  privacyPurposes,
  type Consent,
} from '@synapcity/domain-preferences';
import { PrivacyConsentRow } from './data-privacy-rows';
import { DataPrivacyAskAgain } from './data-privacy-ask-again';
import { DataPrivacyDisclaimer } from './data-privacy-disclaimer';
import { useGlobalPrivacyControl } from '@synapcity/frontend-preferences';
import { useSettingsDraft } from '../../hooks/use-settings-lifecycle/use-settings-draft';

// Each choice records when it was made, so two records mean the same choice
// when both grant or both refuse.
const sameChoice = (_field: unknown, a: unknown, b: unknown) =>
  (a as Consent).granted === (b as Consent).granted;

export function DataPrivacySettings() {
  const draft = useSettingsDraft('privacy', { same: sameChoice });
  const saved = draft.saved;
  const privacy = draft.draft;
  const change = draft.change;
  const signals = { globalPrivacyControl: useGlobalPrivacyControl() };
  return (
    <SettingsTabShell
      title="Data privacy"
      description="Your space. Your data. Your choice."
      draft={draft}
    >
      {/* What was turned off, from the saved choices: a draft does not answer it. */}
      <DataPrivacyAskAgain privacy={saved} />
      <FieldGroup>
        {privacyPurposes.map((purpose) => (
          <PrivacyConsentRow
            key={purpose}
            purpose={purpose}
            // The switch shows what collectors are allowed, through the same gate.
            checked={canCollect(privacy, purpose, signals)}
            blocked={isBlockedBySignals(purpose, signals)}
            // Every choice records when it was made and which wording it was made under.
            onChange={(granted) =>
              change({ [purpose]: choose(purpose, granted) })
            }
          />
        ))}
      </FieldGroup>
      <Separator />
      <DataPrivacyDisclaimer />
    </SettingsTabShell>
  );
}
