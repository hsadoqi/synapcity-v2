import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
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
