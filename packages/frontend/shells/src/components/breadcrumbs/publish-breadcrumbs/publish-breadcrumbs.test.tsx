import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PublishBreadcrumbs } from '.';
import { BreadcrumbTrailContext } from '../breadcrumb-trail';

const trail = [
  { label: 'Spaces', href: '/u/home/spaces', kind: 'collection' as const },
  { label: 'Fitness', kind: 'space' as const },
];

const publishTo = (setTrail: (items: unknown[]) => void, items = trail) =>
  render(
    <BreadcrumbTrailContext value={setTrail}>
      <PublishBreadcrumbs items={items} />
    </BreadcrumbTrailContext>,
  );

describe('PublishBreadcrumbs', () => {
  it('publishes the page trail to the shell', () => {
    const setTrail = vi.fn();
    publishTo(setTrail);

    expect(setTrail).toHaveBeenLastCalledWith(trail);
  });

  it('renders nothing where the page places it', () => {
    const { container } = publishTo(vi.fn());

    expect(container.innerHTML).toBe('');
  });

  it('clears the trail when the page goes away', () => {
    const setTrail = vi.fn();
    const view = publishTo(setTrail);

    view.unmount();

    expect(setTrail).toHaveBeenLastCalledWith([]);
  });

  it('is the only publisher the package entry exposes', async () => {
    const entry = await import('../../../index');

    expect(entry).toHaveProperty('PublishBreadcrumbs');
    expect(entry).not.toHaveProperty('useBreadcrumbs');
    expect(entry).not.toHaveProperty('BreadcrumbTrailContext');
  });

  it('publishes an empty trail when given no items', () => {
    const setTrail = vi.fn();
    render(
      <BreadcrumbTrailContext value={setTrail}>
        <PublishBreadcrumbs />
      </BreadcrumbTrailContext>,
    );

    expect(setTrail).toHaveBeenLastCalledWith([]);
  });
});
