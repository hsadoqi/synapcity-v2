import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmDialog } from '@synapcity/frontend-ui/components/confirm-dialog';

function renderDialog(
  // Handlers stay mocks so tests can inspect them; only the data is overridable.
  overrides: Partial<
    Omit<Parameters<typeof ConfirmDialog>[0], 'onOpenChange' | 'onConfirm'>
  > = {},
) {
  const props = {
    open: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Delete “Weekly review”?',
    description: 'This cannot be undone.',
    confirmText: 'Delete document',
    cancelText: 'Keep it',
    ...overrides,
  };
  render(<ConfirmDialog {...props} />);
  return props;
}

describe('ConfirmDialog', () => {
  it('is an alert dialog named by its title and described by its text', async () => {
    renderDialog();
    const dialog = await screen.findByRole('alertdialog');

    expect(dialog.textContent).toContain('Delete “Weekly review”?');
    expect(dialog.textContent).toContain('This cannot be undone.');
  });

  it('confirms, then asks to close', async () => {
    const { onConfirm, onOpenChange } = renderDialog();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Delete document' }),
    );

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes on cancel without confirming', async () => {
    const { onConfirm, onOpenChange } = renderDialog();
    fireEvent.click(await screen.findByRole('button', { name: 'Keep it' }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalled());
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('renders nothing while closed', () => {
    renderDialog({ open: false });

    expect(screen.queryByRole('alertdialog')).toBeNull();
  });
});
