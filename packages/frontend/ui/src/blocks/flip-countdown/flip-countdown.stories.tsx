import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { FlipCountdown } from './flip-countdown';
import { FlipDigit, HalfDigit } from './flip-countdown-digit';

const meta: Meta<typeof FlipCountdown> = {
  title: 'Blocks/FlipCountdown',
  component: FlipCountdown,
  subcomponents: { FlipDigit, HalfDigit },
  parameters: {
    layout: 'centered',
  },
  args: {
    title: 'Doors open in',
    start: '00:15:00',
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithCaption: Story = {
  args: {
    caption: 'Party time!',
  },
};

/** Counts to a real moment, here two minutes after the story loads, and stays at zero. */
export const ToATarget: Story = {
  args: {
    start: undefined,
    target: Date.now() + 2 * 60 * 1000,
  },
};

export const ShortHold: Story = {
  args: {
    start: '00:00:05',
    holdMs: 500,
  },
};

export const LongHold: Story = {
  args: {
    start: '00:00:05',
    holdMs: 10000,
  },
};

export const NoTitle: Story = {
  args: {
    title: undefined,
    start: undefined,
  },
};
