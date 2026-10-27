import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/records/create-record-action', () => ({
  createRecord: vi.fn(),
}));

import { QuickCreateDialog } from '.';

const create = vi.fn();
const onCreated = vi.fn();
const onOpenChange = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  create.mockResolvedValue({ ok: true, id: 'new-id' });
});

function renderDialog(kind: 'space' | 'document' | 'dashboard' | null) {
  return render(
    <QuickCreateDialog
      kind={kind}
      userId="user-1"
      create={create}
      onCreated={onCreated}
      onOpenChange={onOpenChange}
    />,
  );
}

async function typeName(value: string) {
  const name = await screen.findByRole('textbox', { name: 'Name' });
  fireEvent.change(name, { target: { value } });
  return name as HTMLInputElement;
}

describe('QuickCreateDialog', () => {
  it('is closed until there is something to create', () => {
    renderDialog(null);

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('asks for a name for the kind it was opened for', async () => {
    renderDialog('document');

    expect(
      await screen.findByRole('dialog', { name: 'New document' }),
    ).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeTruthy();
  });

  it('creates a Space and opens it', async () => {
    renderDialog('space');
    await typeName('Garden plans');

    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() =>
      expect(onCreated).toHaveBeenCalledWith('/user-1/home/spaces/new-id'),
    );
    expect(create).toHaveBeenCalledWith('space', 'Garden plans');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it.each([
    ['document', '/user-1/home/documents'],
    ['dashboard', '/user-1/home/dashboards'],
  ] as const)(
    'creates a %s and shows it in its list, which has no page for one yet',
    async (kind, href) => {
      renderDialog(kind);
      await typeName('Launch plan');

      fireEvent.click(screen.getByRole('button', { name: 'Create' }));

      await waitFor(() => expect(onCreated).toHaveBeenCalledWith(href));
    },
  );

  it('says Creating… and blocks a second submit while it saves', async () => {
    let finish!: (value: unknown) => void;
    create.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    renderDialog('space');
    await typeName('Garden plans');

    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    const pending = await screen.findByRole('button', { name: 'Creating…' });
    expect((pending as HTMLButtonElement).disabled).toBe(true);
    fireEvent.submit(pending.closest('form')!);
    expect(create).toHaveBeenCalledTimes(1);
    finish({ ok: true, id: 'new-id' });
    await waitFor(() => expect(onCreated).toHaveBeenCalled());
  });

  it('asks for a name instead of saving a blank one', async () => {
    renderDialog('dashboard');
    const name = await typeName('   ');

    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      'Give it a name.',
    );
    expect(name.getAttribute('aria-invalid')).toBe('true');
    expect(create).not.toHaveBeenCalled();
  });

  it('keeps the typed name and shows the error when saving fails', async () => {
    create.mockResolvedValue({
      ok: false,
      error: 'Could not save your changes. Try again.',
    });
    renderDialog('document');
    const name = await typeName('Launch plan');

    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Could not save your changes. Try again.',
    );
    expect(name.value).toBe('Launch plan');
    expect(onCreated).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('offers sign-in when the session has ended', async () => {
    create.mockResolvedValue({
      ok: false,
      error: 'Sign in again to update your profile.',
      signedOut: true,
    });
    renderDialog('space');
    await typeName('Garden plans');

    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    const link = await screen.findByRole('link', { name: 'Sign in again' });
    expect(link.getAttribute('href')).toBe(
      '/auth/login?next=%2Fuser-1%2Fhome%2Fspaces',
    );
  });

  it('closes from Cancel', async () => {
    renderDialog('dashboard');

    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(create).not.toHaveBeenCalled();
  });
});
