import { createRef } from 'react';
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { FieldRendererProps } from '../../../types';
import { SearchRenderer } from './search-renderer';

const props = (
  extra: Partial<FieldRendererProps> = {},
  fieldProps: Record<string, unknown> = {},
): FieldRendererProps => ({
  field: { type: 'search', name: 'q', label: 'Find', props: fieldProps },
  id: 'q',
  value: '',
  onChange: vi.fn(),
  onBlur: vi.fn(),
  invalid: false,
  disabled: false,
  required: false,
  ...extra,
});

const show = (
  extra: Partial<FieldRendererProps> = {},
  fieldProps: Record<string, unknown> = {},
) => {
  const p = props(extra, fieldProps);
  const view = render(<SearchRenderer {...p} />);
  const input = view.container.querySelector('input') as HTMLInputElement;
  return { p, input, view };
};

describe('SearchRenderer', () => {
  it('shows the value and posts it under the field name', () => {
    const { input } = show({ value: 'ferns' });
    expect(input.type).toBe('search');
    expect(input.id).toBe('q');
    expect(input.name).toBe('q');
    expect(input.value).toBe('ferns');
  });

  it('shows a value that is not a string as empty', () => {
    const { input } = show({ value: 42 });
    expect(input.value).toBe('');
  });

  it('sits in an input group with a hidden magnifier', () => {
    const { input, view } = show();
    expect(input.closest('[data-slot="input-group"]')).not.toBeNull();
    expect(
      view.container.querySelector('svg')?.getAttribute('aria-hidden'),
    ).toBe('true');
  });

  it('emits what is typed and reports blur', () => {
    const { p, input } = show();
    fireEvent.change(input, { target: { value: 'moss' } });
    fireEvent.blur(input);
    expect(p.onChange).toHaveBeenCalledWith('moss');
    expect(p.onBlur).toHaveBeenCalledTimes(1);
  });

  it('asks for the search keyboard unless the field chooses another', () => {
    expect(show().input.inputMode).toBe('search');
    expect(show({}, { inputMode: 'text' }).input.inputMode).toBe('text');
  });

  it('passes the field props to the control', () => {
    const { input } = show(
      {},
      {
        placeholder: 'Search plants…',
        minLength: 2,
        maxLength: 40,
        pattern: '[a-z ]+',
        autoComplete: 'off',
      },
    );
    expect(input.placeholder).toBe('Search plants…');
    expect(input.minLength).toBe(2);
    expect(input.maxLength).toBe(40);
    expect(input.pattern).toBe('[a-z ]+');
    expect(input.autocomplete).toBe('off');
  });

  it('carries invalid, required, disabled and its description', () => {
    const { input } = show({
      invalid: true,
      required: true,
      disabled: true,
      describedBy: 'q-error',
    });
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('q-error');
    expect(input.disabled).toBe(true);
  });

  it('leaves aria-invalid and aria-required off when they do not apply', () => {
    const { input } = show();
    expect(input.hasAttribute('aria-invalid')).toBe(false);
    expect(input.hasAttribute('aria-required')).toBe(false);
  });

  it('attaches the focus ref to the input', () => {
    const focusRef = createRef<HTMLElement>();
    const { input } = show({ focusRef });
    expect(focusRef.current).toBe(input);
  });

  it('refuses a field that is not a search field', () => {
    const p = props();
    expect(() =>
      render(
        <SearchRenderer
          {...p}
          field={{ type: 'text', name: 'q', label: 'Find' }}
        />,
      ),
    ).toThrow('SearchRenderer cannot render a field of type "text"');
  });
});
