import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { useCollectionNavigation } from './collection-navigation';

function OpenItem() {
  const { Link } = useCollectionNavigation();
  return <Link href="#opens-the-item">Open the item</Link>;
}

const meta: Meta<typeof OpenItem> = {
  title: 'Collection/CollectionNavigation',
  component: OpenItem,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof OpenItem>;

/** With no host provider, links are plain anchors, so a story needs no router. */
export const PlainAnchor: Story = {};
