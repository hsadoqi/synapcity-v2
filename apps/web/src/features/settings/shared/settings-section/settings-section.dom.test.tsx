import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SettingsSection } from './settings-section';

describe('SettingsSection', () => {
  it('is a region named by its level-3 heading', () => {
    render(
      <SettingsSection title="Motion">
        <p>rows</p>
      </SettingsSection>,
    );

    expect(
      screen.getByRole('heading', { level: 3, name: 'Motion' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('region', { name: 'Motion' }).textContent,
    ).toContain('rows');
  });
});
