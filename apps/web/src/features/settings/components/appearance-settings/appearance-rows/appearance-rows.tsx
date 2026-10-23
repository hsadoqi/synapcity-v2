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
  /** The display setting this switch edits; none for one outside the draft. */
  field?: string;
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
  /**
   * Set when another setting already puts this one in force. The switch then
   * shows on, cannot be changed, and the reason replaces the description. The
   * saved value is left alone, so it returns when the other setting changes.
   */
  supersededBy?: string;
};

function SwitchRow({
  id,
  field,
  label,
  description,
  value,
  onChange,
  supersededBy,
}: SwitchRowProps) {
  const superseded = supersededBy !== undefined;
  return (
    <SettingRow
      id={id}
      field={field}
      toggle
      label={label}
      description={supersededBy ?? description}
      disabled={superseded}
    >
      <Switch
        id={id}
        aria-describedby={`${id}-description`}
        checked={superseded || value}
        disabled={superseded}
        onCheckedChange={onChange}
      />
    </SettingRow>
  );
}

export const ShowBordersRow = ({
  highContrast = false,
  ...props
}: RowProps<'showBorders'> & { highContrast?: boolean }) => (
  <SwitchRow
    id="borders"
    field="showBorders"
    label="Show component borders"
    description="Give panels and controls a little more definition."
    supersededBy={
      highContrast ? 'High contrast always shows borders.' : undefined
    }
    {...props}
  />
);

export const EnableAnimationsRow = (props: RowProps<'animationsEnabled'>) => (
  <SwitchRow
    id="animations"
    field="animationsEnabled"
    label="Enable animations"
    description="Use gentle transitions as you move around."
    {...props}
  />
);

export const ReducedMotionRow = ({
  animationsOff = false,
  ...props
}: RowProps<'reducedMotion'> & { animationsOff?: boolean }) => (
  <SwitchRow
    id="reduced-motion"
    field="reducedMotion"
    label="Reduce motion"
    description="Skip sliding and zooming. Fades and colour changes stay. Your device's own reduce-motion setting always applies as well."
    supersededBy={
      animationsOff
        ? 'Animations are off, so nothing slides or zooms.'
        : undefined
    }
    {...props}
  />
);

export const AllDevicesRow = (props: {
  value: boolean;
  onChange: (value: boolean) => void;
}) => (
  <SwitchRow
    id="all-devices"
    label="Use on all my devices"
    description="Apply these display settings wherever you sign in. Turn off to give each device its own again."
    {...props}
  />
);

export const ContrastModeRow = ({
  value,
  onChange,
}: RowProps<'contrastMode'>) => {
  return (
    <SettingRow
      id="contrast"
      field="contrastMode"
      label="Contrast"
      description="Strengthen or soften the lines and secondary text."
    >
      <SettingsSelect<AppearanceSettings['contrastMode']>
        id="contrast"
        value={value}
        onChange={onChange}
        options={[
          { value: 'low', label: 'Low' },
          { value: 'none', label: 'Standard' },
          { value: 'high', label: 'High' },
        ]}
      />
    </SettingRow>
  );
};
