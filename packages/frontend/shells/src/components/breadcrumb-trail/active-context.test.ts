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

// One case per row of the frontend-shells plan's context table (Task 6).
describe('activeContext', () => {
  it('is none on Home, which sets no trail', () => {
    expect(activeContext([])).toBeNull();
  });

  it('is the collection on a collection page', () => {
    expect(
      activeContext([{ label: 'Spaces', kind: 'collection' }])?.label,
    ).toBe('Spaces');
    expect(
      activeContext([{ label: 'Documents', kind: 'collection' }])?.label,
    ).toBe('Documents');
    expect(
      activeContext([{ label: 'Dashboards', kind: 'collection' }])?.label,
    ).toBe('Dashboards');
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

  it('is the collection for a document or dashboard outside any Space', () => {
    expect(
      activeContext([
        { label: 'Documents', href: '/u/home/documents', kind: 'collection' },
        { label: 'Draft' },
      ])?.label,
    ).toBe('Documents');
  });

  it('ignores crumbs that name no place', () => {
    expect(activeContext([{ label: 'Draft' }])).toBeNull();
  });
});
