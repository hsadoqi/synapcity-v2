import { Mode } from '@synapcity/frontend-ui/providers/mode-provider';
import { SettingRow } from '../../../shared/setting-row/setting-row';
import { SettingsSelect } from '../../../shared/settings-select/settings-select';
import { Sun, Moon, Monitor } from 'lucide-react';

export const ThemeModeRow = ({
  value,
  onChange,
}: {
  value: Mode;
  onChange: (value: Mode) => void;
}) => {
  return (
    <SettingRow
      id="appearance"
      label="Color theme"
      description="Choose a theme, or follow your device’s settings."
    >
      <SettingsSelect
        id="appearance"
        value={value}
        onChange={(mode) => onChange(mode)}
        options={[
          { value: 'light', label: 'Light', icon: <Sun /> },
          { value: 'dark', label: 'Dark', icon: <Moon /> },
          {
            value: 'system',
            label: 'System default',
            icon: <Monitor />,
          },
        ]}
      />
    </SettingRow>
  );
};
