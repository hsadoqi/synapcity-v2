import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import { AgendaSettingsView } from '@synapcity/frontend-ui/blocks/day-agenda/agenda-settings-view';

const meta = {
  title: 'Blocks/Day Agenda/AgendaSettingsView',
  component: AgendaSettingsView,
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
} satisfies Meta<typeof AgendaSettingsView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Placeholder: Story = {};

export const WithContent: Story = {
  args: { children: <p>Week starts on Monday.</p> },
};
