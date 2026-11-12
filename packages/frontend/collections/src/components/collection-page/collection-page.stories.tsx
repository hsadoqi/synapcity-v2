import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { CollectionPage, CollectionPageSkeleton } from './collection-page';

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

/** The page while its items load: the real heading and intro over placeholders. */
export const Loading: Story = {
  render: () => (
    <CollectionPageSkeleton
      title="Documents"
      intro="Everything you have written."
      loadingLabel="Loading documents"
    />
  ),
};
