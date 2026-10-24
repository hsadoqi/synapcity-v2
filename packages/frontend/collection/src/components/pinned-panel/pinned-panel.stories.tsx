import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { FileText } from 'lucide-react';

import { sampleItems } from '../../testing';
import { PinnedPanel } from './pinned-panel';

const meta: Meta<typeof PinnedPanel> = {
  title: 'Collection/PinnedPanel',
  component: PinnedPanel,
  tags: ['autodocs'],
  args: {
    id: 'pinned',
    heading: 'Pinned',
    emptyMessage: 'Pin something to keep it here.',
    items: sampleItems,
    icon: FileText,
    singular: 'document',
    onItemAction: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof PinnedPanel>;

export const Default: Story = {};

/** With nothing pinned the panel says how to pin. */
export const NothingPinned: Story = {
  args: { items: sampleItems.map((item) => ({ ...item, pinned: false })) },
};
