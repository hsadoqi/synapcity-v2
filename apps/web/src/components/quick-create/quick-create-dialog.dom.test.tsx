import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { QuickCreateDialog } from '.';

describe('QuickCreateDialog', () => {
  it('is closed until there is something to create', () => {
    render(<QuickCreateDialog kind={null} onOpenChange={() => {}} />);

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('asks for a name for the kind it was opened for', async () => {
    render(<QuickCreateDialog kind="document" onOpenChange={() => {}} />);

    expect(
      await screen.findByRole('dialog', { name: 'New document' }),
    ).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeTruthy();
  });

  it('says creating is not available yet and keeps Create disabled', async () => {
    render(<QuickCreateDialog kind="space" onOpenChange={() => {}} />);
    const name = await screen.findByRole('textbox', { name: 'Name' });

    fireEvent.change(name, { target: { value: 'Garden plans' } });
    expect(
      (screen.getByRole('button', { name: 'Create' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(name.getAttribute('aria-describedby')).toBeTruthy();
    expect(
      screen.getByText('Creating a space is not available yet.'),
    ).toBeTruthy();
  });

  it('closes from Cancel', async () => {
    const onOpenChange = vi.fn();
    render(<QuickCreateDialog kind="dashboard" onOpenChange={onOpenChange} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
  });
});
