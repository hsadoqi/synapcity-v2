import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { FileText } from 'lucide-react';

import { sampleItems, sampleNow } from '../../testing';
import { CollectionGridCard } from './collection-grid-card';

const meta: Meta<typeof CollectionGridCard> = {
  title: 'Collection/CollectionGridCard',
  component: CollectionGridCard,
  tags: ['autodocs'],
  args: {
    item: sampleItems[0]!,
    icon: FileText,
    singular: 'document',
    showGroup: true,
    now: sampleNow,
    onItemAction: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof CollectionGridCard>;

export const Default: Story = {};

/** A pinned item shows the pin mark. */
export const Pinned: Story = { args: { item: sampleItems[2]! } };
