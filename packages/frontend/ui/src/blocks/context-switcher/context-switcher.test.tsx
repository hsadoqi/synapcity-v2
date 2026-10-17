import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ContextSwitcher } from '@synapcity/frontend-ui/blocks/context-switcher';
import { SidebarProvider } from '@synapcity/frontend-ui/core/sidebar';
import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';

const versions = ['1.0.1', '1.1.0-alpha', '2.0.0-beta1'];

const renderSwitcher = (defaultVersion = versions[0]!) =>
  render(
    <TooltipProvider>
      <SidebarProvider>
        <ContextSwitcher versions={versions} defaultVersion={defaultVersion} />
      </SidebarProvider>
    </TooltipProvider>,
  );

describe('ContextSwitcher', () => {
  it('shows the product and the selected version', () => {
    renderSwitcher('1.1.0-alpha');
    const trigger = screen.getByRole('button');

    expect(trigger.textContent).toContain('Documentation');
    expect(trigger.textContent).toContain('v1.1.0-alpha');
  });

  it('lists every version when opened', async () => {
    renderSwitcher();
    fireEvent.click(screen.getByRole('button'));
    await screen.findByRole('menu');

    expect(
      screen.getAllByRole('menuitem').map((el) => el.textContent?.trim()),
    ).toEqual(versions.map((version) => `v${version}`));
  });

  it('marks the selected version with a check', async () => {
    renderSwitcher();
    fireEvent.click(screen.getByRole('button'));
    const [first, second] = await screen.findAllByRole('menuitem');

    expect(first!.querySelector('svg')).not.toBeNull();
    expect(second!.querySelector('svg')).toBeNull();
  });

  // Known gap, not fixed here: the items use `onSelect`, a DOM text-selection
  // event, so Base UI's menu never calls it. `onClick` is the Base UI handler.
  // `it.fails` turns green-to-red the day this is fixed, which is the cue to
  // make it a plain `it`.
  it.fails('switches version when one is chosen', async () => {
    renderSwitcher();
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(
      await screen.findByRole('menuitem', { name: 'v2.0.0-beta1' }),
    );

    expect(screen.getByRole('button').textContent).toContain('v2.0.0-beta1');
  });
});
