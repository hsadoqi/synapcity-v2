import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { EntityContent } from '@synapcity/frontend-ui/blocks/entity/entity-content';
import type { Space } from '@synapcity/frontend-ui/types/entity';

const createFixture = ({ ownerId }: { ownerId?: string }): Space => ({
  id: 's1',
  ownerId: ownerId ?? 'u1',
  name: 'Research',
  description: 'Everything for the research workstream.',
  icon: 'folder',
  tags: [],
  kind: 'space',
  documents: [],
  dashboards: [],
  documentsTotal: 0,
  dashboardsTotal: 0,
  createdAt: '2026-10-01T12:00:00.000Z',
  updatedAt: '2026-10-16T09:30:00.000Z',
});

const meta: Meta<typeof EntityContent> = {
  title: 'Blocks/Entity/EntityContent',
  component: EntityContent,
  tags: ['autodocs'],
  args: {
    userId: 'u1',
    createFixture,
    getRecentItems: () => [],
    children: <p className="text-muted-foreground">Page content</p>,
  },
};

export default meta;
type Story = StoryObj<typeof EntityContent>;

export const Default: Story = {};
