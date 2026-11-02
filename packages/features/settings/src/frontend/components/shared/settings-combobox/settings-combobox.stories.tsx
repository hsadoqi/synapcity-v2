import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { SettingRow } from '../setting-row';
import { SettingsCombobox } from './settings-combobox';

const meta = {
  title: 'Features/Settings/Searchable select',
  render: () => (
    <SettingRow
      id="timezone"
      label="Timezone"
      description="Used when displaying dates and times."
    >
      <SettingsCombobox
        id="timezone"
        value="Europe/London"
        onChange={() => {}}
        options={[
          { value: 'Europe/London', label: 'London' },
          { value: 'Asia/Tokyo', label: 'Tokyo' },
          { value: 'America/New_York', label: 'New York' },
        ]}
      />
    </SettingRow>
  ),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
