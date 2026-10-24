import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { seededWorkspace } from '../../../testing/seed';
import { WidgetFrame } from '../../../testing/widget-frame';
import { ProgressBody } from './index';

const goal = Object.values(seededWorkspace().records.goal)[0]!;

const meta: Meta<typeof ProgressBody> = {
  title: 'Dashboards/Widgets/Progress',
  component: ProgressBody,
  decorators: [
    (Story) => (
      <WidgetFrame>
        <Story />
      </WidgetFrame>
    ),
  ],
  args: { goal },
};

export default meta;
type Story = StoryObj<typeof ProgressBody>;

export const Default: Story = {};

export const Complete: Story = { args: { goal: { ...goal, current: 24 } } };
