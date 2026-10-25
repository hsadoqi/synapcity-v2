import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ContextSwitcher } from '.';
import { SidebarProvider } from '@synapcity/frontend-ui/core/sidebar';
import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';

const versions = ['1.0.1', '1.1.0-alpha', '2.0.0-beta1'];

// const documents = [
//   {
//     id: '1',
//     name: 'Doc1',
//     description: 'Description for Doc1',
//     tags: ['doc', 'doc1', 'reading'],
//   },
//   {
//     id: '2',
//     name: 'Doc2',
//     description: 'Description for Doc2',
//     tags: ['doc', 'doc2', 'tech'],
//   },
// ];

// const dashboards = [
//   {
//     id: '1',
//     name: 'dash1',
//     description: 'Description for Dash1',
//     tags: ['dash', 'dash1', 'fitness'],
//   },
//   {
//     id: '2',
//     name: 'dash2',
//     description: 'Description for Dash2',
//     tags: ['dash', 'dash2', 'finance'],
//   },
// ];

// const spaces = [
//   {
//     id: '1',
//     name: 'space1',
//     description: 'Description for Space1',
//     tags: ['space', 'space1', 'work'],
//   },
//   {
//     id: '2',
//     name: 'space2',
//     description: 'Description for Space2',
//     tags: ['space', 'space2', 'personal'],
//   },
// ];

// const contexts = ['home', 'space', 'document', 'dashboard'];

const renderSwitcher = (defaultVersion = versions[0]!) =>
  render(
    <TooltipProvider>
      <SidebarProvider>
        <ContextSwitcher versions={versions} defaultVersion={defaultVersion} />
      </SidebarProvider>
    </TooltipProvider>,
  );

describe('ContextSwitcher', () => {
  it('shows the Synapcity wordmark in an accessibly named trigger', () => {
    renderSwitcher();
    const trigger = screen.getByRole('button', { name: 'Switch version' });

    expect(
      trigger.querySelector('[data-slot="synapcity-wordmark"]'),
    ).not.toBeNull();
  });

  it('lists every version when opened', async () => {
    renderSwitcher();
    fireEvent.click(screen.getByRole('button', { name: 'Switch version' }));
    await screen.findByRole('menu');

    expect(
      screen.getAllByRole('menuitem').map((el) => el.textContent?.trim()),
    ).toEqual(versions.map((version) => `v${version}`));
  });

  it('marks the selected version with a check', async () => {
    renderSwitcher();
    fireEvent.click(screen.getByRole('button', { name: 'Switch version' }));
    const [first, second] = await screen.findAllByRole('menuitem');

    expect(first!.querySelector('svg')).not.toBeNull();
    expect(second!.querySelector('svg')).toBeNull();
  });

  it('moves the check when another version is chosen', async () => {
    renderSwitcher();
    fireEvent.click(screen.getByRole('button', { name: 'Switch version' }));
    fireEvent.click(
      await screen.findByRole('menuitem', { name: 'v2.0.0-beta1' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Switch version' }));
    const items = await screen.findAllByRole('menuitem');

    expect(items[0]!.querySelector('svg')).toBeNull();
    expect(items[2]!.querySelector('svg')).not.toBeNull();
  });
});
