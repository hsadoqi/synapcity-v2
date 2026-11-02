import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { CommandPalette, type CommandPaletteGroup } from '.';

beforeAll(() => {
  // cmdk measures its list; jsdom has no layout.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.scrollIntoView ??= () => {};
});

const create = vi.fn();
const groups: CommandPaletteGroup[] = [
  {
    heading: 'Go to',
    items: [
      { label: 'Home', href: '/u/home' },
      { label: 'Settings', href: '/u/settings' },
    ],
  },
  {
    heading: 'Spaces',
    items: [{ label: 'Writing', href: '/u/home/spaces/s1' }],
  },
  { heading: 'Create', items: [{ label: 'New space', onSelect: create }] },
  { heading: 'Empty', items: [] },
];

function Harness({ onNavigate }: { onNavigate: (href: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <output data-testid="open">{String(open)}</output>
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        groups={groups}
        onNavigate={onNavigate}
      />
    </>
  );
}

const openWithShortcut = async () => {
  act(() => {
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
  });
  return screen.findByPlaceholderText('Search or jump to…');
};

describe('CommandPalette', () => {
  it('opens and closes with ⌘K or Ctrl+K', async () => {
    render(<Harness onNavigate={() => {}} />);

    await openWithShortcut();
    expect(screen.getByTestId('open').textContent).toBe('true');
    act(() => {
      fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    });
    expect(screen.getByTestId('open').textContent).toBe('false');
  });

  it('closes with ⌘K from its own search field', async () => {
    render(<Harness onNavigate={() => {}} />);
    const search = await openWithShortcut();
    act(() => {
      fireEvent.keyDown(search, { key: 'k', metaKey: true });
    });
    expect(screen.getByTestId('open').textContent).toBe('false');
  });

  it('leaves ⌘K that something nearer handled, a held key, and IME composition', () => {
    render(
      <>
        <Harness onNavigate={() => {}} />
        {/* An editor's link binding, at the element layer. */}
        <div
          data-testid="link-owner"
          tabIndex={0}
          onKeyDown={(event) => event.preventDefault()}
        />
      </>,
    );
    act(() => {
      fireEvent.keyDown(screen.getByTestId('link-owner'), {
        key: 'k',
        metaKey: true,
      });
      fireEvent.keyDown(window, { key: 'k', metaKey: true, repeat: true });
      fireEvent.keyDown(window, { key: 'k', metaKey: true, isComposing: true });
    });
    expect(screen.getByTestId('open').textContent).toBe('false');
  });

  it('lists each group with items under its heading, skipping empty ones', async () => {
    render(<Harness onNavigate={() => {}} />);
    await openWithShortcut();

    expect(screen.getByText('Go to')).toBeTruthy();
    expect(screen.getByText('Spaces')).toBeTruthy();
    expect(screen.queryByText('Empty')).toBeNull();
    expect(screen.getAllByRole('option')).toHaveLength(4);
  });

  it('navigates to a place and closes', async () => {
    const onNavigate = vi.fn();
    render(<Harness onNavigate={onNavigate} />);
    await openWithShortcut();

    fireEvent.click(screen.getByRole('option', { name: 'Writing' }));
    expect(onNavigate).toHaveBeenCalledWith('/u/home/spaces/s1');
    expect(screen.getByTestId('open').textContent).toBe('false');
  });

  it('runs an action instead of navigating', async () => {
    const onNavigate = vi.fn();
    render(<Harness onNavigate={onNavigate} />);
    await openWithShortcut();

    fireEvent.click(screen.getByRole('option', { name: 'New space' }));
    expect(create).toHaveBeenCalledOnce();
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('filters as you type, matching group headings too', async () => {
    render(<Harness onNavigate={() => {}} />);
    const input = await openWithShortcut();

    fireEvent.change(input, { target: { value: 'writ' } });
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Writing',
    ]);

    fireEvent.change(input, { target: { value: 'zzz' } });
    expect(screen.getByText('Nothing matches.')).toBeTruthy();
  });
});
