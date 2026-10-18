import { Mode } from '@synapcity/frontend-ui/providers/mode-provider';
import { SettingRow } from '../../../shared/setting-row/setting-row';
import { SettingsSelect } from '../../../shared/settings-select/settings-select';
import type { ThemeSettings } from '../../../types/theme';
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

type Radius = ThemeSettings['radius'];
type Density = ThemeSettings['density'];

// Same shape as the mode descriptions above: whole sentences, one per option, so the line
// beside the select is true for an unsaved choice. A record keyed by the preset names, so a
// preset added to the schema does not compile until it has a label and a sentence.
const radii: Record<Radius, { label: string; description: string }> = {
  sharp: { label: 'Sharp', description: 'Square corners everywhere.' },
  default: {
    label: 'Default',
    description: 'The standard, lightly softened corners.',
  },
  soft: {
    label: 'Soft',
    description: 'Softer corners on buttons, panels and fields.',
  },
  rounded: {
    label: 'Rounded',
    description: 'Generously rounded corners throughout.',
  },
};

const densities: Record<Density, { label: string; description: string }> = {
  compact: {
    label: 'Compact',
    description:
      'Tighter spacing, except on touch screens where controls stay easy to tap.',
  },
  comfortable: {
    label: 'Comfortable',
    description: 'The standard spacing.',
  },
  spacious: {
    label: 'Spacious',
    description: 'Extra room around controls and content.',
  },
};

const options = <T extends string>(
  presets: Record<T, { label: string }>,
): { value: T; label: string }[] =>
  (Object.keys(presets) as T[]).map((value) => ({
    value,
    label: presets[value].label,
  }));

export const RadiusRow = ({
  value,
  onChange,
}: {
  value: Radius;
  onChange: (value: Radius) => void;
}) => (
  <SettingRow
    id="corner-radius"
    label="Corner radius"
    description={radii[value].description}
  >
    <SettingsSelect<Radius>
      id="corner-radius"
      value={value}
      onChange={onChange}
      options={options(radii)}
    />
  </SettingRow>
);

export const DensityRow = ({
  value,
  onChange,
}: {
  value: Density;
  onChange: (value: Density) => void;
}) => (
  <SettingRow
    id="density"
    label="Density"
    description={densities[value].description}
  >
    <SettingsSelect<Density>
      id="density"
      value={value}
      onChange={onChange}
      options={options(densities)}
    />
  </SettingRow>
);
