import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { sampleSummaries, withStubNavigation } from '../../../testing';
import { DashboardsIndex } from './dashboards-index';

const meta: Meta<typeof DashboardsIndex> = {
  title: 'Dashboards/DashboardsIndex',
  component: DashboardsIndex,
  tags: ['autodocs'],
  decorators: [withStubNavigation],
  args: {
    dashboards: sampleSummaries,
    homePath: '/u1/home',
    now: '2026-10-20T12:00:00Z',
    setDashboardPinned: fn(async () => ({
      ok: true as const,
      pinnedAt: '2026-10-20T12:00:00Z',
    })),
  },
};

export default meta;
type Story = StoryObj<typeof DashboardsIndex>;

export const Default: Story = {};

/** Pin in a dashboard's menu saves through the host's action. */
export const PinsThroughTheHost: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);

    await userEvent.click(
      canvas.getAllByRole('button', {
        name: 'Actions for Word count tracker',
      })[0]!,
    );
    await userEvent.click(await page.findByRole('menuitem', { name: 'Pin' }));

    await expect(args.setDashboardPinned).toHaveBeenCalledWith(
      'fixture-dashboard-word-count',
      true,
    );
    // Let the menu finish closing so its focus guards are gone before the
    // a11y check runs on the settled story.
    await waitFor(() => expect(page.queryByRole('menu')).toBeNull());
  },
};
