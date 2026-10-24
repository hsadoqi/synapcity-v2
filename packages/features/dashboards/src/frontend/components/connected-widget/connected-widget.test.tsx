import { act, fireEvent, screen } from '@testing-library/react';
import { Profiler } from 'react';
import { describe, expect, it } from 'vitest';

import { renderWithStore } from '../../../testing';
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
    expect(screen.getByText('99')).toBeDefined();
  });
});
