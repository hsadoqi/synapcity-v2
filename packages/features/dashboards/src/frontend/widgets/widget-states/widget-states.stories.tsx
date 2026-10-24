import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { WidgetFrame } from '../../../testing/widget-frame';
import { WidgetEmpty, WidgetUnavailable } from './index';

const meta: Meta<typeof WidgetUnavailable> = {
  title: 'Dashboards/Widgets/States',
  component: WidgetUnavailable,
  decorators: [
    (Story) => (
      <WidgetFrame>
        <Story />
      </WidgetFrame>
    ),
  ],
  args: { kind: 'metric' },
};

export default meta;
type Story = StoryObj<typeof WidgetUnavailable>;

export const Unavailable: Story = {};

export const Empty: Story = {
  render: () => <WidgetEmpty>No activity yet.</WidgetEmpty>,
};
