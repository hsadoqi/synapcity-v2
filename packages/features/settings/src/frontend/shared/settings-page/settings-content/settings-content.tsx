import type { AccountSync } from '../../../../contracts';
import { SettingsProvider } from '../../../providers/settings-provider';
import { SettingsHeader } from '../settings-header';
import { SettingsTabs } from '../../settings-tabs';
import { SettingsFooter } from '../settings-footer';
import {
  SettingsDraftsProvider,
  UnsavedChangesGuard,
} from '../../settings-drafts';

export function SettingsContent({
  name,
  account,
  notice,
  draftScope,
  accountTab,
}: {
  name?: string | null;
  account?: AccountSync;
  /** Shown under the header, such as why account actions are unavailable. */
  notice?: string;
  /** Host identity scopes this browser tab's unsaved drafts. */
  draftScope?: string;
  /** The host-owned Profile/Auth panel, loaded only when the Account tab opens. */
  accountTab?: () => Promise<React.ComponentType>;
}) {
  return (
    <SettingsProvider name={name} account={account} draftScope={draftScope}>
      {/* Every tab's draft registers here, so leaving the page asks about all
          unsaved tabs, not only the one in view. */}
      <SettingsDraftsProvider>
        {/* As wide as the page shell (max-w-7xl): the side navigation, a tab's
            settings and its preview rail share it. */}
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col py-6 roomy:min-h-0 sm:py-10">
          <SettingsTabs
            accountTab={accountTab}
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
