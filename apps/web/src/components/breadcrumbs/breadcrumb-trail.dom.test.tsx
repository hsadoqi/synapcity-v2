import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

import { ModeProvider } from '@synapcity/frontend-preferences';

import { BreadcrumbRootShell, SetBreadcrumbs } from './breadcrumb-trail';

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
});
