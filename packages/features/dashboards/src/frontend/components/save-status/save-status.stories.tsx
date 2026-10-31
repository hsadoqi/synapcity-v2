import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';

import { withDashboardStore } from '../../../testing';
import { DashboardConfigProvider } from '../../config';
import { SaveStatusIndicator } from './index';

const meta: Meta<typeof SaveStatusIndicator> = {
  title: 'Dashboards/SaveStatusIndicator',
  component: SaveStatusIndicator,
};

export default meta;
type Story = StoryObj<typeof SaveStatusIndicator>;

/** Each state starts the store at that status, as the save scheduler would leave it. */
function atStatus(
  status: 'saved' | 'unsaved' | 'saving' | 'failed' | 'conflict',
  message?: string,
) {
  return withDashboardStore({
    onReady: (store) => store.getState().setSaveStatus(status, message),
  });
}

export const Saved: Story = { decorators: [atStatus('saved')] };
export const Unsaved: Story = { decorators: [atStatus('unsaved')] };
export const Saving: Story = { decorators: [atStatus('saving')] };

export const NotSaved: Story = {
  decorators: [atStatus('failed', 'Sign in again to save your changes.')],
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('button', { name: 'Retry' }),
    ).toBeVisible();
  },
};

export const ChangedElsewhere: Story = {
  decorators: [
    atStatus('conflict'),
    (Story) => (
      <DashboardConfigProvider onReload={() => {}}>
        <Story />
      </DashboardConfigProvider>
    ),
  ],
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('button', { name: 'Reload' }),
    ).toBeVisible();
  },
};
