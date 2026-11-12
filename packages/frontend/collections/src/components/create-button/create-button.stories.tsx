import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import { CreateButton } from './create-button';

const meta: Meta<typeof CreateButton> = {
  title: 'Collection/CreateButton',
  component: CreateButton,
  tags: ['autodocs'],
  args: { onCreate: fn(), singular: 'document' },
};

export default meta;
type Story = StoryObj<typeof CreateButton>;

export const Default: Story = {};
