import { addWidget, createWidget } from '@synapcity/domain-dashboards';
import { localStartsAt } from '@synapcity/domain-prototypes';
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { Profiler } from 'react';
import { describe, expect, it } from 'vitest';

import {
  renderWithStore,
  SEED_NOW,
  SEED_OWNER,
  seededWorkspace,
} from '../../../testing';
import { ConnectedWidget } from './index';

describe('ConnectedWidget', () => {
  it('binds the shell actions to the store', async () => {
    const { store } = renderWithStore(<ConnectedWidget widgetId="wgt_seed1" />);
    const widget = store().getState().composition.widgets[0]!;
    act(() => store().getState().toggleEditMode());
    fireEvent.click(
      await screen.findByRole('button', {
        name: `Settings for ${widget.title}`,
      }),
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Hide widget' }));
    expect(store().getState().composition.widgets[0]?.status).toBe('hidden');
  });

  it('binds the body actions to the store', () => {
    const { store } = renderWithStore(<p />);
    const tasks = store()
      .getState()
      .composition.widgets.find((w) => w.type === 'tasks')!;
    const { store: own } = renderWithStore(
      <ConnectedWidget widgetId={tasks.id} />,
    );
    const before = own().getState().records.task;
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Write launch notes' }),
    );
    expect(own().getState().records.task).not.toBe(before);
  });

  it('does not re-render a widget when records it does not show change', () => {
    let statRenders = 0;
    const { store } = renderWithStore(
      <Profiler id="stat" onRender={() => statRenders++}>
        <ConnectedWidget widgetId="wgt_seed1" />
      </Profiler>,
    );
    const before = statRenders;
    const taskId = Object.keys(store().getState().records.task)[0]!;
    act(() => store().getState().toggleTask(taskId));
    expect(statRenders).toBe(before);
  });

  it('re-renders a widget when the records it shows change', () => {
    let statRenders = 0;
    const { store } = renderWithStore(
      <Profiler id="stat" onRender={() => statRenders++}>
        <ConnectedWidget widgetId="wgt_seed1" />
      </Profiler>,
    );
    const before = statRenders;
    const metric = Object.values(store().getState().records.metric)[0]!;
    act(() =>
      store().setState((s) => ({
        records: {
          ...s.records,
          metric: {
            ...s.records.metric,
            [metric.id]: { ...metric, value: 99 },
          },
        },
      })),
    );
    expect(statRenders).toBeGreaterThan(before);
    expect(
      screen.getByRole('spinbutton', { name: `${metric.name} value` }),
    ).toHaveProperty('value', '99');
  });

  describe('an agenda widget', () => {
    function withAgenda() {
      const { composition, records } = seededWorkspace();
      const created = createWidget('agenda', records, {
        ownerId: SEED_OWNER,
        now: SEED_NOW,
      });
      return {
        id: created.widget.id,
        overrides: {
          composition: addWidget(composition, created.widget),
          records: created.records,
        },
      };
    }

    it('adds an event on the day shown, and the agenda lists it', async () => {
      const { id, overrides } = withAgenda();
      const { store } = renderWithStore(
        <ConnectedWidget widgetId={id} />,
        overrides,
      );
      // SEED_NOW is Friday 23 October; go back to Thursday 22.
      fireEvent.click(screen.getByRole('button', { name: 'Previous day' }));
      fireEvent.click(screen.getByRole('button', { name: 'Add event' }));

      const dialog = await screen.findByRole('dialog', { name: 'New event' });
      expect(
        dialog.querySelector<HTMLInputElement>('input[name="date"]')?.value,
      ).toBe('2026-10-22');
      fireEvent.change(within(dialog).getByLabelText('Name'), {
        target: { value: 'Dentist' },
      });
      await act(async () => {
        fireEvent.submit(
          within(dialog)
            .getByRole('button', { name: 'Add event' })
            .closest('form')!,
        );
      });

      await waitFor(() =>
        expect(
          Object.values(store().getState().records.event).map((e) => e.name),
        ).toContain('Dentist'),
      );
      const added = Object.values(store().getState().records.event).find(
        (e) => e.name === 'Dentist',
      );
      expect(added?.startsAt).toBe(localStartsAt('2026-10-22', '09:00'));
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(screen.getByText('Dentist')).toBeDefined();
    });

    it('adds nothing when the form is refused', async () => {
      const { id, overrides } = withAgenda();
      const { store } = renderWithStore(
        <ConnectedWidget widgetId={id} />,
        overrides,
      );
      const before = store().getState().records.event;
      fireEvent.click(screen.getByRole('button', { name: 'Add event' }));
      const dialog = await screen.findByRole('dialog');
      await act(async () => {
        fireEvent.submit(
          within(dialog)
            .getByRole('button', { name: 'Add event' })
            .closest('form')!,
        );
      });
      expect(within(dialog).getByText('Enter a name.')).toBeDefined();
      expect(store().getState().records.event).toBe(before);
    });

    it('is the only widget with an Add event action', () => {
      const { store } = renderWithStore(<p />);
      const tasks = store()
        .getState()
        .composition.widgets.find((w) => w.type === 'tasks')!;
      renderWithStore(<ConnectedWidget widgetId={tasks.id} />);
      expect(screen.queryByRole('button', { name: 'Add event' })).toBeNull();
    });
  });
});
