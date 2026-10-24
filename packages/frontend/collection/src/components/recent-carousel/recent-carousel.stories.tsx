import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { FileText } from 'lucide-react';

import { sampleItems } from '../../testing';
import { RecentCarousel } from './recent-carousel';

const meta: Meta<typeof RecentCarousel> = {
  title: 'Collection/RecentCarousel',
  component: RecentCarousel,
  tags: ['autodocs'],
  args: {
    id: 'recent',
    heading: 'Recently opened',
    items: sampleItems,
    icon: FileText,
    singular: 'document',
    onItemAction: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof RecentCarousel>;

export const Default: Story = {};
