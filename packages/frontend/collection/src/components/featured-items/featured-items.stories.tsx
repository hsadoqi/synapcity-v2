import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { sampleItems, sampleKinds, sampleNow } from '../../testing';
import { FeaturedItems } from './featured-items';

const meta: Meta<typeof FeaturedItems> = {
  title: 'Collection/FeaturedItems',
  component: FeaturedItems,
  tags: ['autodocs'],
  args: {
    id: 'recent',
    heading: 'Recent',
    emptyMessage: 'Nothing here yet.',
    items: sampleItems,
    kinds: sampleKinds,
    now: sampleNow,
  },
};

export default meta;
type Story = StoryObj<typeof FeaturedItems>;

export const Default: Story = {};

/** No items. */
export const Empty: Story = { args: { items: [] } };
