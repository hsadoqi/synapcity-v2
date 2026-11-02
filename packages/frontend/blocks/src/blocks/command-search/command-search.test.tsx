import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { FileTextIcon } from 'lucide-react';
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { Command } from '@synapcity/frontend-ui/core/command';

import { CommandSearch, type CommandSearchGroup } from '.';
import { CommandSearchButton } from './command-search-button';
import { CommandSearchGroup as Group } from './command-search-group';
import { defaultGroups } from './default-actions';

beforeAll(() => {
  // cmdk measures its list; jsdom has no layout.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.scrollIntoView ??= () => {};
});

beforeEach(() => {
  // CommandSearch logs its resolved actions on every render; keep the output clean.
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

const press = (init: KeyboardEventInit) =>
  act(() => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { ...init, cancelable: true }),
    );
  });

const openByClick = async (label = 'Search files...') => {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(label) }));
  return screen.findByPlaceholderText('Type a command or search...');
};

describe('CommandSearchButton', () => {
  it('shows its label and shortcut and opens on click', () => {
    const onOpen = vi.fn();
    render(<CommandSearchButton onOpen={onOpen} label="Find" />);
    const button = screen.getByRole('button', { name: /Find/ });
    expect(button.textContent).toContain('⌘J');
    fireEvent.click(button);
    expect(onOpen).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('defaults to Search and ⌘J', () => {
    render(<CommandSearchButton />);
    const button = screen.getByRole('button');
    expect(button.textContent).toContain('Search');
    expect(button.querySelector('[data-slot="kbd"]')!.textContent).toBe('⌘J');
  });

  it('shows a custom shortcut', () => {
    render(<CommandSearchButton shortcut="Ctrl+J" />);
    expect(screen.getByText('Ctrl+J')).toBeTruthy();
  });

  it('does nothing when clicked without an onOpen handler', () => {
    render(<CommandSearchButton />);
    expect(() => fireEvent.click(screen.getByRole('button'))).not.toThrow();
  });

  it.each([
    ['xs', 'w-36', 'size-3'],
    ['sm', 'w-40', 'size-3.5'],
    ['md', 'w-52', 'size-4'],
    ['lg', 'w-60', 'size-4.5'],
    ['xl', 'w-72', 'size-5'],
  ] as const)(
    'renders the %s size with a %s button and a %s icon',
    (size, width, icon) => {
      render(<CommandSearchButton size={size} />);
      const button = screen.getByRole('button');
      expect(button.classList.contains(width)).toBe(true);
      expect(button.querySelector('svg')!.classList.contains(icon)).toBe(true);
      expect(button.className).not.toContain('[object Object]');
    },
  );

  it('defaults to the md size', () => {
    render(<CommandSearchButton />);
    expect(screen.getByRole('button').classList.contains('w-52')).toBe(true);
  });
});

describe('defaultGroups', () => {
  it('has Suggestions, Recent and Quick Links, each with items', () => {
    expect(defaultGroups.map((group) => group.heading)).toEqual([
      'Suggestions',
      'Recent',
      'Quick Links',
    ]);
    for (const group of defaultGroups) {
      expect(group.items.length).toBeGreaterThan(0);
      for (const item of group.items) expect(item.label).toBeTruthy();
    }
  });

  it('gives every Recent item a timestamp and no other group any', () => {
    for (const group of defaultGroups) {
      const stamped = group.items.every((item) => Boolean(item.timestamp));
      expect(stamped).toBe(group.heading === 'Recent');
    }
  });
});

describe('CommandSearchGroup', () => {
  const renderGroup = (props: Partial<Parameters<typeof Group>[0]> = {}) =>
    render(
      <Command>
        <Group
          heading="Docs"
          items={[{ label: 'One' }, { label: 'Two' }]}
          {...props}
        />
      </Command>,
    );

  it('lists its items under the heading', () => {
    renderGroup();
    expect(screen.getByText('Docs')).toBeTruthy();
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'One',
      'Two',
    ]);
  });

  it('renders no items for an empty group', () => {
    renderGroup({ items: [] });
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('runs onSelect and then onClose when an item is chosen', () => {
    const calls: string[] = [];
    renderGroup({
      items: [{ label: 'One', onSelect: () => calls.push('select') }],
      onClose: () => calls.push('close'),
    });
    fireEvent.click(screen.getByRole('option', { name: 'One' }));
    expect(calls).toEqual(['select', 'close']);
  });

  it('still closes when an item has no handler', () => {
    const onClose = vi.fn();
    renderGroup({ onClose });
    fireEvent.click(screen.getByRole('option', { name: 'One' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('selects without error when there is no onClose', () => {
    renderGroup();
    expect(() =>
      fireEvent.click(screen.getByRole('option', { name: 'One' })),
    ).not.toThrow();
  });

  it('shows a timestamp in the shortcut slot and mutes the icon', () => {
    renderGroup({
      items: [{ label: 'Report', icon: FileTextIcon, timestamp: '2m ago' }],
    });
    const option = screen.getByRole('option');
    expect(within(option).getByText('2m ago')).toBeTruthy();
    expect(
      option.querySelector('[data-slot="command-shortcut"]'),
    ).not.toBeNull();
    expect(option.querySelector('svg')!.getAttribute('class')).toContain(
      'text-muted-foreground',
    );
  });

  it('shows an icon without a timestamp unmuted', () => {
    renderGroup({ items: [{ label: 'Report', icon: FileTextIcon }] });
    const icon = screen.getByRole('option').querySelector('svg')!;
    expect(icon.getAttribute('class') ?? '').not.toContain(
      'text-muted-foreground',
    );
  });

  it('renders a separator above the group only when asked and not last', () => {
    const { container, rerender } = renderGroup({
      showSeparators: true,
      last: false,
    });
    expect(
      container.querySelector('[data-slot="command-separator"]'),
    ).not.toBeNull();

    rerender(
      <Command>
        <Group heading="Docs" items={[]} showSeparators last />
      </Command>,
    );
    expect(
      container.querySelector('[data-slot="command-separator"]'),
    ).toBeNull();

    rerender(
      <Command>
        <Group heading="Docs" items={[]} showSeparators={false} />
      </Command>,
    );
    expect(
      container.querySelector('[data-slot="command-separator"]'),
    ).toBeNull();
  });
});

describe('CommandSearch', () => {
  it('shows only the trigger until opened', () => {
    render(<CommandSearch />);
    expect(screen.getByRole('button', { name: /Search files/ })).toBeTruthy();
    expect(
      screen.queryByPlaceholderText('Type a command or search...'),
    ).toBeNull();
  });

  it('uses the custom button label', () => {
    render(<CommandSearch buttonLabel="Find a doc" />);
    expect(screen.getByRole('button', { name: /Find a doc/ })).toBeTruthy();
  });

  it('opens from the button with the default groups and the action footer', async () => {
    render(<CommandSearch />);
    await openByClick();

    for (const heading of ['Suggestions', 'Recent', 'Quick Links']) {
      expect(screen.getByText(heading)).toBeTruthy();
    }
    expect(screen.getByRole('option', { name: /Dashboard/ })).toBeTruthy();
    expect(screen.getByText('2m ago')).toBeTruthy();
    for (const hint of ['To close', 'To Select', 'To Navigate']) {
      expect(screen.getByText(hint)).toBeTruthy();
    }
    expect(screen.getByText('esc')).toBeTruthy();
  });

  it('uses a custom placeholder', async () => {
    render(<CommandSearch placeholder="Jump to…" />);
    fireEvent.click(screen.getByRole('button'));
    expect(await screen.findByPlaceholderText('Jump to…')).toBeTruthy();
  });

  it('opens and closes with Cmd+J and Ctrl+J', async () => {
    render(<CommandSearch />);
    press({ key: 'j', metaKey: true });
    expect(
      await screen.findByPlaceholderText('Type a command or search...'),
    ).toBeTruthy();

    press({ key: 'j', ctrlKey: true });
    expect(
      screen.queryByPlaceholderText('Type a command or search...'),
    ).toBeNull();
  });

  it('prevents the browser default for its shortcut only', () => {
    render(<CommandSearch />);
    const handled = new KeyboardEvent('keydown', {
      key: 'j',
      ctrlKey: true,
      cancelable: true,
    });
    act(() => {
      document.dispatchEvent(handled);
    });
    expect(handled.defaultPrevented).toBe(true);
  });

  it.each([
    ['j alone', { key: 'j' }],
    ['another key with Cmd', { key: 'k', metaKey: true }],
    ['another key with Ctrl', { key: 'k', ctrlKey: true }],
    ['Shift+J', { key: 'j', shiftKey: true }],
  ])('ignores %s', (_, init) => {
    render(<CommandSearch />);
    const event = new KeyboardEvent('keydown', { ...init, cancelable: true });
    act(() => {
      document.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(false);
    expect(
      screen.queryByPlaceholderText('Type a command or search...'),
    ).toBeNull();
  });

  it('stops listening for the shortcut after unmount', () => {
    const { unmount } = render(<CommandSearch />);
    unmount();
    const event = new KeyboardEvent('keydown', {
      key: 'j',
      ctrlKey: true,
      cancelable: true,
    });
    document.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('renders custom groups instead of the defaults', async () => {
    const groups: CommandSearchGroup[] = [
      { heading: 'Documents', items: [{ label: 'Doc1' }, { label: 'Doc2' }] },
    ];
    render(<CommandSearch groups={groups} />);
    await openByClick();

    expect(screen.getByText('Documents')).toBeTruthy();
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Doc1',
      'Doc2',
    ]);
    expect(screen.queryByText('Suggestions')).toBeNull();
  });

  it('runs the chosen item and closes the dialog', async () => {
    const onSelect = vi.fn();
    render(
      <CommandSearch
        groups={[{ heading: 'Docs', items: [{ label: 'Doc1', onSelect }] }]}
      />,
    );
    await openByClick();

    fireEvent.click(screen.getByRole('option', { name: 'Doc1' }));
    expect(onSelect).toHaveBeenCalledOnce();
    expect(
      screen.queryByPlaceholderText('Type a command or search...'),
    ).toBeNull();
  });

  it('filters as you type and reports an empty result', async () => {
    render(<CommandSearch emptyMessage="Nothing here" />);
    const input = await openByClick();

    fireEvent.change(input, { target: { value: 'Sprint' } });
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      expect.stringContaining('Sprint Planning'),
    ]);

    fireEvent.change(input, { target: { value: 'zzzz-no-match' } });
    expect(screen.getByText('Nothing here')).toBeTruthy();
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('shows the default empty message', async () => {
    render(<CommandSearch groups={[]} />);
    await openByClick();
    expect(screen.getByText('No results found.')).toBeTruthy();
  });

  it('draws separators between groups by default and omits them when asked', async () => {
    const groups: CommandSearchGroup[] = [
      { heading: 'A', items: [{ label: 'a1' }, { label: 'a2' }] },
      { heading: 'B', items: [{ label: 'b1' }] },
    ];
    const { unmount } = render(<CommandSearch groups={groups} />);
    await openByClick();
    const withSeparators = document.querySelectorAll(
      '[data-slot="command-separator"]',
    ).length;
    expect(withSeparators).toBeGreaterThan(1); // group divider(s) plus the footer divider
    unmount();

    render(<CommandSearch groups={groups} showSeparators={false} />);
    await openByClick();
    expect(
      document.querySelectorAll('[data-slot="command-separator"]'),
    ).toHaveLength(1);
  });

  it('reopens cleanly after closing with the shortcut', async () => {
    render(<CommandSearch />);
    press({ key: 'j', ctrlKey: true });
    await screen.findByPlaceholderText('Type a command or search...');
    press({ key: 'j', ctrlKey: true });
    press({ key: 'j', ctrlKey: true });
    expect(
      await screen.findByPlaceholderText('Type a command or search...'),
    ).toBeTruthy();
  });
});
