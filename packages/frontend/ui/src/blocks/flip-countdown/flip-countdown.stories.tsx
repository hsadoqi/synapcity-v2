import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FlipCountdown } from './flip-countdown';
import { FlipDigit, HalfDigit } from './flip-countdown-digit';
import { flipCountdownDemo } from './flip-countdown.utils';

const { title, start } = flipCountdownDemo;

const meta: Meta<typeof FlipCountdown> = {
  title: 'DateTime/FlipCountdown',
  component: FlipCountdown,
  subcomponents: { FlipDigit, HalfDigit },
  parameters: {
    layout: 'centered',
  },
  args: {
    title,
    start,
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithDetails: Story = {
  args: {
    caption: 'Party time!',
  },
};

export const ShortHold: Story = {
  args: {
    holdMs: 500,
  },
};

export const LongHold: Story = {
  args: {
    holdMs: 10000,
  },
};

export const NoDetails: Story = {
  args: {
    title: undefined,
    start: undefined,
    holdMs: 4,
  },
};
