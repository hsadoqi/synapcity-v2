'use client';

import { SettingsContent as SharedSettingsContent } from '@synapcity/features-settings/frontend';

const loadAccountSettings = () =>
  import('./components/account-settings').then(
    (module) => module.AccountSettings,
  );

export function SettingsContent(
  props: Omit<Parameters<typeof SharedSettingsContent>[0], 'accountTab'>,
) {
  return <SharedSettingsContent {...props} accountTab={loadAccountSettings} />;
}
