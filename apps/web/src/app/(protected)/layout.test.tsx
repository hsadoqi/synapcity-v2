import { describe, expect, it, vi } from 'vitest';

const requireSignedIn = vi.hoisted(() => vi.fn());

vi.mock('@/lib/access/require-signed-in', () => ({ requireSignedIn }));

import ProtectedLayout from './layout';

describe('ProtectedLayout', () => {
  it('does not render children for a signed-out request', async () => {
    requireSignedIn.mockRejectedValueOnce(new Error('NEXT_REDIRECT'));

    await expect(ProtectedLayout({ children: 'owner area' })).rejects.toThrow(
      'NEXT_REDIRECT',
    );
  });

  it('renders its children untouched for a signed-in request', async () => {
    requireSignedIn.mockResolvedValueOnce(undefined);

    await expect(ProtectedLayout({ children: 'owner area' })).resolves.toBe(
      'owner area',
    );
  });
});
