import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BreadcrumbMenu } from '.';
import { BreadcrumbTrailContext } from '../breadcrumb-trail';

const trail = [
  { label: 'Spaces', href: '/u/home/spaces', kind: 'collection' as const },
  { label: 'Fitness', kind: 'space' as const },
];

const publishTo = (setTrail: (items: unknown[]) => void, items = trail) =>
  render(
    <BreadcrumbTrailContext value={setTrail}>
      <BreadcrumbMenu items={items} />
    </BreadcrumbTrailContext>,
  );

describe('BreadcrumbMenu', () => {
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

  it('publishes an empty trail when given no items', () => {
    const setTrail = vi.fn();
    render(
      <BreadcrumbTrailContext value={setTrail}>
        <BreadcrumbMenu />
      </BreadcrumbTrailContext>,
    );

    expect(setTrail).toHaveBeenLastCalledWith([]);
  });
});
