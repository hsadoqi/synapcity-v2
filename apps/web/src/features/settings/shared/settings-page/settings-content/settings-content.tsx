import { SettingsProvider } from '../../../providers/settings-provider';
import { SettingsHeader } from '../settings-header/settings-header';
import { SettingsTabs } from '../../settings-tabs/settings-tabs';
import { SettingsFooter } from '../settings-footer/settings-footer';

export function SettingsContent({ name }: { name?: string | null }) {
  return (
    <SettingsProvider name={name}>
      <div className="flex-1 flex w-full flex-col gap-8 px-5 py-10">
        <SettingsHeader />
        <SettingsTabs />
        <SettingsFooter />
      </div>
    </SettingsProvider>
  );
}
