import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { FieldRendererProps } from '../../types';
import { TagsRenderer } from './tags-renderer';

const props = (
  extra: Partial<FieldRendererProps> = {},
): FieldRendererProps => ({
  field: {
    type: 'tags',
    name: 'topics',
    label: 'Topics',
    props: { placeholder: 'Add a topic', maxTags: 3, maxLength: 10 },
  },
  id: 'topics',
  value: [],
  onChange: vi.fn(),
  onBlur: vi.fn(),
  invalid: false,
  disabled: false,
  required: false,
  ...extra,
});

const show = (extra: Partial<FieldRendererProps> = {}) => {
  const p = props(extra);
  const view = render(
    <>
      <label htmlFor="topics">Topics</label>
      <TagsRenderer {...p} />
    </>,
  );
  return {
    p,
    view,
    input: screen.getByLabelText('Topics') as HTMLInputElement,
  };
};

describe('TagsRenderer', () => {
  it('emits the list with the new tag', () => {
    const { p, input } = show({ value: ['design'] });

    fireEvent.change(input, { target: { value: 'ops' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(p.onChange).toHaveBeenCalledWith(['design', 'ops']);
  });

  it('shows only string tags from the value and treats anything else as empty', () => {
    show({ value: ['a', 3, null, 'b'] });
    expect(screen.getByText('a')).toBeTruthy();
    expect(screen.getByText('b')).toBeTruthy();
    expect(screen.queryByText('3')).toBeNull();
  });

  it('applies the field limits', () => {
    const { p, input } = show({ value: ['a', 'b', 'c'] });

    fireEvent.change(input, { target: { value: 'd' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(p.onChange).not.toHaveBeenCalled();
  });

  it('posts each tag under the field name', () => {
    const { view } = show({ value: ['a', 'b'] });
    const hidden = [...view.container.querySelectorAll('input[type="hidden"]')];
    expect(hidden.map((input) => (input as HTMLInputElement).name)).toEqual([
      'topics',
      'topics',
    ]);
  });

  it('wires id, ARIA, blur and the focus ref to the text input', () => {
    const focusRef = { current: null as HTMLElement | null };
    const { p, input } = show({
      invalid: true,
      required: true,
      describedBy: 'topics-error',
      focusRef,
    });

    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('topics-error');
    expect(focusRef.current).toBe(input);
    fireEvent.blur(input);
    expect(p.onBlur).toHaveBeenCalled();
  });
});
