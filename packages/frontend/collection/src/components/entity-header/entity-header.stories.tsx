import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import { EntityHeader } from './entity-header';

const meta: Meta<typeof EntityHeader> = {
  title: 'Blocks/Entity/EntityHeader',
  component: EntityHeader,
  tags: ['autodocs'],
  args: {
    name: 'Research',
    description: 'Everything for the research workstream.',
    onNewDocument: fn(),
    onNewDashboard: fn(),
    onRename: fn(),
    onArchive: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof EntityHeader>;

export const Default: Story = {};

export const WithoutDescription: Story = {
  args: { description: undefined },
};
