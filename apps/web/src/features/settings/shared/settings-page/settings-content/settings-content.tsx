import type { AccountSync } from '../../../lib/account-sync';
import { SettingsProvider } from '../../../providers/settings-provider/settings-provider';
import { SettingsHeader } from '../settings-header/settings-header';
import { SettingsTabs } from '../../settings-tabs/settings-tabs';
import { SettingsFooter } from '../settings-footer/settings-footer';

export function SettingsContent({
  name,
  account,
  notice,
}: {
  name?: string | null;
  account?: AccountSync;
  /** Shown under the header, such as why account actions are unavailable. */
  notice?: string;
}) {
  return (
    <SettingsProvider name={name} account={account}>
      <div className="flex min-h-0 w-full flex-1 flex-col gap-8 px-5 py-10">
        <SettingsHeader />
        {notice && <p className="text-sm text-muted-foreground">{notice}</p>}
        <SettingsTabs />
        <SettingsFooter />
      </div>
    </SettingsProvider>
  );
}
