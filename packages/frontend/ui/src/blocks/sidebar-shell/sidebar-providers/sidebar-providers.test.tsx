import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SidebarProviders } from '@synapcity/frontend-ui/blocks/sidebar-shell/sidebar-providers';
import { useSidebar } from '@synapcity/frontend-ui/core/sidebar';

const Probe = () => {
  const { state, open } = useSidebar();
  return <output data-testid="probe">{`${state}:${open}`}</output>;
};

describe('SidebarProviders', () => {
  it('renders its children', () => {
    render(
      <SidebarProviders>
        <p>Inside</p>
      </SidebarProviders>,
    );

    expect(screen.getByText('Inside')).toBeTruthy();
  });

  it('provides sidebar context, collapsed to start', () => {
    render(
      <SidebarProviders>
        <Probe />
      </SidebarProviders>,
    );

    expect(screen.getByTestId('probe').textContent).toBe('collapsed:false');
  });

  it('wraps the page in the sidebar wrapper', () => {
    render(
      <SidebarProviders>
        <p>Inside</p>
      </SidebarProviders>,
    );

    expect(
      document.querySelector('[data-slot="sidebar-wrapper"]'),
    ).not.toBeNull();
  });
});
