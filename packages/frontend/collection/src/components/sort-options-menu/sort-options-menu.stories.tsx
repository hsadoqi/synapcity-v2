import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import { SortOptionsMenu } from './sort-options-menu';

const meta: Meta<typeof SortOptionsMenu> = {
  title: 'Collection/SortOptionsMenu',
  component: SortOptionsMenu,
  tags: ['autodocs'],
  args: { sort: { field: 'used', direction: 'desc' }, onSortChange: fn() },
};

export default meta;
type Story = StoryObj<typeof SortOptionsMenu>;

export const Default: Story = {};

/** Sorted by title. */
export const ByTitle: Story = {
  args: { sort: { field: 'title', direction: 'asc' } },
};
