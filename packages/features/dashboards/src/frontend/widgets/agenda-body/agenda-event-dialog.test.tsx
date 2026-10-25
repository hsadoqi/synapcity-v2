import { localStartsAt } from '@synapcity/domain-prototypes';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AgendaEventDialog } from './agenda-event-dialog';

const setup = () => {
  const onAdd = vi.fn();
  const onOpenChange = vi.fn();
  render(
    <AgendaEventDialog
      open
      onOpenChange={onOpenChange}
      day="2026-10-22"
      onAdd={onAdd}
    />,
  );
  return { onAdd, onOpenChange };
};
const submit = (dialog: HTMLElement) =>
  act(async () => {
    fireEvent.submit(
      within(dialog)
        .getByRole('button', { name: 'Add event' })
        .closest('form')!,
    );
  });

describe('AgendaEventDialog', () => {
  it('is an Add event dialog that starts on the given day at nine', async () => {
    setup();
    const dialog = await screen.findByRole('dialog', { name: 'New event' });
    expect(within(dialog).getByLabelText('Name')).toBeDefined();
    expect(
      (within(dialog).getByLabelText('Start time') as HTMLInputElement).value,
    ).toBe('09:00');
    expect(
      dialog.querySelector<HTMLInputElement>('input[name="date"]')?.value,
    ).toBe('2026-10-22');
  });

  it('adds the event at its local start time and closes', async () => {
    const { onAdd, onOpenChange } = setup();
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Name'), {
      target: { value: 'Dentist' },
    });
    fireEvent.change(within(dialog).getByLabelText('Start time'), {
      target: { value: '14:30' },
    });
    await submit(dialog);
    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
    expect(onAdd).toHaveBeenCalledWith(
      'Dentist',
      localStartsAt('2026-10-22', '14:30'),
    );
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('asks for a name and adds nothing without one', async () => {
    const { onAdd } = setup();
    const dialog = await screen.findByRole('dialog');
    await submit(dialog);
    expect(within(dialog).getByText('Enter a name.')).toBeDefined();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('asks for a start time when it is cleared', async () => {
    const { onAdd } = setup();
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Name'), {
      target: { value: 'Dentist' },
    });
    fireEvent.change(within(dialog).getByLabelText('Start time'), {
      target: { value: '' },
    });
    await submit(dialog);
    expect(within(dialog).getByText('Enter a start time.')).toBeDefined();
    expect(onAdd).not.toHaveBeenCalled();
  });
});
