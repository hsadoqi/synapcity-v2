import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(''),
  usePathname: () => '/',
  useRouter: () => ({ replace: vi.fn() }),
}));

import RootProviders from './root-providers';

beforeEach(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
});

describe('RootProviders', () => {
  it('renders the app inside it', () => {
    render(
      <RootProviders>
        <p>App</p>
      </RootProviders>,
    );

    expect(screen.getByText('App')).toBeTruthy();
  });

  it('applies the colour mode to the document through a class', () => {
    render(
      <RootProviders>
        <p>App</p>
      </RootProviders>,
    );

    expect(
      document.documentElement.classList.contains('light') ||
        document.documentElement.classList.contains('dark'),
    ).toBe(true);
  });

  it('provides one toast viewport', () => {
    render(
      <RootProviders>
        <p>App</p>
      </RootProviders>,
    );

    expect(
      document.querySelectorAll('[data-slot="toast-viewport"]'),
    ).toHaveLength(1);
  });
});
