import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { FileText } from 'lucide-react';

import {
  sampleItems,
  sampleLabels,
  sampleEmptyCopy,
  sampleNow,
} from '../../testing';
import { EMPTY_FILTERS } from '../../utils';
import { CollectionView } from './collection-view';

const meta: Meta<typeof CollectionView> = {
  title: 'Collection/CollectionView',
  component: CollectionView,
  tags: ['autodocs'],
  args: {
    labels: sampleLabels,
    icon: FileText,
    emptyState: sampleEmptyCopy,
    items: sampleItems,
    state: 'populated',
    query: '',
    onQueryChange: fn(),
    filters: EMPTY_FILTERS,
    onFiltersChange: fn(),
    sort: { field: 'used', direction: 'desc' },
    onSortChange: fn(),
    layout: 'list',
    onLayoutChange: fn(),
    onItemAction: fn(),
    onCreate: fn(),
    now: sampleNow,
  },
};

export default meta;
type Story = StoryObj<typeof CollectionView>;

export const Default: Story = {};

/** The grid layout. */
export const Grid: Story = { args: { layout: 'grid' } };

/** While loading. */
export const Loading: Story = { args: { state: 'loading' } };

/** No items yet. */
export const Empty: Story = { args: { state: 'empty', items: [] } };

/** A search with no match. */
export const NoResults: Story = {
  args: { state: 'no-results', query: 'zebra' },
};
