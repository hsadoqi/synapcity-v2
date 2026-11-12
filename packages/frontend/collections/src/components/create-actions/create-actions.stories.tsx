import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { FileText, LayoutDashboard } from 'lucide-react';

import { CreateActions } from './create-actions';

const meta: Meta<typeof CreateActions> = {
  title: 'Collection/CreateActions',
  component: CreateActions,
  tags: ['autodocs'],
  args: {
    id: 'create',
    heading: 'Create',
    actions: [
      { id: 'document', label: 'New document', icon: FileText },
      { id: 'dashboard', label: 'New dashboard', icon: LayoutDashboard },
    ],
    onCreate: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof CreateActions>;

export const Default: Story = {};
