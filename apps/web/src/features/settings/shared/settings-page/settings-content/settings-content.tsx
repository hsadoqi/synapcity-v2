import type { AccountSync } from '../../../lib/account-sync';
import { SettingsProvider } from '../../../providers/settings-provider/settings-provider';
import { SettingsHeader } from '../settings-header/settings-header';
import { SettingsTabs } from '../../settings-tabs/settings-tabs';
import { SettingsFooter } from '../settings-footer/settings-footer';
import {
  SettingsDraftsProvider,
  UnsavedChangesGuard,
} from '../../settings-drafts';

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
      {/* Every tab's draft registers here, so leaving the page asks about all
          unsaved tabs, not only the one in view. */}
      <SettingsDraftsProvider>
        {/* As wide as the page shell (max-w-7xl): the side navigation, a tab's
            settings and its preview rail share it. */}
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col py-6 roomy:min-h-0 sm:py-10">
          <SettingsTabs
            header={
              <>
                <SettingsHeader />
                {notice && (
                  <p className="text-sm text-muted-foreground">{notice}</p>
                )}
              </>
            }
            footer={<SettingsFooter syncsToAccount={account !== undefined} />}
          />
        </div>
        <UnsavedChangesGuard />
      </SettingsDraftsProvider>
    </SettingsProvider>
  );
}
