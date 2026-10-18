import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { LoadingRegion } from '@synapcity/frontend-ui/components/loading-region';
import { Skeleton } from '@synapcity/frontend-ui/core/skeleton';

const meta: Meta<typeof LoadingRegion> = {
  title: 'Components/LoadingRegion',
  component: LoadingRegion,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof LoadingRegion>;

/**
 * Wraps skeletons so assistive technology hears one status message instead of
 * a page of empty shapes. The label is visually hidden.
 */
export const Default: Story = {
  args: { label: 'Loading your recent work' },
  render: (args) => (
    <LoadingRegion {...args}>
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-24 w-full" />
    </LoadingRegion>
  ),
};
