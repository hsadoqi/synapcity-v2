import { fireEvent, render, screen } from '@testing-library/react';
import { createSpaceEntity } from '@synapcity/dev-fixtures';
import { CollectionNavigationProvider } from '@synapcity/frontend-collection';
import { describe, expect, it, vi } from 'vitest';

import type { SetSpacePinnedResult } from '../../../contracts';
import { SpacesIndex } from './spaces-index';

const spaces = [
  { ...createSpaceEntity(), documentsTotal: 1, dashboardsTotal: 0 },
];

function renderIndex(
  setSpacePinned: () => Promise<SetSpacePinnedResult>,
  signInHref?: string,
) {
  return render(
    <CollectionNavigationProvider
      value={{ Link: (props) => <a {...props} />, push: vi.fn() }}
    >
      <SpacesIndex
        spaces={spaces}
        homePath="/u1/home"
        now="2026-10-20T12:00:00Z"
        setSpacePinned={setSpacePinned}
        signInHref={signInHref}
      />
    </CollectionNavigationProvider>,
  );
}

async function pinWriting() {
  fireEvent.click(
    screen.getAllByRole('button', { name: 'Actions for Writing' })[0]!,
  );
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Pin' }));
}

describe('SpacesIndex', () => {
  it('saves a pin through the host’s action', async () => {
    const setSpacePinned = vi.fn(async () => ({
      ok: true as const,
      pinnedAt: '2026-10-20T12:00:00Z',
    }));
    renderIndex(setSpacePinned);

    await pinWriting();

    expect(setSpacePinned).toHaveBeenCalledWith('fixture-space-writing', true);
  });

  it('offers to sign in again when the pin failed because the session ended', async () => {
    renderIndex(
      async () => ({
        ok: false,
        error: 'Sign in again to update your profile.',
        signedOut: true,
      }),
      '/auth/login?next=%2Fu1%2Fhome%2Fspaces',
    );

    await pinWriting();

    expect(
      (await screen.findByRole('link', { name: 'Sign in again' })).getAttribute(
        'href',
      ),
    ).toBe('/auth/login?next=%2Fu1%2Fhome%2Fspaces');
  });
});
