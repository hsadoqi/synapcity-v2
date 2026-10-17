import { Switch } from '@synapcity/frontend-ui/core/switch';
import { SettingRow } from '../../../shared';
import { SettingsSelect } from '../../../shared/settings-select/settings-select';
import type { AppearanceSettings } from '../../../types/appearance';

type RowProps<Key extends keyof AppearanceSettings> = {
  value: AppearanceSettings[Key];
  onChange: (value: AppearanceSettings[Key]) => void;
};

type SwitchRowProps = {
  id: string;
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

function SwitchRow({
  id,
  label,
  description,
  value,
  onChange,
}: SwitchRowProps) {
  return (
    <SettingRow id={id} label={label} description={description}>
      <Switch
        id={id}
        aria-describedby={`${id}-description`}
        checked={value}
        onCheckedChange={onChange}
      />
    </SettingRow>
  );
}

export const ShowBordersRow = (props: RowProps<'showBorders'>) => (
  <SwitchRow
    id="borders"
    label="Show component borders"
    description="Give panels and controls a little more definition."
    {...props}
  />
);

export const EnableAnimationsRow = (props: RowProps<'animationsEnabled'>) => (
  <SwitchRow
    id="animations"
    label="Enable animations"
    description="Use gentle transitions as you move around."
    {...props}
  />
);

export const ReducedMotionRow = (props: RowProps<'reducedMotion'>) => (
  <SwitchRow
    id="reduced-motion"
    label="Reduce motion"
    description="Skip sliding and zooming. Fades and colour changes stay. Your device's own reduce-motion setting always applies as well."
    {...props}
  />
);

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
