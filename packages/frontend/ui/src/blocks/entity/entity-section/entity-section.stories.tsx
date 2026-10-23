import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { EntitySection } from '@synapcity/frontend-ui/blocks/entity/entity-section';
import type { DocumentItem } from '@synapcity/frontend-ui/types/entity';

const items: DocumentItem[] = [1, 2, 3].map((n) => ({
  id: `doc-${n}`,
  name: `Document ${n}`,
  description: 'A short description of the document.',
  icon: 'file-text',
  kind: 'document',
  createdAt: '2026-10-01T12:00:00.000Z',
  updatedAt: '2026-10-16T09:30:00.000Z',
}));

const meta: Meta<typeof EntitySection> = {
  title: 'Blocks/Entity/EntitySection',
  component: EntitySection,
  tags: ['autodocs'],
  args: {
    id: 'documents',
    title: 'Documents',
    items,
    total: items.length,
    viewAllHref: '/u1/home/spaces/s1/documents',
    emptyTitle: 'No documents yet',
    emptyBody: 'Create a document to start writing.',
    emptyIcon: 'file-text',
    createLabel: 'New document',
    prefix: '/u1/home/spaces/s1',
  },
};

export default meta;
type Story = StoryObj<typeof EntitySection>;

export const Default: Story = {};

export const Empty: Story = {
  args: { items: [], total: 0 },
};

export const EmptyWithCreate: Story = {
  args: { items: [], total: 0, createHref: '/u1/home/spaces/s1/documents/new' },
};
