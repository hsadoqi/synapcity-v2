import { SettingRow } from '../../../shared/setting-row/setting-row';
import { SettingsSelect } from '../../../shared/settings-select/settings-select';
import {
  bodyFonts,
  codeFonts,
  fontLabel,
  headingFonts,
  type FontChoice,
  type FontRole,
} from '@synapcity/domain-preferences';
import { FontPreview } from './font-preview';

type FontRowProps<T extends FontChoice> = {
  value: T;
  onChange: (value: T) => void;
};

function FontPreferenceRow<T extends FontChoice>({
  role,
  id,
  label,
  description,
  sample,
  fonts,
  value,
  onChange,
}: FontRowProps<T> & {
  role: FontRole;
  id: string;
  label: string;
  description: string;
  sample: string;
  fonts: readonly T[];
}) {
  // The choice first, then what it looks like: the sample sits under the select
  // it answers to, so screen readers and narrow layouts meet them in that order.
  return (
    // The same cap as SettingRow, so the sample lines up with the row above it.
    <div className="flex max-w-3xl flex-col gap-3">
      <SettingRow
        id={id}
        field={`${role}Font`}
        label={label}
        description={description}
      >
        <SettingsSelect<T>
          id={id}
          value={value}
          onChange={onChange}
          options={fonts.map((font) => ({
            value: font,
            label: fontLabel(role, font),
          }))}
        />
      </SettingRow>
      <FontPreview role={role} font={value}>
        {sample}
      </FontPreview>
    </div>
  );
}

export const HeadingFontRow = (
  props: FontRowProps<(typeof headingFonts)[number]>,
) => (
  <FontPreferenceRow
    {...props}
    role="heading"
    id="heading-font"
    label="Heading font"
    description="Used for titles and section headings."
    sample="Make space for the next idea."
    fonts={headingFonts}
  />
);

export const BodyFontRow = (
  props: FontRowProps<(typeof bodyFonts)[number]>,
) => (
  <FontPreferenceRow
    {...props}
    role="body"
    id="body-font"
    label="Body font"
    description="Used for reading text, labels and controls."
    sample="A little room to think. Collect your ideas and connect the dots."
    fonts={bodyFonts}
  />
);

export const CodeFontRow = (
  props: FontRowProps<(typeof codeFonts)[number]>,
) => (
  <FontPreferenceRow
    {...props}
    role="code"
    id="code-font"
    label="Monospace font"
    description="Used for code and keyboard shortcuts."
    sample="const idea = connect(notes);"
    fonts={codeFonts}
  />
);
