import { Switch } from '@synapcity/frontend-ui/core/switch';
import { SettingRow } from '../../shared';
import { SettingsSelect } from '../../shared/settings-select/settings-select';
import type { AppearanceSettings } from '../../types/appearance';

type RowProps<Key extends keyof AppearanceSettings> = {
  value: AppearanceSettings[Key];
  onChange: (value: AppearanceSettings[Key]) => void;
};

export const ShowBordersRow = ({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) => {
  return (
    <SettingRow
      id="borders"
      label="Show component borders"
      description="Give panels and controls a little more definition."
    >
      <Switch
        id="borders"
        aria-describedby="borders-description"
        checked={value}
        onCheckedChange={onChange}
      />
    </SettingRow>
  );
};

export const EnableAnimationsRow = ({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) => {
  return (
    <SettingRow
      id="animations"
      label="Enable animations"
      description="Use gentle transitions as you move around."
    >
      <Switch
        id="animations"
        aria-describedby="animations-description"
        checked={value}
        onCheckedChange={onChange}
      />
    </SettingRow>
  );
};

export const ReducedMotionRow = ({
  value,
  onChange,
}: RowProps<'reducedMotion'>) => {
  return (
    <SettingRow
      id="reduced-motion"
      label="Reduce motion"
      description="Skip sliding and zooming. Fades and colour changes stay."
    >
      <Switch
        id="reduced-motion"
        aria-describedby="reduced-motion-description"
        checked={value}
        onCheckedChange={onChange}
      />
    </SettingRow>
  );
};

export const FontSizeRow = ({ value, onChange }: RowProps<'fontSize'>) => {
  return (
    <SettingRow
      id="font-size"
      label="Text size"
      description="Make text across the app smaller or larger."
    >
      <SettingsSelect<AppearanceSettings['fontSize']>
        id="font-size"
        value={value}
        onChange={onChange}
        options={[
          { value: 'small', label: 'Small' },
          { value: 'medium', label: 'Medium' },
          { value: 'large', label: 'Large' },
        ]}
      />
    </SettingRow>
  );
};

export const ContrastModeRow = ({
  value,
  onChange,
}: RowProps<'contrastMode'>) => {
  return (
    <SettingRow
      id="contrast"
      label="Contrast"
      description="Strengthen or soften the lines and secondary text."
    >
      <SettingsSelect<AppearanceSettings['contrastMode']>
        id="contrast"
        value={value}
        onChange={onChange}
        options={[
          { value: 'none', label: 'Standard' },
          { value: 'high', label: 'High' },
          { value: 'low', label: 'Low' },
        ]}
      />
    </SettingRow>
  );
};
