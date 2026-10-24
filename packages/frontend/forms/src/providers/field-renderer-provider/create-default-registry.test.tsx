import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';

import { createDefaultRegistry } from './create-default-registry';
import {
  FieldRendererProvider,
  useFieldRendererRegistry,
} from './field-renderer-provider';

const TYPES = [
  'text',
  'email',
  'password',
  'textarea',
  'date',
  'date-range',
  'time',
  'datetime-local',
  'month',
  'week',
  'color',
  'file',
  'range',
  'number',
  'select',
  'multiselect',
  'tags',
  'radio',
  'checkbox',
  'switch',
];

describe('createDefaultRegistry', () => {
  it('resolves every built-in type', () => {
    const registry = createDefaultRegistry();
    for (const type of TYPES) expect(registry.has(type)).toBe(true);
  });

  it('returns a new registry each time', () => {
    expect(createDefaultRegistry()).not.toBe(createDefaultRegistry());
  });

  it('a provider with no registry prop resolves the built-in text renderer', () => {
    function Probe() {
      return createElement(useFieldRendererRegistry().resolve('text'), {
        field: { type: 'text', name: 'a', label: 'A' },
        id: 'p',
        value: 'hello',
        onChange: () => {},
        onBlur: () => {},
        invalid: false,
        disabled: false,
        required: false,
      });
    }
    render(
      <FieldRendererProvider>
        <Probe />
      </FieldRendererProvider>,
    );
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe(
      'hello',
    );
  });
});
