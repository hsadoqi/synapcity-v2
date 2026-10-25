import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { DatePill } from './date-pill';

const HOUR = 60 * 60 * 1000;

const meta: Meta<typeof DatePill> = {
  title: 'Blocks/DatePill',
  component: DatePill,
  parameters: {
    layout: 'centered',
  },
  args: {
    value: Date.now() + HOUR,
    surface: 'card',
    bordered: false,
    inverted: false,
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Tomorrow: Story = {
  args: { value: Date.now() + 24 * HOUR },
};

export const NextWeek: Story = {
  args: { value: Date.now() + 10 * 24 * HOUR },
};

export const WithoutTime: Story = {
  args: { showTime: false },
};

export const InAnotherZone: Story = {
  args: { timeZone: 'Asia/Tokyo' },
};

export const WrittenParts: Story = {
  args: {
    value: undefined,
    weekday: 'Thu',
    date: 'Apr 23',
    time: '14:00',
    relative: 'Kickoff',
  },
};

export const SurfaceVariants: Story = {
  render: (args) => (
    <div className="flex items-center justify-between whitespace-nowrap">
      <DatePill {...args} />
      <DatePill {...args} surface="glass" />
    </div>
  ),
};

export const InvertedVariants: Story = {
  render: (args) => (
    <div className="flex items-center justify-between whitespace-nowrap">
      <DatePill {...args} />
      <DatePill {...args} inverted />
    </div>
  ),
};

export const BorderedVariants: Story = {
  render: (args) => (
    <div className="flex items-center justify-between whitespace-nowrap">
      <DatePill {...args} />
      <DatePill {...args} bordered />
    </div>
  ),
};
