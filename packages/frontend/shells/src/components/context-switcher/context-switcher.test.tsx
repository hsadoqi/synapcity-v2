import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ContextSwitcher } from '.';
import { SidebarProvider } from '@synapcity/frontend-ui/core/sidebar';
import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';

const options = [
  { label: 'Home', href: '/u/home' },
  { label: 'Spaces', href: '/u/home/spaces' },
  { label: 'Documents', href: '/u/home/documents' },
];

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

const renderSwitcher = (current = 'Home') =>
  render(
    <TooltipProvider>
      <SidebarProvider>
        <ContextSwitcher current={current} options={options} />
      </SidebarProvider>
    </TooltipProvider>,
  );

const open = async (current = 'Home') => {
  fireEvent.click(
    screen.getByRole('button', { name: `Switch context: ${current}` }),
  );
  return screen.findAllByRole('menuitem');
};

describe('ContextSwitcher', () => {
  it('shows the active context in an accessibly named trigger', () => {
    renderSwitcher('Writing');
    const trigger = screen.getByRole('button', {
      name: 'Switch context: Writing',
    });

    expect(trigger.textContent).toContain('Writing');
    expect(
      trigger.querySelector('[data-slot="synapcity-mark"]'),
    ).not.toBeNull();
  });

  it('lists every place to switch to as a link', async () => {
    renderSwitcher();
    const items = await open();

    expect(items.map((item) => item.textContent?.trim())).toEqual(
      options.map((option) => option.label),
    );
    expect(items.map((item) => item.getAttribute('href'))).toEqual(
      options.map((option) => option.href),
    );
  });

  it('marks the active context with a check', async () => {
    renderSwitcher('Spaces');
    const [home, spaces] = await open('Spaces');

    expect(home!.querySelector('svg')).toBeNull();
    expect(spaces!.querySelector('svg')).not.toBeNull();
  });

  it('marks nothing when the context is not one of the options', async () => {
    renderSwitcher('Writing');
    const items = await open('Writing');

    expect(items.every((item) => item.querySelector('svg') === null)).toBe(
      true,
    );
  });
});
