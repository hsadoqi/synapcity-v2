import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { SettingRow } from '../setting-row';
import { SettingsSelect } from './settings-select';

const meta = {
  title: 'Features/Settings/Select',
  render: () => (
    <SettingRow
      id="language"
      label="Language"
      description="The language used by the workspace."
    >
      <SettingsSelect
        id="language"
        value="en"
        onChange={() => {}}
        options={[
          { value: 'en', label: 'English' },
          { value: 'fr', label: 'French' },
        ]}
      />
    </SettingRow>
  ),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
