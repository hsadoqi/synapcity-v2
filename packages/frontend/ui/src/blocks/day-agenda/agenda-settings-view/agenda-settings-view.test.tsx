import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { AgendaSettingsView } from '@synapcity/frontend-ui/blocks/day-agenda/agenda-settings-view';

describe('AgendaSettingsView', () => {
  it('is a region named by its title, focused on open, with its body', () => {
    render(
      <AgendaSettingsView
        title="Settings"
        description="Preferences"
        onDone={vi.fn()}
      >
        <p>Week starts on Monday</p>
      </AgendaSettingsView>,
    );
    const region = screen.getByRole('region', { name: 'Settings' });
    expect(region.textContent).toContain('Week starts on Monday');
    expect(document.activeElement).toBe(
      screen.getByRole('heading', { name: 'Settings' }),
    );
  });

  it('calls onDone and returns focus to the opener when closed', () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open
          </button>
          {open && (
            <AgendaSettingsView
              title="Settings"
              onDone={() => setOpen(false)}
            />
          )}
        </>
      );
    }
    render(<Harness />);
    const opener = screen.getByRole('button', { name: 'Open' });
    opener.focus();
    fireEvent.click(opener);
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('region')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });
});
