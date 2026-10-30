import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Kbd, KbdGroup } from '@synapcity/frontend-ui/core/kbd';

describe('Kbd', () => {
  it('renders its children in a kbd element with the kbd slot', () => {
    render(<Kbd>⌘K</Kbd>);
    const key = screen.getByText('⌘K');
    expect(key.tagName).toBe('KBD');
    expect(key.getAttribute('data-slot')).toBe('kbd');
  });

  it('uses semantic token classes, never palette colours', () => {
    render(<Kbd>Esc</Kbd>);
    const key = screen.getByText('Esc');
    expect(key.classList.contains('bg-muted')).toBe(true);
    expect(key.classList.contains('text-muted-foreground')).toBe(true);
    expect(key.className).not.toMatch(
      /\b(?:bg|text)-(?:gray|slate|zinc|blue)-/,
    );
  });

  it('is not interactive: it ignores pointer events and cannot be selected', () => {
    render(<Kbd>Tab</Kbd>);
    const key = screen.getByText('Tab');
    expect(key.classList.contains('pointer-events-none')).toBe(true);
    expect(key.classList.contains('select-none')).toBe(true);
    expect(key.hasAttribute('tabindex')).toBe(false);
  });

  it('merges a caller className after the base classes', () => {
    render(<Kbd className="ml-auto">J</Kbd>);
    const key = screen.getByText('J');
    expect(key.classList.contains('ml-auto')).toBe(true);
    expect(key.classList.contains('inline-flex')).toBe(true);
  });

  it('lets a caller class override a conflicting base class', () => {
    render(<Kbd className="h-8">Big</Kbd>);
    const key = screen.getByText('Big');
    expect(key.classList.contains('h-8')).toBe(true);
    expect(key.classList.contains('h-5')).toBe(false);
  });

  it('forwards native attributes and the ref', () => {
    const ref = createRef<HTMLElement>();
    render(
      <Kbd ref={ref} id="shortcut" title="Open search" aria-label="Command J">
        J
      </Kbd>,
    );
    const key = screen.getByLabelText('Command J');
    expect(ref.current).toBe(key);
    expect(key.getAttribute('id')).toBe('shortcut');
    expect(key.getAttribute('title')).toBe('Open search');
  });

  it('renders an icon child with the default icon size marker', () => {
    render(
      <Kbd>
        <svg data-testid="icon" />
      </Kbd>,
    );
    const key = screen.getByTestId('icon').parentElement!;
    expect(key.className).toContain('[&_svg:not([class*=');
  });

  it('renders no text for an empty key', () => {
    const { container } = render(<Kbd />);
    const key = container.querySelector('[data-slot="kbd"]')!;
    expect(key.textContent).toBe('');
  });
});

describe('KbdGroup', () => {
  it('groups several keys under the kbd-group slot', () => {
    render(
      <KbdGroup data-testid="group">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>,
    );
    const group = screen.getByTestId('group');
    expect(group.getAttribute('data-slot')).toBe('kbd-group');
    expect(group.querySelectorAll('[data-slot="kbd"]')).toHaveLength(2);
    expect(group.textContent).toBe('⌘K');
  });

  it('lays its keys out in an inline row with a gap', () => {
    render(<KbdGroup data-testid="group" />);
    const group = screen.getByTestId('group');
    for (const name of ['inline-flex', 'items-center', 'gap-1']) {
      expect(group.classList.contains(name)).toBe(true);
    }
  });

  it('merges a caller className', () => {
    render(<KbdGroup data-testid="group" className="ml-2" />);
    expect(screen.getByTestId('group').classList.contains('ml-2')).toBe(true);
  });

  it('renders a kbd element, which keeps nested keys valid keyboard markup', () => {
    render(<KbdGroup data-testid="group" />);
    expect(screen.getByTestId('group').tagName).toBe('KBD');
  });
});
