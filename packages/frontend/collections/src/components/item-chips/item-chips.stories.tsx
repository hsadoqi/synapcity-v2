import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { sampleItems, sampleKinds } from '../../testing';
import { ItemChips } from './item-chips';

const meta: Meta<typeof ItemChips> = {
  title: 'Collection/ItemChips',
  component: ItemChips,
  tags: ['autodocs'],
  args: {
    id: 'recent',
    heading: 'Recent',
    emptyMessage: 'Nothing here yet.',
    items: sampleItems,
    kinds: sampleKinds,
  },
};

export default meta;
type Story = StoryObj<typeof ItemChips>;

export const Default: Story = {};

/** No items. */
export const Empty: Story = { args: { items: [] } };
