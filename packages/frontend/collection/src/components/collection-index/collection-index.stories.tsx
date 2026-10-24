import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { FileText } from 'lucide-react';

import {
  sampleItems,
  sampleLabels,
  sampleEmptyCopy,
  sampleNowIso,
} from '../../testing';
import { CollectionIndex } from './collection-index';

const meta: Meta<typeof CollectionIndex> = {
  title: 'Collection/CollectionIndex',
  component: CollectionIndex,
  tags: ['autodocs'],
  args: {
    items: sampleItems,
    now: sampleNowIso,
    labels: sampleLabels,
    icon: FileText,
    heading: 'All documents',
    recentHeading: 'Recently opened',
    pinnedHeading: 'Pinned',
    pinnedEmptyMessage: 'Pin something to keep it here.',
    emptyState: sampleEmptyCopy,
    actions: ['open', 'toggle-pin'],
    onSetPinned: fn(async () => ({ ok: true as const })),
  },
};

export default meta;
type Story = StoryObj<typeof CollectionIndex>;

export const Default: Story = {};

/** No items: the empty state. */
export const Empty: Story = { args: { items: [] } };

/** At or below the threshold the highlights are left out. */
export const FewItems: Story = { args: { items: sampleItems.slice(0, 3) } };
