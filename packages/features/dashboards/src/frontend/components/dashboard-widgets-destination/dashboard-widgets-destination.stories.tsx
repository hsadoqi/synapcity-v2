import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { withDashboardStore } from '../../../testing';
import { DashboardWidgetsDestination } from './index';

const meta: Meta<typeof DashboardWidgetsDestination> = {
  title: 'Dashboards/WidgetsDestination',
  component: DashboardWidgetsDestination,
  decorators: [
    (Story) => (
      <div className="w-80 border border-border">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DashboardWidgetsDestination>;

/** Not editing: an explanation and an explicit Edit layout button. */
export const NotEditing: Story = { decorators: [withDashboardStore()] };

export const Editing: Story = {
  decorators: [withDashboardStore({ editMode: true })],
};
