import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';

import { AgendaDropdownMenu } from '@synapcity/frontend-ui/blocks/day-agenda/agenda-dropdown-menu';

const meta = {
  title: 'Blocks/Day Agenda/AgendaDropdownMenu',
  component: AgendaDropdownMenu,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof AgendaDropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Open: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'More actions' }),
    );
    const menu = await screen.findByRole('menu');
    // The menu mounts at opacity 0 and fades in; wait for the animation to end.
    await waitFor(() => expect(menu).toBeVisible());
  },
};

export const CustomItems: Story = {
  args: {
    items: [
      { label: 'New time slot', onSelect: fn() },
      { label: 'Import calendar', disabled: true },
      { label: 'Clear day', variant: 'destructive', onSelect: fn() },
    ],
  },
};
