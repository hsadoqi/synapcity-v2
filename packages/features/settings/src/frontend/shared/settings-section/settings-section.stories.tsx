import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { SettingsSection } from './settings-section';

const meta = {
  title: 'Features/Settings/Section',
  component: SettingsSection,
} satisfies Meta<typeof SettingsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Regional preferences',
    children: <p>Language and timezone choices.</p>,
  },
};
