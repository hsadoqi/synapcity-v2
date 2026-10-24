import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { withDashboardStore } from '../../../testing';
import { DashboardCanvas } from './index';

const meta: Meta<typeof DashboardCanvas> = {
  title: 'Dashboards/Canvas',
  component: DashboardCanvas,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof DashboardCanvas>;

export const Desktop: Story = {
  decorators: [withDashboardStore({ breakpoint: 'lg' })],
};

export const Tablet: Story = {
  decorators: [withDashboardStore({ breakpoint: 'md' })],
};

export const Mobile: Story = {
  decorators: [withDashboardStore({ breakpoint: 'sm' })],
};
