import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireOwner: vi.fn(),
  getDocument: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error('NEXT_HTTP_ERROR_FALLBACK;404');
  }),
}));

vi.mock('next/navigation', () => ({ notFound: mocks.notFound }));
vi.mock('@/lib/access/require-owner', () => ({
  requireOwner: mocks.requireOwner,
}));
vi.mock('@/features/documents/server/get-documents', () => ({
  getDocument: mocks.getDocument,
}));

import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { BreadcrumbMenu } from '@synapcity/frontend-shells';

import { DocumentView } from '@/features/documents/components/document-view';
import DocumentShowPage, { generateMetadata } from './page';

/** The elements the page returns, flattened, so a test can find one by type. */
function elements(node: ReactNode): ReactElement[] {
  if (!isValidElement(node)) return [];
  const { children } = node.props as { children?: ReactNode };
  const nested = Array.isArray(children) ? children : [children];
  return [node, ...nested.flatMap(elements)];
}
const find = (page: ReactNode, type: unknown) =>
  elements(page).find((element) => element.type === type);

const params = (id: string) =>
  Promise.resolve({ userId: 'u1', documentId: id });

describe('the Document page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOwner.mockResolvedValue({ kind: 'verified' });
  });

  it('is not found when the owner has no such document', async () => {
    mocks.getDocument.mockResolvedValue(null);

    await expect(
      DocumentShowPage({ params: params('missing') }),
    ).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404');
    expect(mocks.requireOwner).toHaveBeenCalledWith('u1');
    expect(mocks.getDocument).toHaveBeenCalledWith('missing');
  });

  it('checks the owner before reading', async () => {
    mocks.requireOwner.mockRejectedValue(new Error('NEXT_REDIRECT'));

    await expect(DocumentShowPage({ params: params('x1') })).rejects.toThrow(
      'NEXT_REDIRECT',
    );
    expect(mocks.getDocument).not.toHaveBeenCalled();
  });

  it('shows the document and names it in the trail', async () => {
    const document = { id: 'x1', name: 'Launch' };
    mocks.getDocument.mockResolvedValue(document);

    const page = await DocumentShowPage({ params: params('x1') });

    expect(find(page, DocumentView)?.props).toEqual({ document });
    expect(find(page, BreadcrumbMenu)?.props).toEqual({
      items: [
        {
          label: 'Documents',
          href: '/u1/home/documents',
          kind: 'collection',
        },
        { label: 'Launch' },
      ],
    });
  });

  it('titles the page after the document', async () => {
    mocks.getDocument.mockResolvedValue({ id: 'x1', name: 'Launch' });
    await expect(generateMetadata({ params: params('x1') })).resolves.toEqual({
      title: 'Launch',
    });
  });

  it('is not found from its metadata too, so the status is 404', async () => {
    mocks.getDocument.mockResolvedValue(null);
    await expect(
      generateMetadata({ params: params('missing') }),
    ).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404');
  });
});
