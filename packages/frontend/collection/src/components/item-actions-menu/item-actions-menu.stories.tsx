import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import { sampleItems } from '../../testing';
import { ItemActionsMenu } from './item-actions-menu';

const meta: Meta<typeof ItemActionsMenu> = {
  title: 'Collection/ItemActionsMenu',
  component: ItemActionsMenu,
  tags: ['autodocs'],
  args: { item: sampleItems[0]!, singular: 'document', onAction: fn() },
};

export default meta;
type Story = StoryObj<typeof ItemActionsMenu>;

export const Default: Story = {};

/** A smaller set of actions. */
export const SomeActions: Story = { args: { actions: ['open', 'toggle-pin'] } };
