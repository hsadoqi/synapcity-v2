import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { fn } from 'storybook/test';

import { SEED_NOW, seededWorkspace } from '../../../testing/seed';
import { WidgetFrame } from '../../../testing/widget-frame';
import { HabitBody } from './index';

const habit = Object.values(seededWorkspace().records.habit)[0]!;

const meta: Meta<typeof HabitBody> = {
  title: 'Dashboards/Widgets/Habit',
  component: HabitBody,
  decorators: [
    (Story) => (
      <WidgetFrame>
        <Story />
      </WidgetFrame>
    ),
  ],
  args: { habit, now: SEED_NOW, onToggleDay: fn() },
};

export default meta;
type Story = StoryObj<typeof HabitBody>;

export const Default: Story = {};

export const NothingDone: Story = {
  args: { habit: { ...habit, completedDays: [] } },
};
