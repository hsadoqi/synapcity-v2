import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { FieldConfig } from '../../types';
import type { FieldRendererProps } from '../../types';
import { TextRenderer } from './text-renderer';

const base = (
  field: FieldConfig,
  extra: Partial<FieldRendererProps> = {},
): FieldRendererProps => ({
  field,
  id: 'id-a',
  value: '',
  onChange: vi.fn(),
  onBlur: vi.fn(),
  invalid: false,
  disabled: false,
  required: false,
  ...extra,
});

const label = (id: string) => <label htmlFor={id}>A</label>;

describe('TextRenderer', () => {
  it('wires the id, aria-invalid, aria-describedby and required', () => {
    render(
      <>
        {label('id-a')}
        <TextRenderer
          {...base(
            { type: 'text', name: 'a', label: 'A' },
            { invalid: true, required: true, describedBy: 'id-a-error' },
          )}
        />
      </>,
    );
    const input = screen.getByLabelText('A');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('id-a-error');
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.getAttribute('name')).toBe('a');
  });

  it('emits the typed string and calls onBlur', () => {
    const props = base({
      type: 'email',
      name: 'a',
      label: 'A',
      props: { autoComplete: 'email' },
    });
    render(
      <>
        {label('id-a')}
        <TextRenderer {...props} />
      </>,
    );
    const input = screen.getByLabelText('A');
    expect(input.getAttribute('type')).toBe('email');
    expect(input.getAttribute('autocomplete')).toBe('email');
    fireEvent.change(input, { target: { value: 'ada@example.com' } });
    fireEvent.blur(input);
    expect(props.onChange).toHaveBeenCalledWith('ada@example.com');
    expect(props.onBlur).toHaveBeenCalled();
  });

  it('shows a non-string value as empty, not as text', () => {
    render(
      <>
        {label('id-a')}
        <TextRenderer
          {...base(
            { type: 'text', name: 'a', label: 'A' },
            { value: undefined },
          )}
        />
      </>,
    );
    expect((screen.getByLabelText('A') as HTMLInputElement).value).toBe('');
  });

  it('renders a textarea for textarea fields', () => {
    render(
      <>
        {label('id-a')}
        <TextRenderer {...base({ type: 'textarea', name: 'a', label: 'A' })} />
      </>,
    );
    expect(screen.getByLabelText('A').tagName).toBe('TEXTAREA');
  });

  it('renders a password input with its reveal control and the declared autoComplete', () => {
    render(
      <>
        {label('id-a')}
        <TextRenderer
          {...base({
            type: 'password',
            name: 'a',
            label: 'A',
            props: { autoComplete: 'new-password' },
          })}
        />
      </>,
    );
    const input = screen.getByLabelText('A');
    expect(input.getAttribute('type')).toBe('password');
    expect(input.getAttribute('autocomplete')).toBe('new-password');
    expect(screen.getByRole('button', { name: 'Show password' })).toBeTruthy();
  });

  it('attaches focusRef to the control', () => {
    const focusRef = { current: null as HTMLElement | null };
    render(
      <>
        {label('id-a')}
        <TextRenderer
          {...base({ type: 'text', name: 'a', label: 'A' }, { focusRef })}
        />
      </>,
    );
    expect(focusRef.current).toBe(screen.getByLabelText('A'));
  });

  it('is disabled when told', () => {
    render(
      <>
        {label('id-a')}
        <TextRenderer
          {...base({ type: 'text', name: 'a', label: 'A' }, { disabled: true })}
        />
      </>,
    );
    expect((screen.getByLabelText('A') as HTMLInputElement).disabled).toBe(
      true,
    );
  });
});
