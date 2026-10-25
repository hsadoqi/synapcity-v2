import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { addWidget, createWidget } from '@synapcity/domain-dashboards';
import { expect, screen, userEvent, waitFor, within } from 'storybook/test';

import {
  SEED_NOW,
  SEED_OWNER,
  seededWorkspace,
  withDashboardStore,
} from '../../../testing';
import { ConnectedWidget } from './index';

const meta: Meta<typeof ConnectedWidget> = {
  title: 'Dashboards/ConnectedWidget',
  component: ConnectedWidget,
  decorators: [
    (Story) => (
      <div className="h-64 w-80">
        <Story />
      </div>
    ),
  ],
  args: { widgetId: 'wgt_seed7' },
};

export default meta;
type Story = StoryObj<typeof ConnectedWidget>;

export const TaskList: Story = { decorators: [withDashboardStore()] };

export const Editing: Story = {
  decorators: [withDashboardStore({ editMode: true })],
};

/** The seeded dashboard plus an agenda widget, with its id. */
const withAgenda = () => {
  const { composition, records } = seededWorkspace();
  const created = createWidget('agenda', records, {
    ownerId: SEED_OWNER,
    now: SEED_NOW,
  });
  return {
    id: created.widget.id,
    init: {
      composition: addWidget(composition, created.widget),
      records: created.records,
    },
  };
};
const agenda = withAgenda();

/** Add event from the widget's toolbar: the form opens on the day shown and the event lands in the agenda. */
export const AgendaAddEvent: Story = {
  args: { widgetId: agenda.id },
  decorators: [
    (Story) => (
      <div className="h-96 w-lg">
        <Story />
      </div>
    ),
    withDashboardStore(agenda.init),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Add event' }));
    const dialog = await screen.findByRole('dialog', { name: 'New event' });
    await userEvent.type(within(dialog).getByLabelText('Name'), 'Dentist');
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Add event' }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    // SEED_NOW's day, where the new event was added at the default nine.
    await expect(await canvas.findByText('Dentist')).toBeVisible();
  },
};
