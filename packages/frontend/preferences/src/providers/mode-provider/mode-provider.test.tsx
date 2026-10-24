import { act, render, renderHook, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { ModeProvider, useMode } from './mode-provider';

const mockSystemDark = (dark: boolean) => {
  window.matchMedia = ((query: string) => ({
    matches: query.includes('dark') ? dark : !dark,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  })) as unknown as typeof window.matchMedia;
};

const wrapper =
  (initialMode?: 'light' | 'dark' | 'system') =>
  ({ children }: { children: React.ReactNode }) => (
    <ModeProvider attribute="class" initialMode={initialMode}>
      {children}
    </ModeProvider>
  );

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = '';
  mockSystemDark(false);
});

describe('ModeProvider', () => {
  it('renders its children', () => {
    render(
      <ModeProvider>
        <p>Inside</p>
      </ModeProvider>,
    );

    expect(screen.getByText('Inside')).toBeTruthy();
  });

  it('starts in the system mode by default', () => {
    const { result } = renderHook(() => useMode(), { wrapper: wrapper() });

    expect(result.current.nativeMode).toBe('system');
  });

  it.each(['light', 'dark'] as const)('starts in %s when asked', (mode) => {
    const { result } = renderHook(() => useMode(), { wrapper: wrapper(mode) });

    expect(result.current.nativeMode).toBe(mode);
    expect(result.current.mode).toBe(mode);
  });
});

describe('useMode', () => {
  it('resolves the system mode against the OS preference', () => {
    mockSystemDark(true);
    const { result } = renderHook(() => useMode(), {
      wrapper: wrapper('system'),
    });

    expect(result.current.mode).toBe('dark');
  });

  it('switches mode, applies it to the document and remembers it', () => {
    const { result } = renderHook(() => useMode(), { wrapper: wrapper() });

    act(() => result.current.setMode('dark'));

    expect(result.current.mode).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');

    act(() => result.current.setMode('light'));

    expect(result.current.mode).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
