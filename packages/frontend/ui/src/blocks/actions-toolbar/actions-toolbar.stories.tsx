import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CalendarPlus, Pin, Share2 } from 'lucide-react';
import { expect, fn, screen, userEvent, within } from 'storybook/test';

import { ActionsToolbar } from '@synapcity/frontend-ui/blocks/actions-toolbar';

const actions = [
  { label: 'New item', icon: <CalendarPlus />, onSelect: fn() },
  { label: 'Pin', icon: <Pin />, onSelect: fn() },
  { label: 'Share', icon: <Share2 />, onSelect: fn() },
  { label: 'Help', onSelect: fn() },
];

const meta = {
  title: 'Blocks/ActionsToolbar',
  component: ActionsToolbar,
  args: {
    actions,
    settings: { title: 'Settings', description: 'Preferences for this panel' },
  },
  argTypes: { moreTrigger: { control: false } },
  decorators: [
    (Story) => (
      <div className="flex w-lg rounded-xl bg-card p-3 text-card-foreground">
        <Story />
      </div>
    ),
  ],
  render: (args) => <ActionsToolbar {...args} className="flex-1" />,
} satisfies Meta<typeof ActionsToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 32rem of room: icon actions are buttons; "More actions" holds Help. */
export const Roomy: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Pin' })).toBeVisible();
    await expect(
      canvas.getAllByRole('button', { name: 'More actions' }),
    ).toHaveLength(1);
  },
};

/** 12rem of room: everything folds into "More actions". */
export const Cramped: Story = {
  decorators: [
    (Story) => (
      <div className="flex w-48 rounded-xl bg-card p-3 text-card-foreground">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('button', { name: 'Pin' })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'More actions' }));
    const menu = await screen.findByRole('menu');
    await expect(menu).toHaveTextContent('Pin');
  },
};

export const ActionsOnly: Story = {
  args: { settings: undefined },
};

export const SettingsInPlace: Story = {
  args: {
    settings: { title: 'Settings', presentation: 'view', onOpenView: fn() },
  },
};
