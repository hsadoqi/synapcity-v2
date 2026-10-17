import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Separator } from '@synapcity/frontend-ui/core/separator';

const meta: Meta<typeof Separator> = {
  title: 'Components/Separator',
  component: Separator,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
  render: (args) => (
    <div className="flex w-64 flex-col gap-2 text-xs">
      <span>Above</span>
      <Separator {...args} />
      <span>Below</span>
    </div>
  ),
};

export const Vertical: Story = {
  args: { orientation: 'vertical' },
  render: (args) => (
    <div className="flex h-6 items-center gap-2 text-xs">
      <span>Left</span>
      <Separator {...args} />
      <span>Right</span>
    </div>
  ),
};
