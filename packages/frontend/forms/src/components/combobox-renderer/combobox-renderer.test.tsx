import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { FieldConfig, FieldRendererProps } from '../../types';
import { ComboboxRenderer, shouldVirtualize } from './combobox-renderer';

const OPTIONS = [
  { value: 'design', label: 'Design' },
  { value: 'research', label: 'Research' },
  { value: 'ops', label: 'Operations' },
];

const props = (
  field: FieldConfig,
  extra: Partial<FieldRendererProps> = {},
): FieldRendererProps => ({
  field,
  id: 'f',
  value: undefined,
  onChange: vi.fn(),
  onBlur: vi.fn(),
  invalid: false,
  disabled: false,
  required: false,
  ...extra,
});

const searchable = (extra: Record<string, unknown> = {}): FieldConfig => ({
  type: 'select',
  name: 'team',
  label: 'Team',
  options: OPTIONS,
  props: { searchable: true, placeholder: 'Find a team', ...extra },
});

const multi = (extra: Record<string, unknown> = {}): FieldConfig => ({
  type: 'multiselect',
  name: 'skills',
  label: 'Skills',
  options: OPTIONS,
  props: { placeholder: 'Add skills', ...extra },
});

const show = (p: FieldRendererProps) => {
  const view = render(
    <>
      <label htmlFor="f">Field</label>
      <ComboboxRenderer {...p} />
    </>,
  );
  return { ...view, input: screen.getByLabelText('Field') as HTMLInputElement };
};

const openList = (input: HTMLElement) =>
  fireEvent.keyDown(input, { key: 'ArrowDown' });

describe('shouldVirtualize', () => {
  it('is off unless asked, always on for true, and by length for a threshold', () => {
    expect(shouldVirtualize(undefined, 10_000)).toBe(false);
    expect(shouldVirtualize(false, 10_000)).toBe(false);
    expect(shouldVirtualize(true, 1)).toBe(true);
    expect(shouldVirtualize({ threshold: 100 }, 100)).toBe(false);
    expect(shouldVirtualize({ threshold: 100 }, 101)).toBe(true);
  });
});

describe('ComboboxRenderer, searchable select', () => {
  it('shows the chosen option label and posts its value', () => {
    const { input, container } = show(props(searchable(), { value: 'ops' }));

    expect(input.value).toBe('Operations');
    expect(
      (container.querySelector('input[type="hidden"]') as HTMLInputElement)
        .value,
    ).toBe('ops');
  });

  it('filters the options by what is typed and emits the picked value', async () => {
    const p = props(searchable());
    const { input } = show(p);

    openList(input);
    fireEvent.change(input, { target: { value: 'res' } });
    await waitFor(() =>
      expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
        'Research',
      ]),
    );
    fireEvent.click(screen.getByRole('option', { name: 'Research' }));

    expect(p.onChange).toHaveBeenCalledWith('research');
  });

  it('says so when nothing matches', async () => {
    const { input } = show(props(searchable()));
    openList(input);
    fireEvent.change(input, { target: { value: 'zzz' } });
    expect(await screen.findByText('No matches.')).toBeTruthy();
  });

  it('ignores a value that is not one of the options', () => {
    const { input } = show(props(searchable(), { value: 'ghost' }));
    expect(input.value).toBe('');
  });

  it('offers a clear button only when clearable and something is chosen', () => {
    const p = props(searchable({ clearable: true }), { value: 'ops' });
    show(p);

    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));

    expect(p.onChange).toHaveBeenCalledWith(undefined);
  });

  it('wires id, ARIA, blur and the focus ref to the input', () => {
    const focusRef = { current: null as HTMLElement | null };
    const p = props(searchable(), {
      invalid: true,
      required: true,
      describedBy: 'f-error',
      focusRef,
    });
    const { input } = show(p);

    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('f-error');
    expect(focusRef.current).toBe(input);
    fireEvent.blur(input);
    expect(p.onBlur).toHaveBeenCalled();
  });

  it('windows a long list when virtualize is on', async () => {
    const many = Array.from({ length: 2000 }, (_, index) => ({
      value: `v${index}`,
      label: `Item ${index}`,
    }));
    const { input } = show(
      props({
        ...searchable({ virtualize: true }),
        options: many,
      } as FieldConfig),
    );

    openList(input);

    const options = await screen.findAllByRole('option');
    expect(options.length).toBeLessThanOrEqual(20);
  });
});

