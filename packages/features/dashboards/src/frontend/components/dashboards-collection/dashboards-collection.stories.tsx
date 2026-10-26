import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import { sampleSummaries, withStubNavigation } from '../../../testing';
import {
  DashboardsCollection,
  DashboardsCollectionSkeleton,
} from './dashboards-collection';

const meta: Meta<typeof DashboardsCollection> = {
  title: 'Dashboards/DashboardsCollection',
  component: DashboardsCollection,
  tags: ['autodocs'],
  decorators: [withStubNavigation],
  args: {
    dashboards: sampleSummaries,
    homePath: '/u1/home',
    setDashboardPinned: fn(async () => ({ ok: true as const, pinnedAt: null })),
  },
};

export default meta;
type Story = StoryObj<typeof DashboardsCollection>;

export const Default: Story = {};

/** No dashboards yet: the empty state, with no create button. */
export const Empty: Story = { args: { dashboards: [] } };

/** The page while its dashboards load: the real heading and intro over placeholders. */
export const Loading: Story = {
  render: () => <DashboardsCollectionSkeleton />,
};
