import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import { SettingsView } from '@synapcity/frontend-ui/blocks/settings-view';

const meta = {
  title: 'Blocks/SettingsView',
  component: SettingsView,
  args: {
    title: 'Settings',
    description: 'Manage your agenda preferences',
    onDone: fn(),
  },
  decorators: [
    (Story) => (
      <div className="flex h-80 w-2xs flex-col rounded-xl bg-card p-3 text-card-foreground">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SettingsView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Placeholder: Story = {};

export const WithContent: Story = {
  args: { children: <p>Week starts on Monday.</p> },
};
