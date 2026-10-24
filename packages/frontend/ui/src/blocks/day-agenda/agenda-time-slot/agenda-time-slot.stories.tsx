import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { AgendaTimeSlot } from '@synapcity/frontend-ui/blocks/day-agenda/agenda-time-slot';

const meta = {
  title: 'Blocks/Day Agenda/AgendaTimeSlot',
  component: AgendaTimeSlot,
  args: { start: '09:00', label: 'API refactor', tone: 'focus' },
  argTypes: {
    tone: {
      control: 'select',
      options: ['focus', 'meeting', 'break', 'admin'],
    },
  },
  decorators: [
    (Story) => (
      <ul className="w-72 bg-card p-3 text-card-foreground">
        <Story />
      </ul>
    ),
  ],
} satisfies Meta<typeof AgendaTimeSlot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Tones: Story = {
  render: (args) => (
    <>
      <AgendaTimeSlot {...args} tone="focus" label="Focus" />
      <AgendaTimeSlot {...args} tone="meeting" label="Meeting" />
      <AgendaTimeSlot {...args} tone="break" label="Break" />
      <AgendaTimeSlot {...args} tone="admin" label="Admin" />
    </>
  ),
};
