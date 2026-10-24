import { act, fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithStore } from '../../../testing/render-with-store';
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
});
