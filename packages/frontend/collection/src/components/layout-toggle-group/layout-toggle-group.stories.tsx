import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import { LayoutToggleGroup } from './layout-toggle-group';

const meta: Meta<typeof LayoutToggleGroup> = {
  title: 'Collection/LayoutToggleGroup',
  component: LayoutToggleGroup,
  tags: ['autodocs'],
  args: { layout: 'list', onLayoutChange: fn() },
};

export default meta;
type Story = StoryObj<typeof LayoutToggleGroup>;

export const Default: Story = {};

/** The grid layout is selected. */
export const Grid: Story = { args: { layout: 'grid' } };
