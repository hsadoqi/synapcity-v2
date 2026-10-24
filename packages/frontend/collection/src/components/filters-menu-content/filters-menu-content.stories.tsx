import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { Button } from '@synapcity/frontend-ui/core/button';
import {
  DropdownMenu,
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
  // The component renders the menu's content itself, so the story gives it only the menu and its trigger.
  decorators: [
    (Story) => (
      <div className="min-h-72 min-w-72 p-8">
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger render={<Button variant="outline" />}>
            Filters
          </DropdownMenuTrigger>
          <Story />
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
