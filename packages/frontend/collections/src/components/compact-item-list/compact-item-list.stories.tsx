import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { sampleItems, sampleKinds, sampleNow } from '../../testing';
import { CompactItemList } from './compact-item-list';

const meta: Meta<typeof CompactItemList> = {
  title: 'Collection/CompactItemList',
  component: CompactItemList,
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
type Story = StoryObj<typeof CompactItemList>;

export const Default: Story = {};

/** No items. */
export const Empty: Story = {
  args: { items: [], emptyMessage: 'Nothing here yet.' },
};

/** At most three items. */
export const Limited: Story = { args: { limit: 3 } };
