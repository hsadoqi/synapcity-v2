import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { EntityDate } from '@synapcity/frontend-ui/blocks/entity/entity-date';

const meta: Meta<typeof EntityDate> = {
  title: 'Blocks/Entity/EntityDate',
  component: EntityDate,
  tags: ['autodocs'],
  args: {
    at: '2025-10-02T09:30:00.000Z',
    srPrefix: 'Updated',
    className: 'text-xs text-muted-foreground',
  },
};

export default meta;
type Story = StoryObj<typeof EntityDate>;

export const OlderDate: Story = {};

export const Today: Story = {
  args: { at: new Date().toISOString() },
};
