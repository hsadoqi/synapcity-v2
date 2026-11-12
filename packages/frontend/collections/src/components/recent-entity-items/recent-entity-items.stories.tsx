import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import type { EntityItem } from '../../types';
import { RecentEntityItems } from './recent-entity-items';

const items: EntityItem[] = [1, 2, 3].map((n) => ({
  id: `doc-${n}`,
  name: `Document ${n}`,
  icon: 'file-text',
  kind: 'document',
  createdAt: '2026-10-01T12:00:00.000Z',
  updatedAt: '2026-10-16T09:30:00.000Z',
}));

const meta: Meta<typeof RecentEntityItems> = {
  title: 'Collection/RecentEntityItems',
  component: RecentEntityItems,
  tags: ['autodocs'],
  args: { items, prefix: '/u1/home/spaces/s1/documents' },
};

export default meta;
type Story = StoryObj<typeof RecentEntityItems>;

export const Default: Story = {};

/** A custom label for the list. */
export const CustomLabel: Story = { args: { label: 'Recently opened' } };
