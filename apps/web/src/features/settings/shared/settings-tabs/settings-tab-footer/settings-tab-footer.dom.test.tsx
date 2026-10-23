import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SettingsTabFooter } from './settings-tab-footer';

const props = {
  tab: 'Regional',
  hasChanges: false,
  atDefaults: false,
  onSave: vi.fn(),
  onDiscard: vi.fn(),
  onReset: vi.fn(),
};

const disabled = (name: string) =>
  screen.getByRole('button', { name }).getAttribute('aria-disabled') === 'true';

describe('SettingsTabFooter', () => {
  it('names the tab its reset covers', () => {
    render(<SettingsTabFooter {...props} />);
    expect(
      screen.getByRole('button', { name: 'Reset Regional to defaults' }),
    ).toBeTruthy();
  });

  it('offers save and discard only while there is something to save', () => {
    const { rerender } = render(<SettingsTabFooter {...props} />);
    expect(disabled('Save changes')).toBe(true);
    expect(disabled('Discard')).toBe(true);

    rerender(<SettingsTabFooter {...props} hasChanges />);
    expect(disabled('Save changes')).toBe(false);
    expect(disabled('Discard')).toBe(false);
    expect(screen.getByRole('status').textContent).toBe(
      'You have unsaved changes.',
    );
  });

  it('offers reset only while something differs from the defaults', () => {
    const { rerender } = render(<SettingsTabFooter {...props} atDefaults />);
    expect(disabled('Reset Regional to defaults')).toBe(true);
    rerender(<SettingsTabFooter {...props} />);
    expect(disabled('Reset Regional to defaults')).toBe(false);
  });

  it('confirms a save until the next change', () => {
    // Like a tab: saving empties the draft in the same update.
    function Tab() {
      const [hasChanges, setHasChanges] = useState(true);
      return (
        <>
          <SettingsTabFooter
            {...props}
            hasChanges={hasChanges}
            onSave={() => setHasChanges(false)}
          />
          <button type="button" onClick={() => setHasChanges(true)}>
            Change
          </button>
        </>
      );
    }
    render(<Tab />);

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(screen.getByRole('status').textContent).toBe('Saved.');
    fireEvent.click(screen.getByRole('button', { name: 'Change' }));
    expect(screen.getByRole('status').textContent).toBe(
      'You have unsaved changes.',
    );
  });
});
