import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  received: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: mocks.createClient,
}));
vi.mock('@synapcity/features-auth/frontend', () => ({
  UserProvider: (props: {
    createClient: unknown;
    children: React.ReactNode;
  }) => {
    mocks.received(props.createClient);
    return <div>{props.children}</div>;
  },
}));

import { UserProvider } from './user-provider';

describe('UserProvider (web)', () => {
  it("binds the app's browser client into the auth feature's provider", () => {
    render(
      <UserProvider user={null}>
        <p>child</p>
      </UserProvider>,
    );

    expect(screen.getByText('child')).toBeTruthy();
    expect(mocks.received).toHaveBeenCalledWith(mocks.createClient);
  });
});
