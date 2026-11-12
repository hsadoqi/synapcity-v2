import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import type { EntityItem } from '../../types';
import { RecentEntityRow } from './recent-entity-row';

const entity: EntityItem = {
  id: 'doc-1',
  name: 'Launch plan',
  icon: 'file-text',
  kind: 'document',
  createdAt: '2026-10-01T12:00:00.000Z',
  updatedAt: '2026-10-16T09:30:00.000Z',
};

const meta: Meta<typeof RecentEntityRow> = {
  title: 'Collection/RecentEntityRow',
  component: RecentEntityRow,
  tags: ['autodocs'],
  args: { entity, slug: '/u1/home/spaces/s1/documents/doc-1' },
  decorators: [
    (Story) => (
      <ul className="w-64">
        <Story />
      </ul>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RecentEntityRow>;

export const Default: Story = {};
