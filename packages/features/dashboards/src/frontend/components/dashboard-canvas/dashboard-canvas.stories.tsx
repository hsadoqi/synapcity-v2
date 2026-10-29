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

/** Tablet layout the width resolved to, not chosen: the canvas is the device, no frame. */
export const Tablet: Story = {
  decorators: [withDashboardStore({ breakpoint: 'md' })],
};

/** Tablet layout chosen as a preview: framed at the device width when there is room. */
export const TabletPreview: Story = {
  decorators: [
    withDashboardStore({ breakpoint: 'md', breakpointLocked: true }),
  ],
};

/** Mobile layout the width resolved to, not chosen: no frame. */
export const Mobile: Story = {
  decorators: [withDashboardStore({ breakpoint: 'sm' })],
};

/** Mobile layout chosen as a preview: framed at the device width when there is room. */
export const MobilePreview: Story = {
  decorators: [
    withDashboardStore({ breakpoint: 'sm', breakpointLocked: true }),
  ],
};
