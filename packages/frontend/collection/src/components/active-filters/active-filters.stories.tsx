import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import { EMPTY_FILTERS } from '../../utils';
import { ActiveFilters } from './active-filters';

const meta: Meta<typeof ActiveFilters> = {
  title: 'Collection/ActiveFilters',
  component: ActiveFilters,
  tags: ['autodocs'],
  args: {
    filters: {
      pinned: true,
      recent: false,
      groups: ['Writing'],
      tags: ['ideas'],
    },
    onFiltersChange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof ActiveFilters>;

export const Default: Story = {};

/** With no filter on, nothing is shown. */
export const NothingActive: Story = { args: { filters: EMPTY_FILTERS } };
