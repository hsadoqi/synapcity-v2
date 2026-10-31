import { act, fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DashboardConfigProvider } from '../../config';
import { renderWithStore } from '../../../testing';
import { SaveStatusIndicator } from './index';

describe('SaveStatusIndicator', () => {
  it('is a polite live region that starts at Saved', () => {
    renderWithStore(<SaveStatusIndicator />);
    const status = screen.getByRole('status');
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.textContent).toBe('Saved');
  });

  it.each([
    ['unsaved', 'Unsaved changes'],
    ['saving', 'Saving…'],
  ] as const)('shows %s without any button', (status, text) => {
    const { store } = renderWithStore(<SaveStatusIndicator />);
    act(() => store().getState().setSaveStatus(status));
    expect(screen.getByRole('status').textContent).toBe(text);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows Not saved with the host message, and Retry asks the scheduler to save again', () => {
    const { store } = renderWithStore(<SaveStatusIndicator />);
    act(() =>
      store()
        .getState()
        .setSaveStatus('failed', 'Sign in again to save your changes.'),
    );
    expect(screen.getByRole('status').textContent).toBe(
      'Not saved. Sign in again to save your changes.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(store().getState().saveRequests).toBe(1);
  });

  it('shows Changed elsewhere with Reload, which says edits are discarded', () => {
    const onReload = vi.fn();
    const { store } = renderWithStore(
      <DashboardConfigProvider onReload={onReload}>
        <SaveStatusIndicator />
      </DashboardConfigProvider>,
    );
    act(() => store().getState().setSaveStatus('conflict'));
    expect(screen.getByRole('status').textContent).toMatch(
      /Changed elsewhere.*discarded/,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reload' }));
    expect(onReload).toHaveBeenCalledTimes(1);
  });

  it('offers no Reload when the host cannot reload', () => {
    const { store } = renderWithStore(<SaveStatusIndicator />);
    act(() => store().getState().setSaveStatus('conflict'));
    expect(screen.queryByRole('button', { name: 'Reload' })).toBeNull();
  });
});
