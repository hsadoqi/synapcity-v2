import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { FileText } from 'lucide-react';

import { sampleItems } from '../../testing';
import { CollectionHighlights } from './collection-highlights';

const meta: Meta<typeof CollectionHighlights> = {
  title: 'Collection/CollectionHighlights',
  component: CollectionHighlights,
  tags: ['autodocs'],
  args: {
    id: 'highlights',
    items: sampleItems,
    icon: FileText,
    singular: 'document',
    onItemAction: fn(),
    recentHeading: 'Recently opened',
    pinnedHeading: 'Pinned',
    pinnedEmptyMessage: 'Pin something to keep it here.',
  },
};

export default meta;
type Story = StoryObj<typeof CollectionHighlights>;

export const Default: Story = {};

/** With nothing pinned the panel says how to pin. */
export const NothingPinned: Story = {
  args: { items: sampleItems.map((item) => ({ ...item, pinned: false })) },
};
