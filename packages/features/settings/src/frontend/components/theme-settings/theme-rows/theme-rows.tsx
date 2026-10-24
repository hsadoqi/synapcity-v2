import { Button } from '@synapcity/frontend-ui/core/button';
import { Mode } from '@synapcity/frontend-preferences';
import { SettingRow } from '../../../shared/setting-row/setting-row';
import { SettingsSelect } from '../../../shared/settings-select/settings-select';
import { previewTextScaleStyle } from '@synapcity/frontend-preferences';
import {
  textSizeRange,
  type ThemeSettings,
} from '@synapcity/domain-preferences';
import { PreviewFigure } from '../preview-figure';
import { Sun, Moon, Monitor, Minus, Plus } from 'lucide-react';

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
      field="mode"
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
    field="radius"
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
    field="density"
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

/**
 * A stepper rather than a select: the size is a percentage, and a step at a time
 * is how people judge it against the preview. The value is an <output>, so the
 * row's label names it and each step is announced. A button at its limit stays
 * focusable, so keyboard focus is not dropped on the page.
 */
export const TextSizeRow = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) => {
  const { min, max, step } = textSizeRange;
  // The stepper first, then the sample, as the font rows do. The sample carries
  // the draft size on itself only (preferences.css scales any element with
  // data-text-size), so it shows the choice while the page keeps the saved size.
  return (
    // The same cap as SettingRow, so the sample lines up with the row above it.
    <div className="flex max-w-3xl flex-col gap-3">
      <SettingRow
        id="text-size"
        field="textSize"
        label="Text size"
        description="Make text across the app smaller or larger. 100% is the standard size."
      >
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Smaller text"
            disabled={value <= min}
            focusableWhenDisabled
            onClick={() => onChange(Math.max(min, value - step))}
          >
            <Minus />
          </Button>
          <output
            id="text-size"
            aria-describedby="text-size-description"
            className="w-12 text-center text-sm tabular-nums"
          >
            {value}%
          </output>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Larger text"
            disabled={value >= max}
            focusableWhenDisabled
            onClick={() => onChange(Math.min(max, value + step))}
          >
            <Plus />
          </Button>
        </div>
      </SettingRow>
      <PreviewFigure
        label="Text size preview"
        sampleProps={{
          'data-text-size': String(value),
          style: previewTextScaleStyle({ textSize: value }),
        }}
      >
        <p className="font-heading text-xl font-semibold tracking-tight text-foreground">
          Notes from the week
        </p>
        <p className="font-body text-base text-foreground">
          Headings, body text and captions grow and shrink together.
        </p>
        <p className="text-xs text-muted-foreground">Edited two hours ago</p>
      </PreviewFigure>
    </div>
  );
};
