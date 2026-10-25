import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Button } from '@synapcity/frontend-ui/core/button';
import { AgendaDialog } from '@synapcity/frontend-ui/blocks/day-agenda/agenda-dialog';

const meta = {
  title: 'Blocks/Day Agenda/AgendaDialog',
  component: AgendaDialog,
  parameters: { layout: 'centered' },
  args: {
    title: 'Settings',
    description: 'Manage your agenda preferences',
    trigger: <Button variant="outline">Open settings</Button>,
  },
  argTypes: {
    trigger: { control: false },
    container: { control: 'select', options: ['body', 'inline'] },
  },
} satisfies Meta<typeof AgendaDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Placeholder: Story = {};

export const WithContent: Story = {
  args: {
    children: <p className="text-sm">Week starts on Monday.</p>,
  },
};
