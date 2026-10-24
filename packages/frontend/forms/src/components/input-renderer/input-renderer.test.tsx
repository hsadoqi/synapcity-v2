import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { FieldConfig } from '../../types';
import type { FieldRendererProps } from '../../types';
import { InputRenderer } from './input-renderer';

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

describe('InputRenderer', () => {
  it('wires the id, aria-invalid, aria-describedby and required', () => {
    render(
      <>
        {label('id-a')}
        <InputRenderer
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
        <InputRenderer {...props} />
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
        <InputRenderer
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
        <InputRenderer {...base({ type: 'textarea', name: 'a', label: 'A' })} />
      </>,
    );
    expect(screen.getByLabelText('A').tagName).toBe('TEXTAREA');
  });

  it('renders a password input with its reveal control and the declared autoComplete', () => {
    render(
      <>
        {label('id-a')}
        <InputRenderer
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
        <InputRenderer
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
        <InputRenderer
          {...base({ type: 'text', name: 'a', label: 'A' }, { disabled: true })}
        />
      </>,
    );
    expect((screen.getByLabelText('A') as HTMLInputElement).disabled).toBe(
      true,
    );
  });

  it.each([
    [
      'email',
      { inputMode: 'email', autocapitalize: 'none', spellcheck: 'false' },
    ],
    ['url', { inputMode: 'url', autocapitalize: 'none', spellcheck: 'false' }],
    ['tel', { inputMode: 'tel', autocapitalize: null, spellcheck: null }],
    ['search', { inputMode: 'search', autocapitalize: null, spellcheck: null }],
  ] as const)(
    'renders a %s field with the right keyboard and no autocorrect where it would corrupt the value',
    (type, expected) => {
      render(
        <>
          {label('id-a')}
          <InputRenderer {...base({ type, name: 'a', label: 'A' })} />
        </>,
      );
      const input = screen.getByLabelText('A') as HTMLInputElement;
      expect(input.getAttribute('type')).toBe(type);
      expect(input.getAttribute('inputmode')).toBe(expected.inputMode);
      expect(input.getAttribute('autocapitalize')).toBe(
        expected.autocapitalize,
      );
      expect(input.getAttribute('spellcheck')).toBe(expected.spellcheck);
    },
  );

  it('lets a field override the keyboard hint', () => {
    render(
      <>
        {label('id-a')}
        <InputRenderer
          {...base({
            type: 'text',
            name: 'a',
            label: 'A',
            props: { inputMode: 'numeric' },
          })}
        />
      </>,
    );
    expect(screen.getByLabelText('A').getAttribute('inputmode')).toBe(
      'numeric',
    );
  });

  it('never autocapitalises, autocorrects or spellchecks a password', () => {
    render(
      <>
        {label('id-a')}
        <InputRenderer
          {...base({
            type: 'password',
            name: 'a',
            label: 'A',
            props: { autoComplete: 'current-password' },
          })}
        />
      </>,
    );
    const input = screen.getByLabelText('A');
    expect(input.getAttribute('autocapitalize')).toBe('none');
    expect(input.getAttribute('spellcheck')).toBe('false');
  });

  it('keeps the typed password out of the DOM attributes and the reveal control off the tab order trap', () => {
    render(
      <>
        {label('id-a')}
        <InputRenderer
          {...base(
            {
              type: 'password',
              name: 'a',
              label: 'A',
              props: { autoComplete: 'new-password' },
            },
            { value: 'Secret1!' },
          )}
        />
      </>,
    );
    const toggle = screen.getByRole('button', { name: 'Show password' });
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(toggle);
    expect(screen.getByLabelText('A').getAttribute('type')).toBe('text');
    expect((screen.getByLabelText('A') as HTMLInputElement).value).toBe(
      'Secret1!',
    );
  });

  it('applies maxLength to a textarea and an input', () => {
    render(
      <>
        {label('id-a')}
        <InputRenderer
          {...base({
            type: 'textarea',
            name: 'a',
            label: 'A',
            props: { maxLength: 5 },
          })}
        />
      </>,
    );
    expect(screen.getByLabelText('A').getAttribute('maxlength')).toBe('5');
  });

  it('passes minLength and maxLength to inputs, textareas and passwords', () => {
    const cases: FieldConfig[] = [
      {
        type: 'text',
        name: 'a',
        label: 'A',
        props: { minLength: 2, maxLength: 9 },
      },
      {
        type: 'textarea',
        name: 'a',
        label: 'A',
        props: { minLength: 2, maxLength: 9 },
      },
      {
        type: 'password',
        name: 'a',
        label: 'A',
        props: { autoComplete: 'new-password', minLength: 8, maxLength: 64 },
      },
    ];
    const expected = [
      ['2', '9'],
      ['2', '9'],
      ['8', '64'],
    ];
    cases.forEach((field, index) => {
      const { unmount } = render(
        <>
          {label('id-a')}
          <InputRenderer {...base(field)} />
        </>,
      );
      const input = screen.getByLabelText('A');
      expect([
        input.getAttribute('minlength'),
        input.getAttribute('maxlength'),
      ]).toEqual(expected[index]);
      unmount();
    });
  });

  it.each(['time', 'datetime-local', 'month', 'week', 'color'] as const)(
    'renders a %s input that emits the string the browser gives',
    (type) => {
      const props = base({
        type,
        name: 'a',
        label: 'A',
        props: { min: '2026-01-01', max: '2026-12-31' },
      } as FieldConfig);
      render(
        <>
          {label('id-a')}
          <InputRenderer {...props} />
        </>,
      );
      const input = screen.getByLabelText('A') as HTMLInputElement;
      expect(input.type).toBe(type);
      // A value the colour picker returns, not a colour used for styling.
      const value = {
        time: '09:30',
        'datetime-local': '2026-05-04T09:30',
        month: '2026-05',
        week: '2026-W19',
        color: '#336699',
      }[type];
      fireEvent.change(input, { target: { value } });
      expect(props.onChange).toHaveBeenCalledWith(value);
    },
  );

  it('passes min, max and step to native time inputs', () => {
    render(
      <>
        {label('id-a')}
        <InputRenderer
          {...base({
            type: 'time',
            name: 'a',
            label: 'A',
            props: { min: '09:00', max: '17:00', step: 60 },
          })}
        />
      </>,
    );
    const input = screen.getByLabelText('A') as HTMLInputElement;
    expect([input.min, input.max, input.step]).toEqual([
      '09:00',
      '17:00',
      '60',
    ]);
  });

  it('passes pattern to text inputs, so the browser hint and the schema can agree', () => {
    render(
      <>
        {label('id-a')}
        <InputRenderer
          {...base({
            type: 'text',
            name: 'a',
            label: 'A',
            props: { pattern: '[A-Z]{3}' },
          })}
        />
      </>,
    );
    expect(screen.getByLabelText('A').getAttribute('pattern')).toBe('[A-Z]{3}');
  });
});
