import { fireEvent, render, screen } from '@testing-library/react';
import { Globe, PenLine } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { ContextSwitcher } from '.';
import { SidebarProvider } from '@synapcity/frontend-ui/core/sidebar';
import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';

const options = [
  { label: 'Global', href: '/u/home' },
  { label: 'Writing', href: '/u/home/spaces/s1' },
  { label: 'Garden', href: '/u/home/spaces/s2' },
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

const renderSwitcher = (
  current = 'Global',
  activeHref?: string,
  more?: { label: string; href: string },
) =>
  render(
    <TooltipProvider>
      <SidebarProvider>
        <ContextSwitcher
          current={current}
          icon={current === 'Global' ? <Globe /> : <PenLine />}
          options={options.map((option) => ({
            ...option,
            active: option.href === activeHref,
          }))}
          more={more}
        />
      </SidebarProvider>
    </TooltipProvider>,
  );

const open = async (current = 'Global') => {
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
  });

  it('shows the context’s own icon, decorative, and not the brand mark', () => {
    renderSwitcher('Writing');
    const trigger = screen.getByRole('button', {
      name: 'Switch context: Writing',
    });
    const icon = trigger.querySelector('[data-slot="context-switcher-icon"]')!;

    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(icon.querySelector('svg.lucide-pen-line')).not.toBeNull();
    expect(trigger.querySelector('[data-slot="synapcity-mark"]')).toBeNull();
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

  it('marks the active context with a check and aria-current', async () => {
    renderSwitcher('Writing', '/u/home/spaces/s1');
    const [global, writing] = await open('Writing');

    expect(global!.querySelector('svg')).toBeNull();
    expect(writing!.querySelector('svg')).not.toBeNull();
    expect(writing!.getAttribute('aria-current')).toBe('page');
  });

  it('follows the active flag, not the name, when two share one', async () => {
    renderSwitcher('Writing', '/u/home/spaces/s2');
    const [, first, second] = await open('Writing');

    expect(first!.querySelector('svg')).toBeNull();
    expect(second!.querySelector('svg')).not.toBeNull();
  });

  it('adds a link after the options when given one', async () => {
    renderSwitcher('Global', '/u/home', {
      label: 'All spaces',
      href: '/u/home/spaces',
    });
    const items = await open();

    expect(items.at(-1)!.textContent).toBe('All spaces');
    expect(items.at(-1)!.getAttribute('href')).toBe('/u/home/spaces');
  });

  it('marks nothing when no option is active', async () => {
    renderSwitcher('Elsewhere');
    const items = await open('Elsewhere');

    expect(items.every((item) => item.querySelector('svg') === null)).toBe(
      true,
    );
  });
});
