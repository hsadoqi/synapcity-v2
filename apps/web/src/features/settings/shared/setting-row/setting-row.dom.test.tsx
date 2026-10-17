import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

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
});
