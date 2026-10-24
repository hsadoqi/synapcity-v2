import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { CollectionPage } from './collection-page';

const meta: Meta<typeof CollectionPage> = {
  title: 'Collection/CollectionPage',
  component: CollectionPage,
  tags: ['autodocs'],
  args: {
    title: 'Documents',
    intro: 'Everything you have written.',
    children: <p className="text-sm">Page content goes here.</p>,
  },
};

export default meta;
type Story = StoryObj<typeof CollectionPage>;

export const Default: Story = {};
