import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { FileText } from 'lucide-react';

import { sampleItems, sampleNow } from '../../testing';
import { CollectionGridCard } from './collection-grid-card';

const meta: Meta<typeof CollectionGridCard> = {
  title: 'Collection/CollectionGridCard',
  component: CollectionGridCard,
  tags: ['autodocs'],
  // A card is a list item, so the story puts it in the list the grid gives it.
  decorators: [
    (Story) => (
      <ul role="list" className="grid max-w-sm grid-cols-1">
        <Story />
      </ul>
    ),
  ],
  args: {
    item: sampleItems[1]!,
    icon: FileText,
    singular: 'document',
    showGroup: true,
    now: sampleNow,
    onItemAction: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof CollectionGridCard>;

/** An unpinned item. */
export const Default: Story = {};

/** A pinned item shows the pin mark. */
export const Pinned: Story = { args: { item: sampleItems[2]! } };
