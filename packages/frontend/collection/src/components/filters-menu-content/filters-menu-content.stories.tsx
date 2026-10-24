import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { Button } from '@synapcity/frontend-ui/core/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@synapcity/frontend-ui/core/dropdown-menu';

import { sampleGrouping, sampleTags } from '../../testing';
import { EMPTY_FILTERS } from '../../utils';
import { FiltersMenuContent } from './filters-menu-content';

const meta: Meta<typeof FiltersMenuContent> = {
  title: 'Collection/FiltersMenuContent',
  component: FiltersMenuContent,
  tags: ['autodocs'],
  args: {
    filters: EMPTY_FILTERS,
    onFiltersChange: fn(),
    grouping: sampleGrouping,
    tags: sampleTags,
  },
  decorators: [
    (Story) => (
      <div className="min-h-72 min-w-72 p-8">
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger render={<Button variant="outline" />}>
            Filters
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <Story />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FiltersMenuContent>;

export const Default: Story = {};

/** With filters on. */
export const Pinned: Story = {
  args: {
    filters: {
      pinned: true,
      recent: false,
      groups: ['Writing'],
      tags: ['ideas'],
    },
  },
};
