import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SidebarShell } from '.';
import { RootSidebar } from './root-sidebar';
import { useSidebar } from '@synapcity/frontend-ui/core/sidebar';
import { ModeProvider } from '@synapcity/frontend-preferences';
import { sampleSidebarGroups } from '../../testing/sidebar-sample';

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

const sidebar = (
  <RootSidebar settingsHref="/u/settings" groups={sampleSidebarGroups} />
);

const renderShell = (
  header: React.ReactNode = <div>Header</div>,
  page: React.ReactNode = <p>Page</p>,
) =>
  render(
    <ModeProvider>
      <SidebarShell header={header} sidebar={sidebar}>
        {page}
      </SidebarShell>
    </ModeProvider>,
  );

const SidebarStateProbe = () => {
  const { state, open } = useSidebar();
  return <output data-testid="probe">{`${state}:${open}`}</output>;
};

describe('SidebarShell', () => {
  it('renders the header above the page inside the inset', () => {
    renderShell();
    const inset = document.querySelector('[data-slot="sidebar-inset"]')!;

    expect(inset.textContent).toContain('Header');
    expect(inset.textContent).toContain('Page');
    expect(inset.textContent!.indexOf('Header')).toBeLessThan(
      inset.textContent!.indexOf('Page'),
    );
  });

  it('renders no header when given null', () => {
    renderShell(null);

    expect(screen.queryByText('Header')).toBeNull();
    expect(screen.getByText('Page')).toBeTruthy();
  });

  it('renders the sidebar it is given, collapsed to start', () => {
    renderShell();
    const element = document.querySelector('[data-slot="sidebar"]')!;

    expect(element.getAttribute('data-state')).toBe('collapsed');
    expect(element.textContent).toContain('Training log');
  });

  it('provides sidebar context to the page, collapsed to start', () => {
    renderShell(<div>Header</div>, <SidebarStateProbe />);

    expect(screen.getByTestId('probe').textContent).toBe('collapsed:false');
  });

  it('wraps the page in a full-height sidebar wrapper', () => {
    renderShell();
    const wrapper = document.querySelector('[data-slot="sidebar-wrapper"]')!;

    expect(wrapper.className).toContain('h-svh');
  });

  it('lets wide content shrink instead of pushing past the viewport', () => {
    renderShell();

    expect(
      document.querySelector('[data-slot="sidebar-inset"]')!.className,
    ).toContain('min-w-0');
  });

  it('gives the panel and page separate scroll containers below the header', () => {
    renderShell();
    expect(
      document
        .querySelector('[data-slot="global-panel-scroll"]')
        ?.contains(document.querySelector('[data-slot="shell-page"]')),
    ).toBe(false);
    expect(
      document.querySelector('[data-slot="shell-page"]')?.textContent,
    ).toBe('Page');
  });
});
