import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useCanCollect } from '@synapcity/frontend-preferences';
import { DataPrivacySettings } from '../components/data-privacy-settings';
import { renderWithSettings, stubBrowser, saveTab } from '../testing';

beforeEach(stubBrowser);

/** A collector elsewhere in the app, under the same preferences runtime. */
function Collector() {
  return (
    <span data-testid="collecting">
      {String(useCanCollect('errorReports'))}
    </span>
  );
}

describe('useCanCollect with the settings page', () => {
  it('follows the settings page, both ways', async () => {
    await renderWithSettings(
      <>
        <DataPrivacySettings />
        <Collector />
      </>,
    );
    const collecting = () => screen.getByTestId('collecting').textContent;
    const toggle = screen.getByRole('switch', { name: 'Error reports' });
    expect(collecting()).toBe('false');

    fireEvent.click(toggle);
    saveTab();
    expect(collecting()).toBe('true');
    fireEvent.click(toggle);
    saveTab();
    expect(collecting()).toBe('false');
  });
});
