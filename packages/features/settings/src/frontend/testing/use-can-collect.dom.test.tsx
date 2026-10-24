import { fireEvent, renderHook, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useCanCollect } from '@synapcity/frontend-preferences';
import { DataPrivacySettings } from '../components/data-privacy-settings';
import { renderWithSettings, stubBrowser, saveTab } from '../testing';

beforeEach(stubBrowser);

describe('useCanCollect with the settings page', () => {
  it('follows the settings page in this tab, both ways', async () => {
    const { result } = renderHook(() => useCanCollect('errorReports'));
    await renderWithSettings(<DataPrivacySettings />);
    const toggle = screen.getByRole('switch', { name: 'Error reports' });

    fireEvent.click(toggle);
    saveTab();
    expect(result.current).toBe(true);
    fireEvent.click(toggle);
    saveTab();
    expect(result.current).toBe(false);
  });
});
