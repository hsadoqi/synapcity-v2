import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { FileText } from 'lucide-react';

import { sampleItems, sampleNow } from '../../testing';
import { CollectionListRow } from './collection-list-row';

const meta: Meta<typeof CollectionListRow> = {
  title: 'Collection/CollectionListRow',
  component: CollectionListRow,
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
type Story = StoryObj<typeof CollectionListRow>;

export const Default: Story = {};

/** A pinned item shows the pin mark. */
export const Pinned: Story = { args: { item: sampleItems[2]! } };
