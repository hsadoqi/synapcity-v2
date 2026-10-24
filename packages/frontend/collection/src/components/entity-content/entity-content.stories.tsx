import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { EntityContent } from './entity-content';
import type { EntityItem } from '../../types';

const createFixture = (): EntityItem => ({
  id: 's1',
  name: 'Research',
  description: 'Everything for the research workstream.',
  icon: 'folder',
  kind: 'space',
  createdAt: '2026-10-01T12:00:00.000Z',
  updatedAt: '2026-10-16T09:30:00.000Z',
});

const meta: Meta<typeof EntityContent> = {
  title: 'Blocks/Entity/EntityContent',
  component: EntityContent,
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