describe('ComboboxRenderer, multiselect', () => {
  it('shows a removable chip per chosen value, in order', () => {
    const p = props(multi(), { value: ['ops', 'design'] });
    show(p);

    expect(screen.getByText('Operations')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Remove Design' }));

    expect(p.onChange).toHaveBeenCalledWith(['ops']);
  });

  it('adds a picked option to the list', async () => {
    const p = props(multi(), { value: ['ops'] });
    const { input } = show(p);

    openList(input);
    fireEvent.click(await screen.findByRole('option', { name: 'Research' }));

    expect(p.onChange).toHaveBeenCalledWith(['ops', 'research']);
  });

  it('posts each chosen value under the field name and drops unknown ones', () => {
    const { container } = show(props(multi(), { value: ['ops', 'ghost'] }));
    const hidden = [...container.querySelectorAll('input[type="hidden"]')].map(
      (input) => [
        (input as HTMLInputElement).name,
        (input as HTMLInputElement).value,
      ],
    );
    expect(hidden).toEqual([['skills', 'ops']]);
  });

  it('shows the placeholder only while nothing is chosen', () => {
    const { input, rerender } = show(props(multi(), { value: [] }));
    expect(input.getAttribute('placeholder')).toBe('Add skills');

    rerender(
      <>
        <label htmlFor="f">Field</label>
        <ComboboxRenderer {...props(multi(), { value: ['ops'] })} />
      </>,
    );
    expect(input.getAttribute('placeholder')).toBeNull();
  });

  it('disables the options not chosen once maxSelected is reached', async () => {
    const { input } = show(
      props(multi({ maxSelected: 1 }), { value: ['ops'] }),
    );

    openList(input);

    const design = await screen.findByRole('option', { name: 'Design' });
    expect(design.getAttribute('aria-disabled')).toBe('true');
    expect(
      screen
        .getByRole('option', { name: 'Operations' })
        .getAttribute('aria-disabled'),
    ).not.toBe('true');
  });

  it('clears every value with Clear when clearable', () => {
    const p = props(multi({ clearable: true }), { value: ['ops', 'design'] });
    show(p);

    fireEvent.click(screen.getByRole('button', { name: 'Clear Skills' }));

    expect(p.onChange).toHaveBeenCalledWith([]);
  });

  it('wires id, ARIA and the focus ref to the chip input', () => {
    const focusRef = { current: null as HTMLElement | null };
    const { input } = show(
      props(multi(), { invalid: true, describedBy: 'f-error', focusRef }),
    );

    expect(input.id).toBe('f');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('f-error');
    expect(focusRef.current).toBe(input);
  });

  it('refuses a field of another type', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <ComboboxRenderer
          {...props({ type: 'text', name: 'a', label: 'A' })}
        />,
      ),
    ).toThrow('ComboboxRenderer cannot render a field of type "text"');
    error.mockRestore();
  });
});

describe('ComboboxRenderer, grouped options', () => {
  const grouped = [
    { value: 'a', label: 'Apple', group: 'Fruit' },
    { value: 'c', label: 'Carrot', group: 'Veg' },
    { value: 'p', label: 'Pear', group: 'Fruit' },
  ];

  it('lists the options gathered by group, so keyboard order matches what is drawn', async () => {
    const { input } = show(
      props({
        type: 'multiselect',
        name: 'produce',
        label: 'Produce',
        options: grouped,
      }),
    );
    openList(input);

    expect(
      (await screen.findAllByRole('option')).map((o) => o.textContent),
    ).toEqual(['Apple', 'Pear', 'Carrot']);
    const list = screen.getByRole('listbox');
    expect(
      [...list.querySelectorAll('[data-slot="combobox-label"]')].map(
        (label) => label.textContent,
      ),
    ).toEqual(['Fruit', 'Veg']);
  });

  it('draws headings in a windowed list too, and picks still emit the value', async () => {
    const p = props(
      {
        type: 'select',
        name: 'produce',
        label: 'Produce',
        options: grouped,
        props: { searchable: true, virtualize: true },
      },
      {},
    );
    const { input } = show(p);
    openList(input);

    const option = await screen.findByRole('option', { name: 'Carrot' });
    expect(
      [...document.querySelectorAll('[data-slot="combobox-label"]')].map(
        (label) => label.textContent,
      ),
    ).toEqual(['Fruit', 'Veg']);

    fireEvent.click(option);

    expect(p.onChange).toHaveBeenCalledWith('c');
  });
});
