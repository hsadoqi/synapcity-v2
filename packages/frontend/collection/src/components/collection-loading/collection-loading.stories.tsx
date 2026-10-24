import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { CollectionLoading } from './collection-loading';

const meta: Meta<typeof CollectionLoading> = {
  title: 'Collection/CollectionLoading',
  component: CollectionLoading,
  tags: ['autodocs'],
  args: { layout: 'grid' },
};

export default meta;
type Story = StoryObj<typeof CollectionLoading>;

export const Default: Story = {};

/** The list layout while loading. */
export const List: Story = { args: { layout: 'list' } };
