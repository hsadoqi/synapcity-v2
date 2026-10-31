import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CollectionNavigationProvider } from '../../providers';
import { ItemOpenButton } from './item-open-button';

describe('ItemOpenButton', () => {
  it('is a host link that navigates by itself when the item has an href', () => {
    const onOpen = vi.fn();
    const HostLink = ({
      href,
      className,
      children,
    }: {
      href: string;
      className?: string;
      children?: React.ReactNode;
    }) => (
      // Like a client router's link: it routes itself, so the browser does
      // not load a new document (jsdom cannot, and says so on stderr).
      <a
        href={href}
        className={className}
        data-host-link
        onClick={(event) => event.preventDefault()}
      >
        {children}
      </a>
    );

    render(
      <CollectionNavigationProvider value={{ Link: HostLink, push: vi.fn() }}>
        <ItemOpenButton title="Soup" href="/things/soup" onOpen={onOpen} />
      </CollectionNavigationProvider>,
    );

    const link = screen.getByRole('link', { name: 'Soup' });
    expect(link.getAttribute('href')).toBe('/things/soup');
    expect(link.hasAttribute('data-host-link')).toBe(true);
    expect(link.className).toBe('open-overlay');
    link.click();
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('is still a link with its href when no host is mounted', () => {
    render(
      <ItemOpenButton title="Soup" href="/things/soup" onOpen={vi.fn()} />,
    );

    expect(
      screen.getByRole('link', { name: 'Soup' }).getAttribute('href'),
    ).toBe('/things/soup');
  });

  it('is a button that calls onOpen when the item has no href', () => {
    const onOpen = vi.fn();

    render(<ItemOpenButton title="Soup" onOpen={onOpen} />);
    screen.getByRole('button', { name: 'Soup' }).click();

    expect(onOpen).toHaveBeenCalledOnce();
  });
});
