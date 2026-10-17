import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Skeleton } from '@synapcity/frontend-ui/core/skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'Components/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  args: { className: 'h-4 w-48' },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Line: Story = {};

export const Card: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Skeleton className="size-10 rounded-full" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  ),
};
