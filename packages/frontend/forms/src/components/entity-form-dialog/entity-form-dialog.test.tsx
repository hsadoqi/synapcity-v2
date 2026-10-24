import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { Button } from '@synapcity/frontend-ui/core/button';

import { defineForm } from '../../utils';
import { EntityFormDialog, type EntityFormDialogProps } from './index';

const definition = defineForm({
  schema: z.object({ name: z.string().min(1, 'Enter a name.') }),
  fields: [{ type: 'text', name: 'name', label: 'Name' }],
});

type Props = EntityFormDialogProps<typeof definition.schema>;

function setup(props: Partial<Props> = {}) {
  const onSubmit = vi.fn();
  render(
    <EntityFormDialog
      mode="create"
      entityName="time slot"
      trigger={<Button>Open</Button>}
      definition={definition}
      onSubmit={onSubmit}
      {...props}
    />,
  );
  return { onSubmit };
}
const openIt = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Open' }));
  return screen.findByRole('dialog');
};
const fill = (dialog: HTMLElement, value: string) =>
  fireEvent.change(within(dialog).getByLabelText('Name'), {
    target: { value },
  });
const save = (dialog: HTMLElement, name = 'Create') =>
  act(async () => {
    fireEvent.submit(
      within(dialog).getByRole('button', { name }).closest('form')!,
    );
  });

describe('EntityFormDialog', () => {
  it('names the dialog from the mode and labels the form from it', async () => {
    setup({ mode: 'edit' });
    const dialog = await openIt();
    expect(screen.getByRole('dialog', { name: 'Edit time slot' })).toBe(dialog);
    expect(
      within(dialog).getByRole('button', { name: 'Save changes' }),
    ).toBeDefined();
  });

  it('shows the form once, with no second form or footer from the shell', async () => {
    setup();
    const dialog = await openIt();
    expect(dialog.querySelectorAll('form')).toHaveLength(1);
    expect(
      within(dialog).getAllByRole('button', { name: 'Create' }),
    ).toHaveLength(1);
    expect(
      within(dialog).getAllByRole('button', { name: 'Cancel' }),
    ).toHaveLength(1);
  });

  it('seeds the fields from initialValues', async () => {
    setup({ mode: 'edit', initialValues: { name: 'Standup' } });
    const dialog = await openIt();
    expect(
      (within(dialog).getByLabelText('Name') as HTMLInputElement).value,
    ).toBe('Standup');
  });

  it('submits the validated values and closes on success', async () => {
    const { onSubmit } = setup();
    const dialog = await openIt();
    fill(dialog, 'Standup');
    await save(dialog);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ name: 'Standup' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('keeps it open when closeOnSuccess is false', async () => {
    const { onSubmit } = setup({ closeOnSuccess: false });
    const dialog = await openIt();
    fill(dialog, 'Standup');
    await save(dialog);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('dialog')).not.toBeNull();
  });

  it('does not submit or close while a field is invalid', async () => {
    const { onSubmit } = setup();
    const dialog = await openIt();
    await save(dialog);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(within(dialog).getByText('Enter a name.')).toBeDefined();
    expect(screen.queryByRole('dialog')).not.toBeNull();
  });

  it("stays open and uses the form's own failure message when the save throws", async () => {
    setup({
      onSubmit: () => Promise.reject(new Error('secret detail')),
      messages: { failed: 'Could not save.' },
    });
    const dialog = await openIt();
    fill(dialog, 'Standup');
    await save(dialog);
    expect(await within(dialog).findByText('Could not save.')).toBeDefined();
    expect(dialog.textContent).not.toContain('secret detail');
    expect(screen.queryByRole('dialog')).not.toBeNull();
  });

  it('closes from the form’s Cancel', async () => {
    setup();
    const dialog = await openIt();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('confirms and deletes through the shell, editing only', async () => {
    const onDelete = vi.fn();
    setup({ mode: 'edit', entityLabel: 'Standup', onDelete });
    const dialog = await openIt();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    const confirm = await screen.findByRole('alertdialog', {
      name: 'Delete Standup?',
    });
    fireEvent.click(within(confirm).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(1));
  });

  it('opens as a sheet', async () => {
    setup({ presentation: 'sheet' });
    const sheet = await openIt();
    expect(sheet.getAttribute('data-slot')).toBe('sheet-content');
    expect(within(sheet).getByLabelText('Name')).toBeDefined();
  });
});
