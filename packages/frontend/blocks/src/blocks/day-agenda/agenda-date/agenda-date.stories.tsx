import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { AgendaDate } from '@/blocks/day-agenda/agenda-date';

const meta = {
  title: 'Blocks/Day Agenda/AgendaDate',
  component: AgendaDate,
  args: { date: '2026-10-24' },
} satisfies Meta<typeof AgendaDate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongFormat: Story = {
  args: {
    locale: 'en-GB',
    format: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  },
};

export const Invalid: Story = {
  args: { date: 'someday' },
};
