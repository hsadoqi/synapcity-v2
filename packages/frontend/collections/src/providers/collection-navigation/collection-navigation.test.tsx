import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  CollectionNavigationProvider,
  useCollectionNavigation,
} from './collection-navigation';

function Probe({ href }: { href: string }) {
  const { Link, push } = useCollectionNavigation();
  return (
    <>
      <Link href={href} className="probe" aria-label="Open the item">
        Open
      </Link>
      <button type="button" onClick={() => push(href)}>
        Push
      </button>
    </>
  );
}

describe('useCollectionNavigation', () => {
  afterEach(() => vi.restoreAllMocks());

  it('falls back to a plain anchor that keeps its href, class and label', () => {
    render(<Probe href="/home/spaces/s1" />);

    const link = screen.getByRole('link', { name: 'Open the item' });
    expect(link.getAttribute('href')).toBe('/home/spaces/s1');
    expect(link.className).toBe('probe');
  });

  it('falls back to assigning the location when pushing', () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign });

    render(<Probe href="/home/spaces/s1" />);
    screen.getByRole('button', { name: 'Push' }).click();

    expect(assign).toHaveBeenCalledWith('/home/spaces/s1');
    vi.unstubAllGlobals();
  });

  it('uses the host link and push when a provider supplies them', () => {
    const push = vi.fn();
    const HostLink = ({
      href,
      children,
    }: {
      href: string;
      children?: React.ReactNode;
    }) => (
      <a href={href} data-host-link>
        {children}
      </a>
    );

    render(
      <CollectionNavigationProvider value={{ Link: HostLink, push }}>
        <Probe href="/x" />
      </CollectionNavigationProvider>,
    );

    expect(
      screen.getByRole('link', { name: 'Open' }).hasAttribute('data-host-link'),
    ).toBe(true);
    screen.getByRole('button', { name: 'Push' }).click();
    expect(push).toHaveBeenCalledWith('/x');
  });
});
