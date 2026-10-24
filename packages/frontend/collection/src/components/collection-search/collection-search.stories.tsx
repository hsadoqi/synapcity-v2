import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import { CollectionSearch } from './collection-search';

const meta: Meta<typeof CollectionSearch> = {
  title: 'Collection/CollectionSearch',
  component: CollectionSearch,
  tags: ['autodocs'],
  args: {
    query: '',
    onQueryChange: fn(),
    placeholder: 'Search documents',
    label: 'Search documents',
  },
};

export default meta;
type Story = StoryObj<typeof CollectionSearch>;

export const Default: Story = {};

/** A search in progress. */
export const WithQuery: Story = { args: { query: 'plan' } };
