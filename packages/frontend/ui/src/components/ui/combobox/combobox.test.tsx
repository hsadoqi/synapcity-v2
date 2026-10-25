import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxVirtualList,
  useComboboxVirtualizer,
} from '@synapcity/frontend-ui/core/combobox';

const zones = ['UTC', 'Europe/Paris', 'Asia/Tokyo'];

const renderCombobox = (onValueChange = vi.fn()) =>
  render(
    <Combobox items={zones} onValueChange={onValueChange}>
      <ComboboxInput aria-label="Timezone" placeholder="Search" />
      <ComboboxContent>
        <ComboboxEmpty>No matches.</ComboboxEmpty>
        <ComboboxList>
          {(zone: string) => (
            <ComboboxItem key={zone} value={zone}>
              {zone}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>,
  );

const open = () =>
  fireEvent.keyDown(screen.getByRole('combobox', { name: 'Timezone' }), {
    key: 'ArrowDown',
  });

describe('Combobox', () => {
  it('opens a list of every item', async () => {
    renderCombobox();
    open();
    expect(
      (await screen.findAllByRole('option')).map((o) => o.textContent),
    ).toEqual(zones);
  });

  it('narrows the list to items matching what was typed', async () => {
    renderCombobox();
    open();
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'tok' },
    });
    await waitFor(() =>
      expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
        'Asia/Tokyo',
      ]),
    );
  });

  it('says so when nothing matches', async () => {
    renderCombobox();
    open();
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'zzz' },
    });
    expect(await screen.findByText('No matches.')).toBeTruthy();
  });

  it('reports the picked item', async () => {
    const onValueChange = vi.fn();
    renderCombobox(onValueChange);
    open();
    const item = await screen.findByRole('option', { name: 'Europe/Paris' });
    fireEvent.pointerDown(item, { pointerType: 'mouse', button: 0 });
    fireEvent.click(item, { detail: 1 });
    await waitFor(() =>
      expect(onValueChange).toHaveBeenCalledWith(
        'Europe/Paris',
        expect.anything(),
      ),
    );
  });
});

const many = Array.from({ length: 1000 }, (_, index) => `Option ${index + 1}`);

function VirtualExample({ enabled = true }: { enabled?: boolean }) {
  const virtualizer = useComboboxVirtualizer();
  return (
    <Combobox
      items={many}
      virtualized={enabled}
      onItemHighlighted={virtualizer.onItemHighlighted}
    >
      <ComboboxInput aria-label="Long list" />
      <ComboboxContent>
        <ComboboxVirtualList virtualizer={virtualizer} enabled={enabled}>
          {(item: string, index: number) => (
            <ComboboxItem key={item} value={item} index={index}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxVirtualList>
      </ComboboxContent>
    </Combobox>
  );
}

describe('ComboboxInput buttons', () => {
  it('keeps the dropdown and clear buttons out of the tab order, leaving the input as the one stop', () => {
    render(
      <Combobox items={zones} defaultValue="UTC">
        <ComboboxInput aria-label="Timezone" showClear />
      </Combobox>,
    );

    expect(
      screen.getByRole('button', { name: 'Clear selection' }).tabIndex,
    ).toBe(-1);
    expect(screen.getByRole('combobox', { name: 'Timezone' }).tabIndex).toBe(0);
  });

  it('keeps the dropdown button out of the tab order', () => {
    render(
      <Combobox items={zones}>
        <ComboboxInput aria-label="Timezone" />
      </Combobox>,
    );

    expect(screen.getByRole('button', { name: 'Show options' }).tabIndex).toBe(
      -1,
    );
  });
});

describe('ComboboxVirtualList', () => {
  const openLong = () =>
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Long list' }), {
      key: 'ArrowDown',
    });

  it('renders only a window of a long list, with a spacer for the rest', async () => {
    render(<VirtualExample />);
    openLong();

    const options = await screen.findAllByRole('option');
    expect(options.length).toBeLessThanOrEqual(20);
    expect(options[0]?.textContent).toBe('Option 1');
    const list = document.querySelector('[data-slot="combobox-list"]');
    expect(list?.lastElementChild?.getAttribute('aria-hidden')).toBe('true');
  });

  it('windows the filtered items, not the full list', async () => {
    render(<VirtualExample />);
    openLong();
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'Option 999' },
    });

    await waitFor(() =>
      expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
        'Option 999',
      ]),
    );
  });

  it('renders every row when windowing is off', async () => {
    render(<VirtualExample enabled={false} />);
    openLong();

    expect(await screen.findAllByRole('option')).toHaveLength(1000);
  });
});

const produce = [
  ['Apple', 'Fruit'],
  ['Pear', 'Fruit'],
  ['Carrot', 'Veg'],
  ['Leek', 'Veg'],
] as const;
const produceNames = produce.map(([name]) => name);
const produceGroup = (name: string) => produce.find(([n]) => n === name)?.[1];

function GroupedExample({ enabled }: { enabled: boolean }) {
  const virtualizer = useComboboxVirtualizer();
  return (
    <Combobox
      items={produceNames}
      virtualized={enabled}
      onItemHighlighted={virtualizer.onItemHighlighted}
    >
      <ComboboxInput aria-label="Produce" />
      <ComboboxContent>
        <ComboboxVirtualList
          virtualizer={virtualizer}
          enabled={enabled}
          groupBy={produceGroup}
          aria-label="Produce"
        >
          {(item: string, index: number) => (
            <ComboboxItem key={item} value={item} index={index}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxVirtualList>
      </ComboboxContent>
    </Combobox>
  );
}

describe('ComboboxVirtualList with groups', () => {
  const openProduce = () =>
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Produce' }), {
      key: 'ArrowDown',
    });

  it('draws a heading before each group when windowed, leaving the options as the only options', async () => {
    render(<GroupedExample enabled />);
    openProduce();

    expect(
      (await screen.findAllByRole('option')).map((o) => o.textContent),
    ).toEqual(produceNames);
    const labels = [
      ...document.querySelectorAll('[data-slot="combobox-label"]'),
    ];
    expect(labels.map((label) => label.textContent)).toEqual(['Fruit', 'Veg']);
    expect(
      labels.every((label) => label.getAttribute('role') === 'presentation'),
    ).toBe(true);
  });

  it('draws real, named groups when not windowed', async () => {
    render(<GroupedExample enabled={false} />);
    openProduce();

    await screen.findAllByRole('option');
    const groups = within(screen.getByRole('listbox')).getAllByRole('group');
    expect(groups.map((group) => group.textContent)).toEqual([
      'FruitApplePear',
      'VegCarrotLeek',
    ]);
    expect(screen.getByRole('group', { name: 'Veg' })).toBeTruthy();
  });

  it('drops the heading of a group the filter empties', async () => {
    render(<GroupedExample enabled />);
    openProduce();
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'lee' },
    });

    await waitFor(() =>
      expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
        'Leek',
      ]),
    );
    expect(
      [...document.querySelectorAll('[data-slot="combobox-label"]')].map(
        (label) => label.textContent,
      ),
    ).toEqual(['Veg']);
  });
});
