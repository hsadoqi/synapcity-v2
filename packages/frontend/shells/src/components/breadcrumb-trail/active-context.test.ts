import { describe, expect, it } from 'vitest';

import { activeContext } from '.';

const spaces = {
  label: 'Spaces',
  href: '/u/home/spaces',
  kind: 'collection' as const,
};
const writing = {
  label: 'Writing',
  href: '/u/home/spaces/s1',
  kind: 'space' as const,
};

// Contexts are Global (none) or a Space; collections are surfaces.
describe('activeContext', () => {
  it('is none on Home, which sets no trail', () => {
    expect(activeContext([])).toBeNull();
  });

  it('is none on a collection page, which is a surface, not a context', () => {
    expect(activeContext([{ label: 'Spaces', kind: 'collection' }])).toBeNull();
    expect(
      activeContext([{ label: 'Documents', kind: 'collection' }]),
    ).toBeNull();
    expect(
      activeContext([{ label: 'Dashboards', kind: 'collection' }]),
    ).toBeNull();
  });

  it('is the Space on a Space page', () => {
    expect(
      activeContext([spaces, { label: 'Writing', kind: 'space' }])?.label,
    ).toBe('Writing');
  });

  it('stays the Space for a document or dashboard inside it', () => {
    expect(activeContext([spaces, writing, { label: 'Draft' }])).toEqual(
      writing,
    );
  });

  it('is none for a document or dashboard outside any Space', () => {
    expect(
      activeContext([
        { label: 'Documents', href: '/u/home/documents', kind: 'collection' },
        { label: 'Draft' },
      ]),
    ).toBeNull();
  });

  it('ignores crumbs that name no place', () => {
    expect(activeContext([{ label: 'Draft' }])).toBeNull();
  });
});
