import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Button } from '@synapcity/frontend-ui/core/button';
import { AgendaActionsMenu } from '@synapcity/frontend-ui/blocks/day-agenda/agenda-actions-menu';
import { CalendarPlus, Pin, Share2 } from 'lucide-react';
import { expect, within } from 'storybook/test';

const meta = {
  title: 'Blocks/Day Agenda/AgendaActionsMenu',
  component: AgendaActionsMenu,
  args: { title: 'Settings', description: 'Manage your agenda preferences' },
  argTypes: { trigger: { control: false } },
  decorators: [
    // The toolbar answers to its `@container/agenda` ancestor's width.
    (Story) => (
      <div className="@container/agenda flex w-lg justify-end rounded-xl bg-card p-3">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AgendaActionsMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomTrigger: Story = {
  args: {
    trigger: (
      <Button size="sm" variant="outline">
        Configure
      </Button>
    ),
  },
};

const toolbarItems = [
  { label: 'New time slot', icon: <CalendarPlus /> },
  { label: 'Pin', icon: <Pin /> },
  { label: 'Share', icon: <Share2 /> },
  { label: 'Help' },
];

const visible = (element: Element | null) =>
  element !== null && getComputedStyle(element).display !== 'none';

/** 32rem wide, past `@sm`: icon items are buttons, "More actions" holds Help. */
export const WideToolbar: Story = {
  args: { menuItems: toolbarItems },
  play: async ({ canvasElement }) => {
    const pin = within(canvasElement).getByRole('button', { name: 'Pin' });
    await expect(visible(pin)).toBe(true);
    await expect(
      visible(canvasElement.querySelector('[data-slot="agenda-menu-compact"]')),
    ).toBe(false);
    await expect(
      visible(canvasElement.querySelector('[data-slot="agenda-menu-wide"]')),
    ).toBe(true);
  },
};

/** 18rem wide, under `@sm`: only settings and "More actions", which holds everything. */
export const CompactToolbar: Story = {
  args: { menuItems: toolbarItems },
  decorators: [
    (Story) => (
      <div className="@container/agenda flex w-2xs justify-end rounded-xl bg-card p-3">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const pin = within(canvasElement).queryByRole('button', { name: 'Pin' });
    await expect(pin).toBeNull();
    await expect(
      visible(canvasElement.querySelector('[data-slot="agenda-menu-compact"]')),
    ).toBe(true);
  },
};
