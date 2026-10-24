import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { seededWorkspace } from '../../../testing';
import { WidgetFrame } from '../../../testing';
import { StatBody } from './index';

const { records } = seededWorkspace();
const [workouts, steps] = Object.values(records.metric);

const meta: Meta<typeof StatBody> = {
  title: 'Dashboards/Widgets/Stat',
  component: StatBody,
  decorators: [
    (Story) => (
      <WidgetFrame>
        <Story />
      </WidgetFrame>
    ),
  ],
  args: { metric: workouts! },
};

export default meta;
type Story = StoryObj<typeof StatBody>;

export const Default: Story = {};

export const LargeValue: Story = { args: { metric: steps! } };
