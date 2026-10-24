import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { FileText } from 'lucide-react';

import { sampleItems, sampleNow } from '../../testing';
import { CollectionListRow } from './collection-list-row';

const meta: Meta<typeof CollectionListRow> = {
  title: 'Collection/CollectionListRow',
  component: CollectionListRow,
  tags: ['autodocs'],
  // A row is a list item, so the story puts it in the list the list view gives it.
  decorators: [
    (Story) => (
      <ul
        role="list"
        className="flex max-w-xl flex-col rounded-md border border-border bg-card text-card-foreground"
      >
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
type Story = StoryObj<typeof CollectionListRow>;

/** An unpinned item. */
export const Default: Story = {};

/** A pinned item shows the pin mark. */
export const Pinned: Story = { args: { item: sampleItems[2]! } };
