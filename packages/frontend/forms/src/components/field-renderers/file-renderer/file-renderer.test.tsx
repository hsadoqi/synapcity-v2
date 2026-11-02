import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { FieldConfig } from '../../../types';
import type { FieldRendererProps } from '../../../types';
import { FileRenderer } from './file-renderer';

const png = new File(['a'], 'a.png', { type: 'image/png' });
const jpg = new File(['b'], 'b.jpg', { type: 'image/jpeg' });

const props = (
  field: Partial<Extract<FieldConfig, { type: 'file' }>> = {},
  extra: Partial<FieldRendererProps> = {},
): FieldRendererProps => ({
  field: {
    type: 'file',
    name: 'avatar',
    label: 'Avatar',
    ...field,
  } as FieldConfig,
  id: 'id-f',
  value: undefined,
  onChange: vi.fn(),
  onBlur: vi.fn(),
  invalid: false,
  disabled: false,
  required: false,
  ...extra,
});

const show = (p: FieldRendererProps) => {
  render(
    <>
      <label htmlFor="id-f">Avatar</label>
      <FileRenderer {...p} />
    </>,
  );
  return screen.getByLabelText('Avatar') as HTMLInputElement;
};

/**
 * jsdom has no DataTransfer, so a file list is faked the way a browser behaves:
 * `files` reads the current choice, and setting `value` to '' clears it.
 */
const choose = (input: HTMLInputElement, files: File[]) => {
  let current = files;
  Object.defineProperty(input, 'files', {
    configurable: true,
    get: () => current,
  });
  Object.defineProperty(input, 'value', {
    configurable: true,
    get: () => (current.length > 0 ? `C:\\fakepath\\${current[0]?.name}` : ''),
    set: (next: string) => {
      if (next === '') current = [];
    },
  });
  fireEvent.change(input);
};

describe('FileRenderer', () => {
  it('is a file input with the field name, accept and required wiring', () => {
    const input = show(
      props(
        { props: { accept: 'image/*' } },
        { required: true, invalid: true, describedBy: 'id-f-error' },
      ),
    );
    expect(input.type).toBe('file');
    expect(input.name).toBe('avatar');
    expect(input.accept).toBe('image/*');
    expect(input.multiple).toBe(false);
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('id-f-error');
  });

  it('emits the chosen File for a single file field', () => {
    const p = props();
    choose(show(p), [png]);
    expect(p.onChange).toHaveBeenLastCalledWith(png);
  });

  it('emits undefined when the choice is cleared', () => {
    const p = props();
    const input = show(p);
    choose(input, [png]);
    choose(input, []);
    expect(p.onChange).toHaveBeenLastCalledWith(undefined);
  });

  it('emits a list of files for a multiple field, and an empty list when cleared', () => {
    const p = props({ props: { multiple: true } });
    const input = show(p);
    expect(input.multiple).toBe(true);
    choose(input, [png, jpg]);
    expect(p.onChange).toHaveBeenLastCalledWith([png, jpg]);
    choose(input, []);
    expect(p.onChange).toHaveBeenLastCalledWith([]);
  });

  it('empties the input when the form value is reset to nothing', () => {
    const p = props();
    const view = render(
      <>
        <label htmlFor="id-f">Avatar</label>
        <FileRenderer {...p} value={png} />
      </>,
    );
    const input = screen.getByLabelText('Avatar') as HTMLInputElement;
    choose(input, [png]);
    expect(input.files?.length).toBe(1);
    view.rerender(
      <>
        <label htmlFor="id-f">Avatar</label>
        <FileRenderer {...p} value={undefined} />
      </>,
    );
    expect(input.files?.length).toBe(0);
  });

  it('keeps the chosen file when the value is unchanged', () => {
    const p = props();
    const view = render(
      <>
        <label htmlFor="id-f">Avatar</label>
        <FileRenderer {...p} value={png} />
      </>,
    );
    const input = screen.getByLabelText('Avatar') as HTMLInputElement;
    choose(input, [png]);
    view.rerender(
      <>
        <label htmlFor="id-f">Avatar</label>
        <FileRenderer {...p} value={png} />
      </>,
    );
    expect(input.files?.length).toBe(1);
  });

  it('calls onBlur and is disabled when told', () => {
    const p = props({}, { disabled: true });
    const input = show(p);
    expect(input.disabled).toBe(true);
    fireEvent.blur(input);
    expect(p.onBlur).toHaveBeenCalled();
  });

  it('attaches focusRef to the input', () => {
    const focusRef = { current: null as HTMLElement | null };
    const input = show(props({}, { focusRef }));
    expect(focusRef.current).toBe(input);
  });
});
