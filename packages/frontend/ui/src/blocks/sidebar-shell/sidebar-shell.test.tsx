import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SidebarShell } from '@synapcity/frontend-ui/blocks/sidebar-shell';
import { ModeProvider } from '@synapcity/frontend-ui/providers/mode-provider';

const account = { homeHref: '/u/home', settingsHref: '/u/settings' };

const renderShell = (header: React.ReactNode = <div>Header</div>) =>
  render(
    <ModeProvider>
      <SidebarShell header={header} account={account}>
        <p>Page</p>
      </SidebarShell>
    </ModeProvider>,
  );

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

  it('renders the sidebar, collapsed to start', () => {
    renderShell();
    const sidebar = document.querySelector('[data-slot="sidebar"]')!;

    expect(sidebar.getAttribute('data-state')).toBe('collapsed');
  });

  it('hands the settings link to the sidebar', () => {
    renderShell();
    const footer = document.querySelector('[data-slot="sidebar-footer"]')!;

    expect(footer.querySelector('a[href="/u/settings"]')).not.toBeNull();
  });

  it('lets wide content shrink instead of pushing past the viewport', () => {
    renderShell();

    expect(
      document.querySelector('[data-slot="sidebar-inset"]')!.className,
    ).toContain('min-w-0');
  });
});
