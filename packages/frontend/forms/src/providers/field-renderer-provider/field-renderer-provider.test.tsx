import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { FieldConfig } from '../../types';
import {
  FieldRendererProvider,
  useFieldRendererRegistry,
} from './field-renderer-provider';
import type { FieldRenderer, FieldRendererProps } from '../../types';
import { FieldRendererRegistry } from '../field-renderer-registry/field-renderer-registry';

const field: FieldConfig = { type: 'text', name: 'a', label: 'A' };
const props: FieldRendererProps = {
  field,
  id: 'id-a',
  value: 'hello',
  onChange: () => {},
  onBlur: () => {},
  invalid: false,
  disabled: false,
  required: false,
};

const Swatch: FieldRenderer = ({ value, id }) => (
  <output id={id}>{String(value)}</output>
);

/** Reads the registry from context and reports what it holds. */
function Probe({ type }: { type: string }) {
  const registry = useFieldRendererRegistry();
  if (!registry.has(type)) return <p>no {type}</p>;
  return createElement(registry.resolve(type), props);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('FieldRendererProvider', () => {
  it('supplies the built-in renderers when no registry is given', () => {
    render(
      <FieldRendererProvider>
        <Probe type="text" />
      </FieldRendererProvider>,
    );
    expect(screen.getByRole('textbox')).toBeTruthy();
  });

  it('starts from an empty registry when one is passed', () => {
    render(
      <FieldRendererProvider registry={new FieldRendererRegistry()}>
        <Probe type="text" />
      </FieldRendererProvider>,
    );
    expect(screen.getByText('no text')).toBeTruthy();
  });

  it('renders a registered renderer with the props it is given', () => {
    const registry = new FieldRendererRegistry().register(
      'custom:swatch',
      Swatch,
    );
    render(
      <FieldRendererProvider registry={registry}>
        <Probe type="custom:swatch" />
      </FieldRendererProvider>,
    );
    expect(screen.getByRole('status').textContent).toBe('hello');
  });

  it('extend adds a renderer for one provider and leaves the base registry unchanged', () => {
    const base = new FieldRendererRegistry();
    render(
      <FieldRendererProvider
        registry={base}
        extend={(registry) => registry.register('custom:swatch', Swatch)}
      >
        <Probe type="custom:swatch" />
      </FieldRendererProvider>,
    );
    expect(screen.getByRole('status').textContent).toBe('hello');
    expect(base.has('custom:swatch')).toBe(false);
  });

  it('does not see a registration made on the passed registry after it mounted', () => {
    const base = new FieldRendererRegistry();
    const { rerender } = render(
      <FieldRendererProvider registry={base}>
        <Probe type="custom:swatch" />
      </FieldRendererProvider>,
    );
    base.register('custom:swatch', Swatch);
    rerender(
      <FieldRendererProvider registry={base}>
        <Probe type="custom:swatch" />
      </FieldRendererProvider>,
    );
    expect(screen.getByText('no custom:swatch')).toBeTruthy();
  });

  it('useFieldRendererRegistry throws outside a provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe type="text" />)).toThrow(
      'FieldRendererProvider',
    );
  });
});
