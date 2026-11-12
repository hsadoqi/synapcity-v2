import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import { CollectionNoResults } from './collection-no-results';

const meta: Meta<typeof CollectionNoResults> = {
  title: 'Collection/CollectionNoResults',
  component: CollectionNoResults,
  tags: ['autodocs'],
  args: {
    plural: 'Documents',
    query: 'zebra',
    hasFilters: true,
    onClearQuery: fn(),
    onClearFilters: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof CollectionNoResults>;

export const Default: Story = {};

/** No search, only filters: just the clear-filters button. */
export const FiltersOnly: Story = { args: { query: '' } };
