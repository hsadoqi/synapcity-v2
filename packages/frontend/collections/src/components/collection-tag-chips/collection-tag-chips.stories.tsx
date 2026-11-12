import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import { sampleTags } from '../../testing';
import { EMPTY_FILTERS } from '../../utils';
import { CollectionTagChips } from './collection-tag-chips';

const meta: Meta<typeof CollectionTagChips> = {
  title: 'Collection/CollectionTagChips',
  component: CollectionTagChips,
  tags: ['autodocs'],
  args: {
    tags: sampleTags,
    filters: EMPTY_FILTERS,
    onFiltersChange: fn(),
    limit: 3,
  },
};

export default meta;
type Story = StoryObj<typeof CollectionTagChips>;

export const Default: Story = {};

/** A selected tag is pressed. */
export const TagSelected: Story = {
  args: {
    filters: { pinned: false, recent: false, groups: [], tags: ['books'] },
  },
};
