import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  tabsListVariants,
} from '@synapcity/frontend-ui/core/tabs';

const renderTabs = (rootProps = {}, listProps = {}) =>
  render(
    <Tabs defaultValue="one" {...rootProps}>
      <TabsList aria-label="Sections" {...listProps}>
        <TabsTrigger value="one">One</TabsTrigger>
        <TabsTrigger value="two">Two</TabsTrigger>
        <TabsTrigger value="three" disabled>
          Three
        </TabsTrigger>
      </TabsList>
      <TabsContent value="one">Panel one</TabsContent>
      <TabsContent value="two">Panel two</TabsContent>
      <TabsContent value="three">Panel three</TabsContent>
    </Tabs>,
  );

describe('Tabs', () => {
  it('exposes a tablist of tabs with the default one selected', () => {
    renderTabs();

    expect(screen.getByRole('tablist', { name: 'Sections' })).toBeTruthy();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    expect(
      screen.getByRole('tab', { name: 'One' }).getAttribute('aria-selected'),
    ).toBe('true');
    expect(
      screen.getByRole('tab', { name: 'Two' }).getAttribute('aria-selected'),
    ).toBe('false');
  });

  it('shows only the selected tab’s panel', () => {
    renderTabs();

    expect(screen.getByRole('tabpanel').textContent).toBe('Panel one');
    expect(screen.queryByText('Panel two')).toBeNull();
  });

  it('switches panels when another tab is clicked', () => {
    renderTabs();

    fireEvent.click(screen.getByRole('tab', { name: 'Two' }));

    expect(
      screen.getByRole('tab', { name: 'Two' }).getAttribute('aria-selected'),
    ).toBe('true');
    expect(screen.getByRole('tabpanel').textContent).toBe('Panel two');
  });

  it('reports value changes', () => {
    const onValueChange = vi.fn();
    renderTabs({ onValueChange });

    fireEvent.click(screen.getByRole('tab', { name: 'Two' }));

    expect(onValueChange).toHaveBeenCalledWith('two', expect.any(Object));
  });

  it('is controlled when given value', () => {
    const { rerender } = render(
      <Tabs value="one">
        <TabsList>
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
        </TabsList>
        <TabsContent value="one">Panel one</TabsContent>
        <TabsContent value="two">Panel two</TabsContent>
      </Tabs>,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Two' }));
    expect(screen.getByRole('tabpanel').textContent).toBe('Panel one');

    rerender(
      <Tabs value="two">
        <TabsList>
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
        </TabsList>
        <TabsContent value="one">Panel one</TabsContent>
        <TabsContent value="two">Panel two</TabsContent>
      </Tabs>,
    );
    expect(screen.getByRole('tabpanel').textContent).toBe('Panel two');
  });

  it('does not select a disabled tab', () => {
    renderTabs();
    const disabled = screen.getByRole('tab', { name: 'Three' });

    fireEvent.click(disabled);

    expect(disabled.getAttribute('aria-selected')).toBe('false');
    expect(screen.getByRole('tabpanel').textContent).toBe('Panel one');
  });

  it('labels each panel by its tab', () => {
    renderTabs();

    expect(screen.getByRole('tabpanel', { name: 'One' })).toBeTruthy();
  });

  it('marks slots on every part', () => {
    renderTabs();

    expect(document.querySelector('[data-slot="tabs"]')).not.toBeNull();
    expect(screen.getByRole('tablist').getAttribute('data-slot')).toBe(
      'tabs-list',
    );
    expect(
      screen.getByRole('tab', { name: 'One' }).getAttribute('data-slot'),
    ).toBe('tabs-trigger');
    expect(screen.getByRole('tabpanel').getAttribute('data-slot')).toBe(
      'tabs-content',
    );
  });

  it('is horizontal by default and honours vertical', () => {
    const { unmount } = renderTabs();
    expect(
      document
        .querySelector('[data-slot="tabs"]')
        ?.getAttribute('data-orientation'),
    ).toBe('horizontal');
    unmount();

    renderTabs({ orientation: 'vertical' });
    expect(
      document
        .querySelector('[data-slot="tabs"]')
        ?.getAttribute('data-orientation'),
    ).toBe('vertical');
  });

  // The wrapper once showed `vertical` while Base UI still ran horizontal: the
  // list said so to screen readers, and only Left and Right moved between tabs.
  it('hands its orientation to the tabs themselves, keys included', async () => {
    renderTabs({ orientation: 'vertical' });
    const list = screen.getByRole('tablist');
    expect(list.getAttribute('aria-orientation')).toBe('vertical');

    screen.getByRole('tab', { name: 'One' }).focus();
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    // Base UI moves focus after the key event, not during it.
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole('tab', { name: 'Two' }),
      ),
    );
  });

  it('defaults the list to the default variant and honours line', () => {
    const { unmount } = renderTabs();
    expect(screen.getByRole('tablist').getAttribute('data-variant')).toBe(
      'default',
    );
    unmount();

    renderTabs({}, { variant: 'line' });
    expect(screen.getByRole('tablist').getAttribute('data-variant')).toBe(
      'line',
    );
  });

  it('exposes tabsListVariants for styling other elements', () => {
    expect(tabsListVariants({ variant: 'default' })).toContain('bg-muted');
    expect(tabsListVariants({ variant: 'line' })).toContain('bg-transparent');
  });
});
