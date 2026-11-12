import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { StrictMode, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { Button } from '@synapcity/frontend-ui/core/button';

import { defineForm } from '../../../utils';
import { FormDialog, type FormDialogProps } from './index';

const definition = defineForm({
  schema: z.object({ name: z.string().min(1, 'Enter a name.') }),
  fields: [{ type: 'text', name: 'name', label: 'Name' }],
});

type Props = FormDialogProps<typeof definition.schema>;

function setup(props: Partial<Props> = {}) {
  const onSubmit = vi.fn();
  render(
    <FormDialog
      mode="create"
      entityName="event"
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

describe('FormDialog', () => {
  it('names the dialog from the mode and labels the form from it', async () => {
    setup({ mode: 'edit' });
    const dialog = await openIt();
    expect(screen.getByRole('dialog', { name: 'Edit event' })).toBe(dialog);
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

  describe('while a save is pending (DEC-5)', () => {
    afterEach(() => vi.restoreAllMocks());

    /** An `onSubmit` the test settles by hand. */
    function deferred() {
      let settle!: { resolve: () => void; reject: (error: Error) => void };
      const onSubmit = vi.fn(
        () =>
          new Promise<void>((resolve, reject) => {
            settle = { resolve, reject };
          }),
      );
      return { onSubmit, settle: () => settle };
    }
    const startSave = async (dialog: HTMLElement, name = 'Create') => {
      fill(dialog, 'Standup');
      await save(dialog, name);
      const submit = within(dialog).getByRole('button', { name });
      await waitFor(() =>
        expect(submit.getAttribute('aria-busy')).toBe('true'),
      );
      return submit;
    };
    const overlay = () =>
      document.querySelector<HTMLElement>('[data-slot="dialog-overlay"]')!;
    const pressOutside = () =>
      act(async () => {
        fireEvent.pointerDown(overlay());
        fireEvent.mouseDown(overlay());
        fireEvent.pointerUp(overlay());
        fireEvent.mouseUp(overlay());
        fireEvent.click(overlay());
      });

    it('closes on an outside press when nothing is pending', async () => {
      setup();
      await openIt();
      await pressOutside();
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    });

    it('cannot be dismissed by Escape, an outside press or the close button', async () => {
      const { onSubmit } = deferred();
      setup({ onSubmit });
      const dialog = await openIt();
      await startSave(dialog);

      await act(async () => {
        fireEvent.keyDown(dialog, { key: 'Escape' });
      });
      await pressOutside();
      await act(async () => {
        fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
      });
      expect(screen.getByRole('dialog')).toBe(dialog);
    });

    it('keeps Cancel focusable but inert, and Delete inert', async () => {
      const { onSubmit } = deferred();
      const onDelete = vi.fn();
      setup({ onSubmit, mode: 'edit', onDelete });
      const dialog = await openIt();
      await startSave(dialog, 'Save changes');

      const cancel = within(dialog).getByRole('button', { name: 'Cancel' });
      expect(cancel.getAttribute('aria-disabled')).toBe('true');
      expect(cancel.hasAttribute('disabled')).toBe(false);
      act(() => cancel.focus());
      expect(document.activeElement).toBe(cancel);
      await act(async () => {
        fireEvent.click(cancel);
        fireEvent.keyDown(cancel, { key: 'Enter' });
        fireEvent.keyUp(cancel, { key: 'Enter' });
        fireEvent.keyDown(cancel, { key: ' ' });
        fireEvent.keyUp(cancel, { key: ' ' });
      });
      expect(screen.getByRole('dialog')).toBe(dialog);

      const remove = within(dialog).getByRole('button', { name: 'Delete' });
      expect(remove.hasAttribute('disabled')).toBe(true);
      await act(async () => {
        fireEvent.click(remove);
      });
      expect(screen.queryByRole('alertdialog')).toBeNull();
      expect(onDelete).not.toHaveBeenCalled();
    });

    it('does not submit twice from a second click or Enter', async () => {
      const { onSubmit } = deferred();
      setup({ onSubmit });
      const dialog = await openIt();
      const submit = await startSave(dialog);
      await act(async () => {
        fireEvent.click(submit);
        fireEvent.keyDown(within(dialog).getByLabelText('Name'), {
          key: 'Enter',
        });
        fireEvent.submit(submit.closest('form')!);
      });
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('closes once the save resolves and returns focus to the opener', async () => {
      const { onSubmit, settle } = deferred();
      setup({ onSubmit });
      const dialog = await openIt();
      await startSave(dialog);
      await act(async () => settle().resolve());
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      await waitFor(() =>
        expect(document.activeElement).toBe(
          screen.getByRole('button', { name: 'Open' }),
        ),
      );
    });

    it.each([
      [
        'rejects',
        (s: ReturnType<ReturnType<typeof deferred>['settle']>) =>
          s.reject(new Error('secret detail')),
      ],
    ])(
      'clears pending and stays open to retry or cancel when the save %s',
      async (_, fail) => {
        const { onSubmit, settle } = deferred();
        setup({ onSubmit, messages: { failed: 'Could not save.' } });
        const dialog = await openIt();
        const submit = await startSave(dialog);
        await act(async () => fail(settle()));

        expect(
          await within(dialog).findByText('Could not save.'),
        ).toBeDefined();
        expect(dialog.textContent).not.toContain('secret detail');
        expect(submit.getAttribute('aria-busy')).toBeNull();
        expect(submit.hasAttribute('disabled')).toBe(false);
        const cancel = within(dialog).getByRole('button', { name: 'Cancel' });
        expect(cancel.getAttribute('aria-disabled')).not.toBe('true');

        await save(dialog);
        expect(onSubmit).toHaveBeenCalledTimes(2);
        await act(async () => settle().reject(new Error('again')));
        await waitFor(() =>
          expect(submit.getAttribute('aria-busy')).toBeNull(),
        );
        fireEvent.click(cancel);
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      },
    );

    it('clears pending and stays open when the save throws synchronously', async () => {
      const onSubmit = vi.fn(() => {
        throw new Error('secret detail');
      });
      setup({ onSubmit, messages: { failed: 'Could not save.' } });
      const dialog = await openIt();
      fill(dialog, 'Standup');
      await save(dialog);
      expect(await within(dialog).findByText('Could not save.')).toBeDefined();
      const submit = within(dialog).getByRole('button', { name: 'Create' });
      expect(submit.getAttribute('aria-busy')).toBeNull();
      await act(async () => {
        fireEvent.keyDown(dialog, { key: 'Escape' });
      });
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    });

    it('ignores a save that settles after the owner unmounts it', async () => {
      const errors = vi.spyOn(console, 'error');
      const { onSubmit, settle } = deferred();
      const onOpenChange = vi.fn();
      function Owner() {
        const [shown, setShown] = useState(true);
        return (
          <>
            <button type="button" onClick={() => setShown(false)}>
              Remove
            </button>
            {shown && (
              <FormDialog
                mode="create"
                entityName="event"
                defaultOpen
                onOpenChange={onOpenChange}
                definition={definition}
                onSubmit={onSubmit}
              />
            )}
          </>
        );
      }
      render(<Owner />);
      const dialog = await screen.findByRole('dialog');
      await startSave(dialog);
      fireEvent.click(
        screen.getByRole('button', { name: 'Remove', hidden: true }),
      );
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      await act(async () => settle().resolve());
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(errors).not.toHaveBeenCalled();
    });

    it('shows the close button disabled while saving', async () => {
      const { onSubmit, settle } = deferred();
      setup({ onSubmit });
      const dialog = await openIt();
      const close = () => within(dialog).getByRole('button', { name: 'Close' });
      expect(close().hasAttribute('disabled')).toBe(false);
      await startSave(dialog);
      expect(close().hasAttribute('disabled')).toBe(true);
      await act(async () => settle().resolve());
    });

    it('does not close a dialog the owner reopened while an earlier save ran', async () => {
      const { onSubmit, settle } = deferred();
      const onOpenChange = vi.fn();
      const view = (open: boolean) => (
        <FormDialog
          mode="create"
          entityName="event"
          open={open}
          onOpenChange={onOpenChange}
          definition={definition}
          onSubmit={onSubmit}
        />
      );
      const { rerender } = render(view(true));
      const dialog = await screen.findByRole('dialog');
      await startSave(dialog);

      // The owner closes and reopens it (its own state, not a dismissal).
      rerender(view(false));
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      rerender(view(true));
      const reopened = await screen.findByRole('dialog');
      await act(async () => settle().resolve());

      expect(onOpenChange).not.toHaveBeenCalledWith(false);
      expect(screen.getByRole('dialog')).toBe(reopened);
      expect(
        within(reopened)
          .getByRole('button', { name: 'Close' })
          .hasAttribute('disabled'),
      ).toBe(false);
    });

    it('is not left busy under Strict Mode after a save', async () => {
      const { onSubmit, settle } = deferred();
      render(
        <StrictMode>
          <FormDialog
            mode="create"
            entityName="event"
            trigger={<Button>Open</Button>}
            definition={definition}
            onSubmit={onSubmit}
          />
        </StrictMode>,
      );
      let dialog = await openIt();
      await startSave(dialog);
      await act(async () => settle().resolve());
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

      dialog = await openIt();
      await act(async () => {
        fireEvent.keyDown(dialog, { key: 'Escape' });
      });
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    });
  });
});
