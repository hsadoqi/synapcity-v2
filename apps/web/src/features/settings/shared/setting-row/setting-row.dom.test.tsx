import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SettingsDraftFields } from '../settings-drafts/settings-draft-fields';

import { SettingRow } from '../setting-row';

describe('SettingRow', () => {
  it('labels the control it wraps', () => {
    render(
      <SettingRow id="mode" label="Color theme" description="Pick one.">
        <input id="mode" />
      </SettingRow>,
    );

    expect(screen.getByLabelText('Color theme')).toBeTruthy();
  });

  it('exposes its description under a predictable id', () => {
    render(
      <SettingRow id="mode" label="Color theme" description="Pick one.">
        <input id="mode" aria-describedby="mode-description" />
      </SettingRow>,
    );

    expect(document.getElementById('mode-description')?.textContent).toBe(
      'Pick one.',
    );
  });

  it('accepts rich content as the description', () => {
    render(
      <SettingRow
        id="mode"
        label="Color theme"
        description={<button type="button">Learn more</button>}
      >
        <input id="mode" />
      </SettingRow>,
    );

    expect(screen.getByRole('button', { name: 'Learn more' })).toBeTruthy();
  });

  it('renders its control', () => {
    render(
      <SettingRow id="mode" label="Color theme" description="Pick one.">
        <button>Control</button>
      </SettingRow>,
    );

    expect(screen.getByRole('button', { name: 'Control' })).toBeTruthy();
  });

  describe('in a tab with a draft', () => {
    const row = (state: { unsaved: boolean; atDefault: boolean }) => {
      const resetField = vi.fn();
      render(
        <SettingsDraftFields
          value={{
            isUnsaved: () => state.unsaved,
            isDefault: () => state.atDefault,
            resetField,
          }}
        >
          <SettingRow
            id="time"
            field="timeFormat"
            label="Time format"
            description="Pick one."
          >
            <input id="time" />
          </SettingRow>
        </SettingsDraftFields>,
      );
      return resetField;
    };

    it('shows neither mark nor reset while saved and at its default', () => {
      row({ unsaved: false, atDefault: true });
      expect(screen.queryByText('Unsaved:')).toBeNull();
      expect(
        screen.queryByRole('button', { name: 'Reset Time format' }),
      ).toBeNull();
    });

    it('marks an unsaved change for sight and for screen readers', () => {
      row({ unsaved: true, atDefault: false });
      expect(screen.getByText('Unsaved:')).toBeTruthy();
      // The label still names the control alone.
      expect(screen.getByLabelText('Time format')).toBeTruthy();
    });

    // A saved choice that is not the default can still be reset.
    it('offers to reset its own field while it differs from the default', () => {
      const resetField = row({ unsaved: false, atDefault: false });
      fireEvent.click(
        screen.getByRole('button', { name: 'Reset Time format' }),
      );
      expect(resetField).toHaveBeenCalledWith('timeFormat');
    });
  });
});
