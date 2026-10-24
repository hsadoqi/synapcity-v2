import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { FileText } from 'lucide-react';

import { sampleItems, sampleNow } from '../../testing';
import { CollectionList } from './collection-list';

const meta: Meta<typeof CollectionList> = {
  title: 'Collection/CollectionList',
  component: CollectionList,
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
type Story = StoryObj<typeof CollectionList>;

export const Default: Story = {};

/** Each row without its group. */
export const WithoutGroup: Story = { args: { showGroup: false } };
