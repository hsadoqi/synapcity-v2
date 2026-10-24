import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { FileText } from 'lucide-react';

import {
  sampleItems,
  sampleLabels,
  sampleEmptyCopy,
  sampleNow,
} from '../../testing';
import { CollectionTabs } from './collection-tabs';

const meta: Meta<typeof CollectionTabs> = {
  title: 'Collection/CollectionTabs',
  component: CollectionTabs,
  tags: ['autodocs'],
  args: {
    tabs: [
      {
        id: 'documents',
        label: 'Documents',
        view: {
          labels: sampleLabels,
          icon: FileText,
          emptyState: sampleEmptyCopy,
        },
        items: sampleItems,
      },
    ],
    overviewLabel: 'Overview',
    userId: 'u1',
    now: sampleNow,
    onCreate: fn(),
    children: <p className="text-sm">The overview.</p>,
  },
};

export default meta;
type Story = StoryObj<typeof CollectionTabs>;

export const Default: Story = {};

/** Only the collection tabs. */
export const WithoutOverview: Story = {
  args: { overviewLabel: undefined, children: undefined },
};
