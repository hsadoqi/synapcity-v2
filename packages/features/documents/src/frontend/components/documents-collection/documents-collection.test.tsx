import {
  fireEvent,
  render as renderInto,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  setDocumentPinned: vi.fn(),
}));

import type { DocumentSummary } from '@synapcity/domain-documents';
import { CollectionNavigationProvider } from '@synapcity/frontend-collection';

import { sampleSummaries } from '../../../testing';
import {
  DocumentsCollection,
  DocumentsCollectionSkeleton,
} from './documents-collection';

/** The host's navigation: plain links, and a `push` this test can watch. */
function HostNavigation({ children }: { children: React.ReactNode }) {
  return (
    <CollectionNavigationProvider
      value={{ Link: (props) => <a {...props} />, push: mocks.push }}
    >
      {children}
    </CollectionNavigationProvider>
  );
}

const render = (ui: React.ReactElement) =>
  renderInto(ui, { wrapper: HostNavigation });

/** The page as the host mounts it: its home address, its pin action and its sign-in link. */
const page = (documents: DocumentSummary[]) => (
  <DocumentsCollection
    documents={documents}
    homePath="/u1/home"
    setDocumentPinned={mocks.setDocumentPinned}
    signInHref="/auth/login?next=%2Fu1%2Fhome%2Fdocuments"
  />
);

const MANY: DocumentSummary[] = [...sampleSummaries];
// Three of them: the first and third pinned (see the samples), the second not.
const FEW = MANY.slice(0, 3);
const unpinned = MANY.find((record) => record.pinnedAt === null)!;

const carousel = () => screen.getByRole('list', { name: 'Recently used' });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.setDocumentPinned.mockResolvedValue({
    ok: true,
    pinnedAt: '2026-10-18T12:00:00Z',
  });
});

describe('DocumentsCollectionSkeleton', () => {
  it('keeps the page heading and announces that documents are loading', () => {
    render(<DocumentsCollectionSkeleton />);

    expect(screen.getByRole('heading', { name: 'Documents' })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('Loading documents');
  });
});

describe('DocumentsCollection', () => {
  it('names the page and the list, and counts the documents', () => {
    render(page(FEW));

    expect(
      screen.getByRole('heading', { level: 1, name: 'Documents' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', { level: 2, name: 'All documents' }),
    ).toBeTruthy();
    expect(screen.getByText('3 documents')).toBeTruthy();
  });

  it('links each document to its page under the owner', () => {
    render(page([FEW[0]!]));

    expect(
      screen
        .getAllByRole('link', { name: FEW[0]!.name })
        .every(
          (link) =>
            link.getAttribute('href') === `/u1/home/documents/${FEW[0]!.id}`,
        ),
    ).toBe(true);
  });

  it('says which spaces a document is in', () => {
    render(page([{ ...FEW[0]!, spacesTotal: 2 }]));

    expect(screen.getAllByText('In 2 spaces').length).toBeGreaterThan(0);
  });

  describe('with a few documents', () => {
    it('shows just the list, with no carousel or pinned panel repeating it', () => {
      render(page(FEW));

      expect(screen.queryByRole('list', { name: 'Recently used' })).toBeNull();
      expect(screen.queryByRole('region', { name: /Pinned/ })).toBeNull();
    });

    it('marks the pinned ones in the list', () => {
      render(page(FEW));

      expect(screen.getAllByRole('img', { name: 'Pinned' }).length).toBe(
        FEW.filter((record) => record.pinnedAt !== null).length,
      );
    });
  });

  describe('with many documents', () => {
    it('shows the carousel and the pinned panel', () => {
      render(page(MANY));
      const panel = screen.getByRole('region', { name: /Pinned/ });

      expect(carousel()).toBeTruthy();
      for (const record of MANY.filter((entry) => entry.pinnedAt !== null)) {
        expect(
          within(panel).getByRole('link', { name: record.name }),
        ).toBeTruthy();
      }
      expect(
        within(panel).queryByRole('link', { name: unpinned.name }),
      ).toBeNull();
    });

    it('hides the highlights while searching', () => {
      render(page(MANY));

      fireEvent.change(
        screen.getByRole('searchbox', { name: 'Search documents' }),
        { target: { value: unpinned.name } },
      );

      expect(screen.queryByRole('list', { name: 'Recently used' })).toBeNull();
    });

    it('pins at once and saves in the background', async () => {
      render(page(MANY));

      fireEvent.click(
        screen.getAllByRole('button', {
          name: `Actions for ${unpinned.name}`,
        })[0]!,
      );
      fireEvent.click(await screen.findByRole('menuitem', { name: 'Pin' }));

      const panel = screen.getByRole('region', { name: /Pinned/ });
      await waitFor(() =>
        expect(
          within(panel).getByRole('link', { name: unpinned.name }),
        ).toBeTruthy(),
      );
      expect(mocks.setDocumentPinned).toHaveBeenCalledWith(unpinned.id, true);
    });

    it('puts the pin back and says so when saving fails', async () => {
      mocks.setDocumentPinned.mockResolvedValue({
        ok: false,
        error: 'Could not save your changes. Try again.',
      });
      render(page(MANY));

      fireEvent.click(
        screen.getAllByRole('button', {
          name: `Actions for ${unpinned.name}`,
        })[0]!,
      );
      fireEvent.click(await screen.findByRole('menuitem', { name: 'Pin' }));

      expect(
        await screen.findByText('Could not save your changes. Try again.'),
      ).toBeTruthy();
      const panel = screen.getByRole('region', { name: /Pinned/ });
      expect(
        within(panel).queryByRole('link', { name: unpinned.name }),
      ).toBeNull();
    });
    it('offers to sign in again, back to this page, when the session ended', async () => {
      mocks.setDocumentPinned.mockResolvedValue({
        ok: false,
        error: 'Sign in again to update your profile.',
        signedOut: true,
      });
      render(page(MANY));

      fireEvent.click(
        screen.getAllByRole('button', {
          name: `Actions for ${unpinned.name}`,
        })[0]!,
      );
      fireEvent.click(await screen.findByRole('menuitem', { name: 'Pin' }));

      expect(
        (
          await screen.findByRole('link', { name: 'Sign in again' })
        ).getAttribute('href'),
      ).toBe('/auth/login?next=%2Fu1%2Fhome%2Fdocuments');
    });
  });

  it('offers only open and pin in a document’s menu', async () => {
    render(page(FEW));

    fireEvent.click(
      screen.getAllByRole('button', {
        name: `Actions for ${FEW[0]!.name}`,
      })[0]!,
    );

    expect(await screen.findByRole('menuitem', { name: 'Open' })).toBeTruthy();
    expect(screen.queryByRole('menuitem', { name: 'Delete' })).toBeNull();
    expect(screen.queryByRole('menuitem', { name: 'Rename' })).toBeNull();
  });

  it('opens a document from its menu', async () => {
    render(page(FEW));

    fireEvent.click(
      screen.getAllByRole('button', {
        name: `Actions for ${FEW[0]!.name}`,
      })[0]!,
    );
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Open' }));

    expect(mocks.push).toHaveBeenCalledWith(`/u1/home/documents/${FEW[0]!.id}`);
  });

  it('shows the empty state, with no create button, when there are no documents', () => {
    render(page([]));

    expect(screen.getByText('No documents yet')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /New document/ })).toBeNull();
  });
});
