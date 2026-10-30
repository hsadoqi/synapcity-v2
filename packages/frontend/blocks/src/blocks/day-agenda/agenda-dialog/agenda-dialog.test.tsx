import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from '@synapcity/frontend-ui/core/button';
import { AgendaDialog } from '@/blocks/day-agenda/agenda-dialog';

const renderDialog = (children?: React.ReactNode) =>
  render(
    <AgendaDialog
      title="Settings"
      description="Manage your agenda preferences"
      trigger={<Button>Open</Button>}
    >
      {children}
    </AgendaDialog>,
  );

describe('AgendaDialog', () => {
  it('renders the given body', async () => {
    renderDialog(<p>Week starts on Monday</p>);
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    const dialog = await screen.findByRole('dialog', { name: 'Settings' });
    expect(dialog.textContent).toContain('Week starts on Monday');
    expect(dialog.textContent).not.toContain('Settings content goes here.');
  });

  it('falls back to placeholder rows without a body', async () => {
    renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog.textContent).toContain('Settings content goes here.');
  });
});
