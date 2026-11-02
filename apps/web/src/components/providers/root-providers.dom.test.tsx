import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(''),
  usePathname: () => '/',
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));
// The real UserProvider runs; only the browser client it listens to is stubbed.
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  }),
}));

import { useCurrentUser } from '@synapcity/features-auth/frontend';
import { RootProviders } from './root-providers';

function SignedInAs() {
  const user = useCurrentUser();
  return <p>{user ? user.id : 'signed out'}</p>;
}

describe('RootProviders', () => {
  it('gives every provider and page below it the current user', () => {
    render(
      <RootProviders user={null} account={null} deviceTimeZone={null}>
        <SignedInAs />
      </RootProviders>,
    );

    expect(screen.getByText('signed out')).toBeTruthy();
  });

  it('renders the app inside it', () => {
    render(
      <RootProviders user={null} account={null} deviceTimeZone={null}>
        <p>App</p>
      </RootProviders>,
    );

    expect(screen.getByText('App')).toBeTruthy();
  });

  it('applies the colour mode to the document through a class', () => {
    render(
      <RootProviders user={null} account={null} deviceTimeZone={null}>
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
      <RootProviders user={null} account={null} deviceTimeZone={null}>
        <p>App</p>
      </RootProviders>,
    );

    expect(
      document.querySelectorAll('[data-slot="toast-viewport"]'),
    ).toHaveLength(1);
  });
});
