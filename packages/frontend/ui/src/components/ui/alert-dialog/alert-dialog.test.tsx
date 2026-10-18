import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@synapcity/frontend-ui/core/alert-dialog';

const renderDialog = ({
  rootProps = {},
  contentProps = {},
  onAction = () => {},
}: {
  rootProps?: Record<string, unknown>;
  contentProps?: Record<string, unknown>;
  onAction?: () => void;
} = {}) =>
  render(
    <AlertDialog {...rootProps}>
      <AlertDialogTrigger>Delete</AlertDialogTrigger>
      <AlertDialogContent {...contentProps}>
        <AlertDialogHeader data-testid="header">
          <AlertDialogMedia data-testid="media">!</AlertDialogMedia>
          <AlertDialogTitle>Delete note?</AlertDialogTitle>
          <AlertDialogDescription>
            This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter data-testid="footer">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onAction}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>,
  );

describe('AlertDialog', () => {
  it('opens from its trigger as a named alertdialog', async () => {
    renderDialog();
    expect(screen.queryByRole('alertdialog')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('alertdialog', {
      name: 'Delete note?',
    });

    expect(dialog.getAttribute('data-slot')).toBe('alert-dialog-content');
    expect(
      screen.getByText('This cannot be undone.').getAttribute('data-slot'),
    ).toBe('alert-dialog-description');
  });

  it('can start open', async () => {
    renderDialog({ rootProps: { defaultOpen: true } });

    expect(await screen.findByRole('alertdialog')).toBeTruthy();
  });

  it('closes when Cancel is activated', async () => {
    renderDialog({ rootProps: { defaultOpen: true } });
    await screen.findByRole('alertdialog');

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
  });

  it('runs the action handler from the Action button', async () => {
    const onAction = vi.fn();
    renderDialog({ rootProps: { defaultOpen: true }, onAction });
    await screen.findByRole('alertdialog');

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('reports open state changes', async () => {
    const onOpenChange = vi.fn();
    renderDialog({ rootProps: { onOpenChange } });

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await screen.findByRole('alertdialog');

    expect(onOpenChange).toHaveBeenCalledWith(true, expect.any(Object));
  });

  it('is controlled when given open', async () => {
    const { rerender } = render(
      <AlertDialog open={false}>
        <AlertDialogTrigger>Delete</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Delete note?</AlertDialogTitle>
        </AlertDialogContent>
      </AlertDialog>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();

    rerender(
      <AlertDialog open>
        <AlertDialogTrigger>Delete</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Delete note?</AlertDialogTitle>
        </AlertDialogContent>
      </AlertDialog>,
    );
    expect(await screen.findByRole('alertdialog')).toBeTruthy();
  });

  it('defaults to the default size and honours sm', async () => {
    const { unmount } = renderDialog({ rootProps: { defaultOpen: true } });
    expect(
      (await screen.findByRole('alertdialog')).getAttribute('data-size'),
    ).toBe('default');
    unmount();

    renderDialog({
      rootProps: { defaultOpen: true },
      contentProps: { size: 'sm' },
    });
    expect(
      (await screen.findByRole('alertdialog')).getAttribute('data-size'),
    ).toBe('sm');
  });

  it('marks slots on header, media, footer, action and cancel', async () => {
    renderDialog({ rootProps: { defaultOpen: true } });
    await screen.findByRole('alertdialog');

    expect(screen.getByTestId('header').getAttribute('data-slot')).toBe(
      'alert-dialog-header',
    );
    expect(screen.getByTestId('media').getAttribute('data-slot')).toBe(
      'alert-dialog-media',
    );
    expect(screen.getByTestId('footer').getAttribute('data-slot')).toBe(
      'alert-dialog-footer',
    );
    expect(
      screen.getByRole('button', { name: 'Confirm' }).getAttribute('data-slot'),
    ).toBe('alert-dialog-action');
    expect(
      screen.getByRole('button', { name: 'Cancel' }).getAttribute('data-slot'),
    ).toBe('alert-dialog-cancel');
  });

  it('renders its overlay', async () => {
    renderDialog({ rootProps: { defaultOpen: true } });
    await screen.findByRole('alertdialog');

    expect(
      document.querySelector('[data-slot="alert-dialog-overlay"]'),
    ).not.toBeNull();
  });
});
