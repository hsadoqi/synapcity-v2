import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';

import { withDashboardStore } from '../../../testing/with-dashboard-store';
import { BreakpointToolbar } from './index';

const meta: Meta<typeof BreakpointToolbar> = {
  title: 'Dashboards/BreakpointToolbar',
  component: BreakpointToolbar,
  decorators: [withDashboardStore()],
};

export default meta;
type Story = StoryObj<typeof BreakpointToolbar>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const mobile = within(canvasElement).getByRole('button', {
      name: 'Mobile layout',
    });
    await userEvent.click(mobile);
    await expect(mobile).toHaveAttribute('aria-pressed', 'true');
  },
};
