import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Tabs } from '@synapcity/frontend-ui/core/tabs';

import tabs from '../../../../lib/data';
import { SettingsTabsHeader } from './settings-tabs-header';

const mount = (onTabChange = vi.fn()) => {
  render(
    <Tabs value="theme">
      <SettingsTabsHeader onTabChange={onTabChange} />
    </Tabs>,
  );
  return onTabChange;
};

describe('SettingsTabsHeader', () => {
  it('offers a tab for every settings category', () => {
    mount();

    expect(
      screen.getByRole('tablist', { name: 'Settings categories' }),
    ).toBeTruthy();
    expect(
      screen.getAllByRole('tab').map((t) => t.getAttribute('aria-label')),
    ).toEqual(tabs.map((tab) => tab.label));
  });

  it('marks the current tab as selected', () => {
    mount();

    expect(
      screen.getByRole('tab', { name: 'Theme' }).getAttribute('aria-selected'),
    ).toBe('true');
  });

  it('reports the tab that was clicked', () => {
    const onTabChange = mount();

    fireEvent.click(screen.getByRole('tab', { name: 'Regional' }));

    expect(onTabChange).toHaveBeenCalledWith('regional');
  });
});
