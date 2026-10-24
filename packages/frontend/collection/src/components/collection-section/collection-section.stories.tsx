import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Clock } from 'lucide-react';

import { CollectionSection } from './collection-section';

const meta: Meta<typeof CollectionSection> = {
  title: 'Collection/CollectionSection',
  component: CollectionSection,
  tags: ['autodocs'],
  args: {
    id: 'recent',
    heading: 'Recent',
    icon: Clock,
    emptyMessage: 'Nothing here yet.',
    isEmpty: false,
    children: <p className="text-sm">Section content goes here.</p>,
  },
};

export default meta;
type Story = StoryObj<typeof CollectionSection>;

export const Default: Story = {};

/** Shows the empty message instead of the children. */
export const Empty: Story = { args: { isEmpty: true } };

/** Closer spacing between the heading and the content. */
export const Tight: Story = { args: { tight: true } };
