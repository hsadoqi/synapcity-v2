import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { AgendaDateNav } from '@synapcity/frontend-ui/blocks/day-agenda/agenda-date-nav';

const meta = {
  title: 'Blocks/Day Agenda/AgendaDateNav',
  component: AgendaDateNav,
  parameters: { layout: 'centered' },
  args: { date: '2026-10-24', onDateChange: fn() },
} satisfies Meta<typeof AgendaDateNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Next day' }));
    await expect(args.onDateChange).toHaveBeenLastCalledWith('2026-10-25');
    // The parent owns `date`: the nav asks for the next day and the date stays put until told.
    await expect(
      canvas.getByRole('button', { name: /choose a date/i }),
    ).toHaveTextContent('Sat, Oct 24');
  },
};

export const LongFormat: Story = {
  args: {
    locale: 'en-GB',
    format: { weekday: 'long', day: 'numeric', month: 'long' },
  },
};
