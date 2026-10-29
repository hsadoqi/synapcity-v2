import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireOwner: vi.fn(),
  listSummaries: vi.fn(),
  setSpacePinned: vi.fn(),
}));

vi.mock('@/lib/access/require-owner', () => ({
  requireOwner: mocks.requireOwner,
}));
vi.mock('@/lib/spaces', () => ({
  getSpaceSource: async () => ({ listSummaries: mocks.listSummaries }),
}));
vi.mock('@/lib/spaces/space-state-actions', () => ({
  setSpacePinned: mocks.setSpacePinned,
}));

import { SpacesCollection } from '@synapcity/features-spaces/frontend';

import SpacesPage from './page';

/** The elements the page returns, flattened, so a test can find one by type. */
function elements(node: ReactNode): ReactElement[] {
  if (!isValidElement(node)) return [];
  const { children } = node.props as { children?: ReactNode };
  const nested = Array.isArray(children) ? children : [children];
  return [node, ...nested.flatMap(elements)];
}

describe('the Spaces page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOwner.mockResolvedValue({ kind: 'verified' });
  });

  it('lists the owner’s spaces with the host’s pin action, links and sign-in address', async () => {
    const spaces = [{ id: 's1' }];
    mocks.listSummaries.mockResolvedValue(spaces);

    const page = await SpacesPage({
      params: Promise.resolve({ userId: 'u1' }),
    });

    expect(mocks.requireOwner).toHaveBeenCalledWith('u1');
    const collection = elements(page).find(
      (element) => element.type === SpacesCollection,
    );
    expect(collection?.props).toEqual({
      spaces,
      homePath: '/u1/home',
      setSpacePinned: mocks.setSpacePinned,
      signInHref: '/auth/login?next=%2Fu1%2Fhome%2Fspaces',
    });
  });
});
