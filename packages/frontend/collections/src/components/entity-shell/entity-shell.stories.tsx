import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { EntityShell } from './entity-shell';
import type { EntityItem } from '../../types';

const space: EntityItem = {
  id: 's1',
  name: 'Research',
  description: 'Everything for the research workstream.',
  icon: 'folder',
  kind: 'space',
  createdAt: '2026-10-01T12:00:00.000Z',
  updatedAt: '2026-10-16T09:30:00.000Z',
};

const meta: Meta<typeof EntityShell> = {
  title: 'Blocks/Entity/EntityShell',
  component: EntityShell,
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
