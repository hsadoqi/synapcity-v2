import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { RootFooter } from '@synapcity/frontend-ui/blocks/root-shell';

const meta: Meta<typeof RootFooter> = {
  title: 'Blocks/RootFooter',
  component: RootFooter,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof RootFooter>;

export const Default: Story = {
  args: {},
};
