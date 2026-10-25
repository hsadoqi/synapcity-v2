import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  EntityDialog,
  type EntityDialogProps,
} from '@synapcity/frontend-ui/blocks/entity-dialog';
import { Button } from '@synapcity/frontend-ui/core/button';

const fields = (
  <label>
    Name
    <input name="name" defaultValue="Standup" />
  </label>
);

function setup(props: Partial<EntityDialogProps> = {}) {
  const onSubmit = vi.fn();
  render(
    <EntityDialog
      mode="create"
      entityName="event"
      trigger={<Button>Open</Button>}
      onSubmit={onSubmit}
      {...props}
    >
      {fields}
    </EntityDialog>,
  );
  return { onSubmit };
}
const openIt = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Open' }));
  return screen.findByRole('dialog');
};

describe('EntityDialog', () => {
  it('names a create dialog from its entity and offers Create', async () => {
    setup();
    const dialog = await openIt();
    expect(screen.getByRole('dialog', { name: 'New event' })).toBe(dialog);
    expect(
      within(dialog).getByRole('button', { name: 'Create' }),
    ).toBeDefined();
    expect(
      within(dialog).getByRole('button', { name: 'Cancel' }),
    ).toBeDefined();
  });

  it('names an edit dialog and offers Save changes', async () => {
    setup({ mode: 'edit' });
    const dialog = await openIt();
    expect(screen.getByRole('dialog', { name: 'Edit event' })).toBe(dialog);
    expect(
      within(dialog).getByRole('button', { name: 'Save changes' }),
    ).toBeDefined();
  });

  it('takes a custom title, description and labels', async () => {
    setup({
      title: 'Plan the day',
      description: 'Add what you will do.',
      submitLabel: 'Add',
      cancelLabel: 'Never mind',
    });
    const dialog = await openIt();
    expect(screen.getByRole('dialog', { name: 'Plan the day' })).toBe(dialog);
    expect(dialog.textContent).toContain('Add what you will do.');
    expect(within(dialog).getByRole('button', { name: 'Add' })).toBeDefined();
    expect(
      within(dialog).getByRole('button', { name: 'Never mind' }),
    ).toBeDefined();
  });

  it('submits through its own form and closes on success', async () => {
    const { onSubmit } = setup();
    const dialog = await openIt();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('shows pending while saving, locks its buttons and refuses to close', async () => {
    let finish!: () => void;
    const { onSubmit } = setup({
      onSubmit: () => new Promise<void>((resolve) => (finish = resolve)),
    });
    expect(onSubmit).not.toHaveBeenCalled();
    const dialog = await openIt();
    const save = within(dialog).getByRole('button', { name: 'Create' });
    fireEvent.click(save);
    await waitFor(() => expect(save.hasAttribute('disabled')).toBe(true));
    expect(save.getAttribute('aria-busy')).toBe('true');
    expect(
      within(dialog)
        .getByRole('button', { name: 'Cancel' })
        .hasAttribute('disabled'),
    ).toBe(true);

    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeNull();

    finish();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('says it failed, without the error text, and stays open to try again', async () => {
    setup({
      onSubmit: () => Promise.reject(new Error('db password is hunter2')),
      messages: { failed: 'Could not save.' },
    });
    const dialog = await openIt();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create' }));
    const alert = await within(dialog).findByRole('alert');
    expect(alert.textContent).toBe('Could not save.');
    expect(dialog.textContent).not.toContain('hunter2');
    expect(
      within(dialog)
        .getByRole('button', { name: 'Create' })
        .hasAttribute('disabled'),
    ).toBe(false);
  });

  it('can disable Submit while the form is not valid', async () => {
    setup({ submitDisabled: true });
    const dialog = await openIt();
    expect(
      within(dialog)
        .getByRole('button', { name: 'Create' })
        .hasAttribute('disabled'),
    ).toBe(true);
  });

  it('offers Delete only when editing, and asks before deleting', async () => {
    const onDelete = vi.fn();
    setup({ mode: 'edit', entityLabel: 'Standup', onDelete });
    const dialog = await openIt();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    const confirm = await screen.findByRole('alertdialog', {
      name: 'Delete Standup?',
    });
    expect(onDelete).not.toHaveBeenCalled();

    fireEvent.click(within(confirm).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('does not delete when the confirmation is cancelled', async () => {
    const onDelete = vi.fn();
    setup({ mode: 'edit', onDelete });
    const dialog = await openIt();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    const confirm = await screen.findByRole('alertdialog');
    fireEvent.click(within(confirm).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeNull();
  });

  it('offers no Delete when creating, even with onDelete', async () => {
    setup({ mode: 'create', onDelete: vi.fn() });
    const dialog = await openIt();
    expect(within(dialog).queryByRole('button', { name: 'Delete' })).toBeNull();
  });

  it('renders children bare, with no form or footer, when there is no onSubmit', async () => {
    render(
      <EntityDialog mode="create" defaultOpen>
        {({ close }) => (
          <form data-testid="own-form">
            <button type="button" onClick={close}>
              Own cancel
            </button>
          </form>
        )}
      </EntityDialog>,
    );
    const dialog = await screen.findByRole('dialog');
    expect(dialog.querySelectorAll('form')).toHaveLength(1);
    expect(within(dialog).queryByRole('button', { name: 'Create' })).toBeNull();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Own cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('stays controlled by its owner', async () => {
    const onOpenChange = vi.fn();
    render(
      <EntityDialog
        mode="create"
        open
        onOpenChange={onOpenChange}
        onSubmit={vi.fn()}
      >
        {fields}
      </EntityDialog>,
    );
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole('dialog')).not.toBeNull();
  });

  it('renders into a custom container', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    try {
      setup({ container: host });
      const dialog = await openIt();
      expect(host.contains(dialog)).toBe(true);
    } finally {
      host.remove();
    }
  });

  it('opens as a sheet', async () => {
    setup({ presentation: 'sheet', side: 'left' });
    const sheet = await openIt();
    expect(sheet.getAttribute('data-slot')).toBe('sheet-content');
    expect(sheet.getAttribute('data-side')).toBe('left');
    expect(within(sheet).getByRole('button', { name: 'Create' })).toBeDefined();
  });

  it('shows in the page as a named region, with no dialog', () => {
    const onOpenChange = vi.fn();
    render(
      <EntityDialog
        mode="edit"
        entityName="event"
        presentation="inline"
        onOpenChange={onOpenChange}
        onSubmit={vi.fn()}
      >
        {fields}
      </EntityDialog>,
    );
    const region = screen.getByRole('region', { name: 'Edit event' });
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(within(region).getByRole('button', { name: 'Cancel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders nothing inline once the owner closes it', () => {
    render(
      <EntityDialog
        mode="create"
        presentation="inline"
        open={false}
        onSubmit={vi.fn()}
      >
        {fields}
      </EntityDialog>,
    );
    expect(screen.queryByRole('region')).toBeNull();
  });
});
