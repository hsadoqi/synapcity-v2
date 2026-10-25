import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { SimpleCountdown } from './simple-countdown';

const meta: Meta<typeof SimpleCountdown> = {
  title: 'Blocks/SimpleCountdown',
  component: SimpleCountdown,
  parameters: {
    layout: 'centered',
  },
  args: {
    label: 'Launches in',
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

/** Three hours after the story loads. */
export const Default: Story = {
  args: {
    target: Date.now() + 3 * 60 * 60 * 1000,
  },
};

export const OverADay: Story = {
  args: {
    target: Date.now() + 100 * 60 * 60 * 1000,
  },
};

export const Finished: Story = {
  args: {
    target: Date.now() - 1000,
  },
};

export const NoTarget: Story = {};
