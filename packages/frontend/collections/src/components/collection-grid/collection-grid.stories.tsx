import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { FileText } from 'lucide-react';

import { sampleItems, sampleNow } from '../../testing';
import { CollectionGrid } from './collection-grid';

const meta: Meta<typeof CollectionGrid> = {
  title: 'Collection/CollectionGrid',
  component: CollectionGrid,
  tags: ['autodocs'],
  args: {
    items: sampleItems,
    icon: FileText,
    singular: 'document',
    showGroup: true,
    now: sampleNow,
    onItemAction: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof CollectionGrid>;

export const Default: Story = {};

/** Each card without its group. */
export const WithoutGroup: Story = { args: { showGroup: false } };
