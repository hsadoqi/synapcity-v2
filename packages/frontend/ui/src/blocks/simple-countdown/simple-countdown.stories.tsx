import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SimpleCountdown } from './simple-countdown';

const meta: Meta<typeof SimpleCountdown> = {
  title: 'DateTime/Countdown',
  component: SimpleCountdown,
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const UndefinedLabel: Story = {
  args: {
    label: undefined,
  },
};

const targetDate = new Date(2026, 11, 25);

export const TargetDate: Story = {
  args: {
    targetDate,
    label: 'Christmas is in...',
  },
};
