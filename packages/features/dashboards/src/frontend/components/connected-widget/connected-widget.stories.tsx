import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { withDashboardStore } from '../../../testing';
import { ConnectedWidget } from './index';

const meta: Meta<typeof ConnectedWidget> = {
  title: 'Dashboards/ConnectedWidget',
  component: ConnectedWidget,
  decorators: [
    (Story) => (
      <div className="h-64 w-80">
        <Story />
      </div>
    ),
  ],
  args: { widgetId: 'wgt_seed7' },
};

export default meta;
type Story = StoryObj<typeof ConnectedWidget>;

export const TaskList: Story = { decorators: [withDashboardStore()] };

export const Editing: Story = {
  decorators: [withDashboardStore({ editMode: true })],
};
