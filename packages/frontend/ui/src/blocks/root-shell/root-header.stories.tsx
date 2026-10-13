import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { RootHeader } from '@synapcity/frontend-ui/blocks/root-shell';

const meta: Meta<typeof RootHeader> = {
  title: 'Blocks/RootHeader',
  component: RootHeader,
  tags: ['autodocs'],
  args: {},
};

export default meta;
type Story = StoryObj<typeof RootHeader>;

export const Default: Story = {
  args: {},
};
