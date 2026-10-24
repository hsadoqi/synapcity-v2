import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { PinnedMark } from './pinned-mark';

const meta: Meta<typeof PinnedMark> = {
  title: 'Collection/PinnedMark',
  component: PinnedMark,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PinnedMark>;

export const Default: Story = {};
