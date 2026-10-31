import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireOwner: vi.fn(),
  getDocuments: vi.fn(),
}));

vi.mock('@/lib/access/require-owner', () => ({
  requireOwner: mocks.requireOwner,
}));
vi.mock('@/features/documents/server/get-documents', () => ({
  getDocuments: mocks.getDocuments,
}));

import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { BreadcrumbMenu } from '@synapcity/frontend-shells';

import DocumentsPage from './page';

/** The elements the page returns, flattened, so a test can find one by type. */
function elements(node: ReactNode): ReactElement[] {
  if (!isValidElement(node)) return [];
  const { children } = node.props as { children?: ReactNode };
  const nested = Array.isArray(children) ? children : [children];
  return [node, ...nested.flatMap(elements)];
}

describe('the Documents page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOwner.mockResolvedValue({ kind: 'verified' });
    mocks.getDocuments.mockResolvedValue([]);
  });

  it('names its collection in the trail, so the sidebar can follow it', async () => {
    const page = await DocumentsPage({
      params: Promise.resolve({ userId: 'u1' }),
    });
    const crumbs = elements(page).find(
      (element) => element.type === BreadcrumbMenu,
    );

    expect(mocks.requireOwner).toHaveBeenCalledWith('u1');
    expect(crumbs?.props).toEqual({
      items: [{ label: 'Documents', kind: 'collection' }],
    });
  });
});
