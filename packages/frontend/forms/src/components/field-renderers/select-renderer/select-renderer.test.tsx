import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { FieldRendererProps } from '../../../types';
import { SelectRenderer } from './select-renderer';

const props = (
  extra: Partial<FieldRendererProps> = {},
): FieldRendererProps => ({
  field: {
    type: 'select',
    name: 's',
    label: 'S',
    options: [
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Beta' },
    ],
    props: { placeholder: 'Choose one' },
  },
  id: 'id-s',
  value: undefined,
  onChange: vi.fn(),
  onBlur: vi.fn(),
  invalid: false,
  disabled: false,
  required: false,
  ...extra,
});

describe('SelectRenderer', () => {
  const show = (p: FieldRendererProps) => {
    render(
      <>
        <label htmlFor="id-s">S</label>
        <SelectRenderer {...p} />
      </>,
    );
    return screen.getByLabelText('S');
  };

  it('shows the placeholder when nothing is chosen', () => {
    expect(show(props()).textContent).toContain('Choose one');
  });

  it("shows the chosen option's label", () => {
    expect(show(props({ value: 'b' })).textContent).toContain('Beta');
  });

  it("emits the chosen option's value", async () => {
    const p = props();
    const trigger = show(p);
    await act(async () => {
      fireEvent.click(trigger);
    });
    await act(async () => {
      fireEvent.click(await screen.findByRole('option', { name: 'Alpha' }));
    });
    expect(p.onChange).toHaveBeenCalledWith('a');
  });

  it('wires aria-invalid and aria-describedby on the trigger', () => {
    const trigger = show(props({ invalid: true, describedBy: 'id-s-error' }));
    expect(trigger.getAttribute('aria-invalid')).toBe('true');
    expect(trigger.getAttribute('aria-describedby')).toBe('id-s-error');
  });

  it('offers Clear on a clearable select once something is chosen', () => {
    const p = props({
      value: 'a',
      field: {
        type: 'select',
        name: 's',
        label: 'S',
        options: [{ value: 'a', label: 'Alpha' }],
        props: { clearable: true },
      },
    });
    render(<SelectRenderer {...p} />);

    fireEvent.click(screen.getByRole('button', { name: 'Clear S' }));

    expect(p.onChange).toHaveBeenCalledWith(undefined);
  });

  it('offers no Clear while nothing is chosen or when not clearable', () => {
    render(<SelectRenderer {...props({ value: 'a' })} />);
    expect(screen.queryByRole('button', { name: /Clear/ })).toBeNull();
  });

  it('switches to a filter input when searchable', () => {
    render(
      <SelectRenderer
        {...props({
          field: {
            type: 'select',
            name: 's',
            label: 'S',
            options: [{ value: 'a', label: 'Alpha' }],
            props: { searchable: true },
          },
        })}
      />,
    );
    expect(screen.getByRole('combobox').tagName).toBe('INPUT');
  });

  const optionsField = (
    options: { value: string; label: string; group?: string }[],
    extra: Record<string, unknown> = {},
  ) =>
    props({
      field: { type: 'select', name: 's', label: 'S', options, props: extra },
    });

  it('lists options under a heading each when they name groups, gathered by group', async () => {
    const trigger = show(
      optionsField([
        { value: 'a', label: 'Apple', group: 'Fruit' },
        { value: 'c', label: 'Carrot', group: 'Veg' },
        { value: 'p', label: 'Pear', group: 'Fruit' },
      ]),
    );
    await act(async () => {
      fireEvent.click(trigger);
    });

    const groups = await screen.findAllByRole('group');
    expect(groups.map((group) => group.textContent)).toEqual([
      'FruitApplePear',
      'VegCarrot',
    ]);
  });

  it('keeps a plain select for a short list even when virtualize has a threshold', () => {
    const trigger = show(
      optionsField([{ value: 'a', label: 'Alpha' }], {
        virtualize: { threshold: 5 },
      }),
    );
    expect(trigger.tagName).toBe('BUTTON');
  });

  it('becomes a searchable, windowed list once virtualize applies', () => {
    const options = Array.from({ length: 6 }, (_, index) => ({
      value: `v${index}`,
      label: `Item ${index}`,
    }));
    const trigger = show(
      optionsField(options, { virtualize: { threshold: 5 } }),
    );
    expect(trigger.tagName).toBe('INPUT');
  });

  it('becomes searchable for virtualize: true whatever the length', () => {
    const trigger = show(
      optionsField([{ value: 'a', label: 'Alpha' }], { virtualize: true }),
    );
    expect(trigger.tagName).toBe('INPUT');
  });
});
