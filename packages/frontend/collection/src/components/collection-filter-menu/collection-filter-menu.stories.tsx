import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { Button } from '@synapcity/frontend-ui/core/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@synapcity/frontend-ui/core/dropdown-menu';

import { CollectionFilterMenu } from './collection-filter-menu';

const meta: Meta<typeof CollectionFilterMenu> = {
  title: 'Collection/CollectionFilterMenu',
  component: CollectionFilterMenu,
  tags: ['autodocs'],
  args: {
    label: 'Space',
    items: ['Writing', 'Learning', 'Personal'],
    selected: ['Writing'],
    onToggle: fn(),
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
type Story = StoryObj<typeof CollectionFilterMenu>;

export const Default: Story = {};
