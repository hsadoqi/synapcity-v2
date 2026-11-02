import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { SettingsTabShell } from './settings-tab-shell';

const meta = {
  title: 'Features/Settings/Tab shell',
  component: SettingsTabShell,
} satisfies Meta<typeof SettingsTabShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Appearance',
    description: 'Choose how your workspace looks.',
    children: <p>Appearance controls appear here.</p>,
  },
};
