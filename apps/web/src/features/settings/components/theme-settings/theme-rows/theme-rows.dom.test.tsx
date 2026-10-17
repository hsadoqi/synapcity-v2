import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { stubBrowser } from '../../../test-harness';
import { ThemeModeRow } from '../theme-rows';

beforeEach(stubBrowser);
afterEach(() => vi.unstubAllGlobals());

describe('ThemeModeRow', () => {
  it('is a select named "Color theme" showing the current mode', () => {
    render(<ThemeModeRow value="dark" onChange={() => {}} />);

    expect(
      screen.getByRole('combobox', { name: 'Color theme' }).textContent,
    ).toContain('Dark');
  });

  it('offers light, dark and system default', async () => {
    render(<ThemeModeRow value="light" onChange={() => {}} />);

    fireEvent.click(screen.getByRole('combobox'));

    expect(
      (await screen.findAllByRole('option')).map((o) => o.textContent),
    ).toEqual(['Light', 'Dark', 'System default']);
  });

  it('reports the chosen mode', async () => {
    const onChange = vi.fn();
    render(<ThemeModeRow value="light" onChange={onChange} />);

    fireEvent.click(screen.getByRole('combobox'));
    const item = await screen.findByRole('option', { name: 'System default' });
    fireEvent.pointerDown(item, { pointerType: 'mouse', button: 0 });
    fireEvent.click(item, { detail: 1 });

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('system'));
  });
});
