import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { AgendaDateNav } from '@synapcity/frontend-ui/blocks/day-agenda/agenda-date-nav';

const meta = {
  title: 'Blocks/Day Agenda/AgendaDateNav',
  component: AgendaDateNav,
  parameters: { layout: 'centered' },
  args: { date: '2026-10-24', onDateChange: fn() },
  render: function Render(args) {
    const [date, setDate] = useState(args.date);
    return (
      <AgendaDateNav
        {...args}
        date={date}
        onDateChange={(next) => {
          setDate(next);
          args.onDateChange(next);
        }}
      />
    );
  },
} satisfies Meta<typeof AgendaDateNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Next day' }));
    await expect(args.onDateChange).toHaveBeenLastCalledWith('2026-10-25');
    await expect(
      canvas.getByRole('button', { name: /choose a date/i }),
    ).toHaveTextContent('Sun, Oct 25');
  },
};

export const LongFormat: Story = {
  args: {
    locale: 'en-GB',
    format: { weekday: 'long', day: 'numeric', month: 'long' },
  },
};
