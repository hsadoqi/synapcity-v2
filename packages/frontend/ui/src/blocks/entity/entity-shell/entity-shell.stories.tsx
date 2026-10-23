import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { EntityShell } from '@synapcity/frontend-ui/blocks/entity';
import type { Space } from '@synapcity/frontend-ui/types/entity';

const space: Space = {
  id: 's1',
  ownerId: 'u1',
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
  pinnedAt: null,
  lastViewedAt: null,
};

const meta: Meta<typeof EntityShell> = {
  title: 'Blocks/Entity/EntityShell',
  component: EntityShell,
  tags: ['autodocs'],
  args: {
    entity: space,
    children: <p className="text-muted-foreground">Page content</p>,
  },
};

export default meta;
type Story = StoryObj<typeof EntityShell>;

export const Default: Story = {};

export const WithRecentItems: Story = {
  args: {
    recentItems: [
      {
        id: 'doc-1',
        name: 'Launch plan',
        icon: 'file-text',
        kind: 'document',
        createdAt: '2026-10-01T12:00:00.000Z',
        updatedAt: '2026-10-16T09:30:00.000Z',
      },
    ],
  },
};
