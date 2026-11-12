import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import { sampleGrouping, sampleTags } from '../../testing';
import { EMPTY_FILTERS } from '../../utils';
import { FiltersMenu } from './filters-menu';

const meta: Meta<typeof FiltersMenu> = {
  title: 'Collection/FiltersMenu',
  component: FiltersMenu,
  tags: ['autodocs'],
  args: {
    filters: EMPTY_FILTERS,
    onFiltersChange: fn(),
    grouping: sampleGrouping,
    tags: sampleTags,
  },
};

export default meta;
type Story = StoryObj<typeof FiltersMenu>;

export const Default: Story = {};

/** A filter on shows its count. */
export const WithActiveFilters: Story = {
  args: {
    filters: {
      pinned: true,
      recent: false,
      groups: ['Writing'],
      tags: ['ideas'],
    },
  },
};
