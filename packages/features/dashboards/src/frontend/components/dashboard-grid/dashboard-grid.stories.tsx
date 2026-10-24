import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { createComposition } from '@synapcity/domain-dashboards';
import { emptyRecords } from '@synapcity/domain-prototypes';

import { withDashboardStore } from '../../../testing/with-dashboard-store';
import { DashboardGrid } from './index';

const meta: Meta<typeof DashboardGrid> = {
  title: 'Dashboards/Grid',
  component: DashboardGrid,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof DashboardGrid>;

export const View: Story = { decorators: [withDashboardStore()] };

export const Edit: Story = {
  decorators: [withDashboardStore({ editMode: true })],
};

export const Empty: Story = {
  decorators: [
    withDashboardStore({
      composition: createComposition(),
      records: emptyRecords(),
    }),
  ],
};
