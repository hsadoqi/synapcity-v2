import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { DashboardEmptyState } from './index';

const meta: Meta<typeof DashboardEmptyState> = {
  title: 'Dashboards/EmptyState',
  component: DashboardEmptyState,
};

export default meta;
type Story = StoryObj<typeof DashboardEmptyState>;

export const Default: Story = {};

/** Read-only: the dashboard cannot be edited yet, so it does not point at editing. */
export const ReadOnly: Story = { args: { readOnly: true } };
