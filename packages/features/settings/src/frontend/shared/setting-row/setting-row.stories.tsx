import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Input } from '@synapcity/frontend-ui/core/input';

import { SettingRow } from './setting-row';

const meta = {
  title: 'Features/Settings/Setting row',
  render: () => (
    <SettingRow
      id="display-name"
      label="Display name"
      description="The name shown on your account."
    >
      <Input id="display-name" defaultValue="Ada Lovelace" />
    </SettingRow>
  ),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
