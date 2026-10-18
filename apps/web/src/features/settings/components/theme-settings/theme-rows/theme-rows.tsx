import { Mode } from '@synapcity/frontend-ui/providers/mode-provider';
import { SettingRow } from '../../../shared/setting-row/setting-row';
import { SettingsSelect } from '../../../shared/settings-select/settings-select';
import { Sun, Moon, Monitor } from 'lucide-react';

// Each says what the chosen option does, beside the select that chooses it, so it
// reads true for an unsaved choice as well as a saved one. Whole sentences, not
// "always ${mode}": a translation can reorder or inflect the mode name.
const descriptions: Record<Mode, string> = {
  system: 'Follows your device, switching between light and dark with it.',
  light: 'Always light, whatever your device is set to.',
  dark: 'Always dark, whatever your device is set to.',
};

export const ThemeModeRow = ({
  value,
  onChange,
}: {
  value: Mode;
  onChange: (value: Mode) => void;
}) => {
  return (
    <SettingRow
      id="color-theme"
      label="Color theme"
      description={descriptions[value]}
    >
      <SettingsSelect
        id="color-theme"
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
