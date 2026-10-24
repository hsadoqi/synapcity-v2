import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
