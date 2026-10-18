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
      {/* One reading column. The page shell already pads the sides and caps at
          max-w-7xl; at that width a row's label and its control sat ~1000px
          apart. Header, tabs, card and footer share this column so they align. */}
      <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col gap-6 py-6 sm:gap-8 sm:py-10">
        <SettingsHeader />
        {notice && <p className="text-sm text-muted-foreground">{notice}</p>}
        <SettingsTabs />
        <SettingsFooter />
      </div>
    </SettingsProvider>
  );
}
