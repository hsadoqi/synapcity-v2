import { StrictMode, useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

import { ModeProvider } from '@synapcity/frontend-preferences';

import { BreadcrumbRootShell, SetBreadcrumbs } from '.';

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

const account = { homeHref: '/u/home', settingsHref: '/u/settings' };

const renderShell = (page: React.ReactNode) =>
  render(
    <ModeProvider>
      <BreadcrumbRootShell account={account}>{page}</BreadcrumbRootShell>
    </ModeProvider>,
  );

const trail = () => screen.queryByRole('navigation', { name: 'Breadcrumb' });

describe('BreadcrumbRootShell', () => {
  it('shows no trail until a page sets one', () => {
    renderShell(<p>Page</p>);

    expect(trail()).toBeNull();
  });

  it('shows the trail a page sets, linking parents and ending on the page', () => {
    renderShell(
      <SetBreadcrumbs
        items={[
          { label: 'Spaces', href: '/u/home/spaces' },
          { label: 'Fitness' },
        ]}
      />,
    );
    const nav = within(trail()!);

    expect(nav.getByRole('link', { name: 'Spaces' }).getAttribute('href')).toBe(
      '/u/home/spaces',
    );
    expect(nav.getByText('Fitness').getAttribute('aria-current')).toBe('page');
  });

  it('clears the trail when the page that set it goes away', () => {
    const view = render(
      <ModeProvider>
        <BreadcrumbRootShell account={account}>
          <SetBreadcrumbs items={[{ label: 'Spaces' }]} />
        </BreadcrumbRootShell>
      </ModeProvider>,
    );
    expect(trail()).not.toBeNull();

    view.rerender(
      <ModeProvider>
        <BreadcrumbRootShell account={account}>
          <p>Elsewhere</p>
        </BreadcrumbRootShell>
      </ModeProvider>,
    );

    expect(trail()).toBeNull();
  });

  it('follows the page when it changes the trail', () => {
    const view = renderShell(<SetBreadcrumbs items={[{ label: 'Spaces' }]} />);

    view.rerender(
      <ModeProvider>
        <BreadcrumbRootShell account={account}>
          <SetBreadcrumbs items={[{ label: 'Dashboards' }]} />
        </BreadcrumbRootShell>
      </ModeProvider>,
    );

    expect(within(trail()!).getByText('Dashboards')).toBeTruthy();
    expect(within(trail()!).queryByText('Spaces')).toBeNull();
  });

  it('builds the sidebar from the trail when given a function', () => {
    const sidebar = (crumbs: { label: string }[]) => ({
      groups: [
        {
          title: crumbs.length ? `In ${crumbs.at(-1)!.label}` : 'Nowhere',
          items: [],
        },
      ],
    });
    render(
      <ModeProvider>
        <BreadcrumbRootShell account={account} sidebar={sidebar}>
          <SetBreadcrumbs items={[{ label: 'Spaces', kind: 'collection' }]} />
        </BreadcrumbRootShell>
      </ModeProvider>,
    );
    const nav = document.querySelector('[data-slot="sidebar"]')!;

    expect(nav.textContent).toContain('In Spaces');
    expect(nav.textContent).not.toContain('Nowhere');
  });
});

describe('SetBreadcrumbs stability', () => {
  /** A page that re-renders itself, handing SetBreadcrumbs a new equal array. */
  const Page = () => {
    const [, setCount] = useState(0);
    return (
      <>
        <button onClick={() => setCount((n) => n + 1)}>Render again</button>
        <SetBreadcrumbs items={[{ label: 'Spaces' }]} />
      </>
    );
  };

  it('does not rebuild the shell when a page passes an equal trail again', () => {
    const sidebar = vi.fn(() => ({ groups: [] }));
    render(
      <ModeProvider>
        <BreadcrumbRootShell account={account} sidebar={sidebar}>
          <Page />
        </BreadcrumbRootShell>
      </ModeProvider>,
    );
    const calls = sidebar.mock.calls.length;

    fireEvent.click(screen.getByRole('button', { name: 'Render again' }));

    expect(sidebar.mock.calls.length).toBe(calls);
  });
});

describe('SetBreadcrumbs lifecycle', () => {
  const inShell = (page: React.ReactNode) => (
    <ModeProvider>
      <BreadcrumbRootShell account={account}>{page}</BreadcrumbRootShell>
    </ModeProvider>
  );

  it('shows the next page trail, never the old one, when one page replaces another', () => {
    // Different keys: the old publisher unmounts as the new one mounts, as on
    // a route change. Cleanups run before the new effect, so the new trail wins.
    const view = render(
      inShell(<SetBreadcrumbs key="a" items={[{ label: 'Spaces' }]} />),
    );

    view.rerender(
      inShell(<SetBreadcrumbs key="b" items={[{ label: 'Documents' }]} />),
    );

    expect(within(trail()!).getByText('Documents')).toBeTruthy();
    expect(within(trail()!).queryByText('Spaces')).toBeNull();
  });

  it('shows no trail for a page that sets an empty one', () => {
    const view = render(
      inShell(<SetBreadcrumbs key="a" items={[{ label: 'Spaces' }]} />),
    );

    view.rerender(inShell(<SetBreadcrumbs key="b" items={[]} />));

    expect(trail()).toBeNull();
  });

  it('keeps the trail through Strict Mode mounting its effects twice', () => {
    render(
      <StrictMode>
        {inShell(<SetBreadcrumbs items={[{ label: 'Spaces' }]} />)}
      </StrictMode>,
    );

    expect(within(trail()!).getByText('Spaces')).toBeTruthy();
  });
});
