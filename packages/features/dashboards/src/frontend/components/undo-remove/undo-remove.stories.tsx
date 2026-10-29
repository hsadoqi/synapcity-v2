import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';

import { withDashboardStore } from '../../../testing';
import { UndoRemove } from './index';

const meta: Meta<typeof UndoRemove> = {
  title: 'Dashboards/UndoRemove',
  component: UndoRemove,
};

export default meta;
type Story = StoryObj<typeof UndoRemove>;

export const AfterRemoval: Story = {
  decorators: [
    withDashboardStore({
      onReady: (store) =>
        store
          .getState()
          .removeWidget(store.getState().composition.widgets[0]!.id),
    }),
  ],
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('button', { name: /^Undo remove/ }),
    ).toBeVisible();
  },
};
