import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { SettingsPageShell } from './settings-page-shell';

const meta = {
  title: 'Features/Settings/Page shell',
  component: SettingsPageShell,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof SettingsPageShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: null },
  render: () => (
    <SettingsPageShell>
      <h1 className="font-heading text-xl font-semibold">Settings</h1>
    </SettingsPageShell>
  ),
};
