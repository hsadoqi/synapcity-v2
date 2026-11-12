import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import { sampleLabels, sampleGrouping, sampleTags } from '../../testing';
import { EMPTY_FILTERS } from '../../utils';
import { CollectionToolbar } from './collection-toolbar';

const meta: Meta<typeof CollectionToolbar> = {
  title: 'Collection/CollectionToolbar',
  component: CollectionToolbar,
  tags: ['autodocs'],
  args: {
    labels: sampleLabels,
    query: '',
    onQueryChange: fn(),
    filters: EMPTY_FILTERS,
    onFiltersChange: fn(),
    sort: { field: 'used', direction: 'desc' },
    onSortChange: fn(),
    layout: 'list',
    onLayoutChange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof CollectionToolbar>;

export const Default: Story = {};

/** With the group and tag filters and a view-all link. */
export const WithGroupingAndViewAll: Story = {
  args: {
    grouping: sampleGrouping,
    tagOptions: sampleTags,
    context: 'Writing',
    viewAllHref: '/home/documents',
  },
};
