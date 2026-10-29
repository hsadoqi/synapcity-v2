import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const requireSignedIn = vi.hoisted(() => vi.fn());
const getCurrentUser = vi.hoisted(() => vi.fn());
const getSidebarRecords = vi.hoisted(() => vi.fn());

vi.mock('@/lib/access/require-signed-in', () => ({ requireSignedIn }));
vi.mock('@/features/auth/server', () => ({ getCurrentUser }));
vi.mock('@/lib/sidebar-records/get-sidebar-records', () => ({
  getSidebarRecords,
}));
vi.mock('@/features/auth/components/auth-status', () => ({
  AuthStatus: () => null,
}));
vi.mock('@/components/app-shell', () => ({
  AppShell: ({
    userId,
    children,
  }: {
    userId: string | null;
    children: React.ReactNode;
  }) => (
    <div data-testid="workspace-shell" data-user={userId}>
      {children}
    </div>
  ),
}));

import ProtectedLayout from './layout';

describe('ProtectedLayout', () => {
  it('does not render children or read anything else for a signed-out request', async () => {
    requireSignedIn.mockRejectedValueOnce(new Error('NEXT_REDIRECT'));

    await expect(ProtectedLayout({ children: 'owner area' })).rejects.toThrow(
      'NEXT_REDIRECT',
    );
    expect(getSidebarRecords).not.toHaveBeenCalled();
  });

  it('wraps a signed-in request in the workspace shell for that user', async () => {
    requireSignedIn.mockResolvedValueOnce(undefined);
    getCurrentUser.mockResolvedValueOnce({ id: 'user-1' });
    getSidebarRecords.mockResolvedValueOnce({});

    render(await ProtectedLayout({ children: 'owner area' }));

    const shell = screen.getByTestId('workspace-shell');
    expect(shell.dataset.user).toBe('user-1');
    expect(shell.textContent).toBe('owner area');
  });
});
