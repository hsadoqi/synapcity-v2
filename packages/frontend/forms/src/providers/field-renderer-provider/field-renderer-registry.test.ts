import { describe, expect, it } from 'vitest';

import {
  FieldRendererRegistry,
  UnknownFieldTypeError,
  type FieldRenderer,
} from './field-renderer-registry';

const renderer = (): FieldRenderer => () => null;

describe('FieldRendererRegistry', () => {
  it('resolve returns what register stored', () => {
    const swatch = renderer();
    const registry = new FieldRendererRegistry().register(
      'custom:swatch',
      swatch,
    );
    expect(registry.resolve('custom:swatch')).toBe(swatch);
  });

  it('register returns the registry so calls chain, and replaces an earlier renderer', () => {
    const first = renderer();
    const second = renderer();
    const registry = new FieldRendererRegistry();
    expect(registry.register('text', first)).toBe(registry);
    registry.register('text', second);
    expect(registry.resolve('text')).toBe(second);
  });

  it('has reports whether a type is registered', () => {
    const registry = new FieldRendererRegistry().register('text', renderer());
    expect(registry.has('text')).toBe(true);
    expect(registry.has('number')).toBe(false);
  });

  it('resolve throws UnknownFieldTypeError naming the type', () => {
    const registry = new FieldRendererRegistry();
    const run = () => registry.resolve('custom:swatch');
    expect(run).toThrow(UnknownFieldTypeError);
    expect(run).toThrow('custom:swatch');
    try {
      run();
    } catch (error) {
      expect((error as UnknownFieldTypeError).type).toBe('custom:swatch');
    }
  });

  it('clone isolates later registrations in either direction', () => {
    const original = new FieldRendererRegistry().register('text', renderer());
    const copy = original.clone();
    expect(copy.has('text')).toBe(true);

    copy.register('number', renderer());
    original.register('select', renderer());

    expect(original.has('number')).toBe(false);
    expect(copy.has('select')).toBe(false);
  });
});
