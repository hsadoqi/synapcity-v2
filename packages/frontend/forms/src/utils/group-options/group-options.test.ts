import { describe, expect, it } from 'vitest';

import { groupOptions } from './group-options';

const option = (value: string, group?: string) => ({
  value,
  label: value.toUpperCase(),
  ...(group === undefined ? {} : { group }),
});

describe('groupOptions', () => {
  it('leaves ungrouped options exactly as declared', () => {
    const options = [option('a'), option('b'), option('c')];
    const result = groupOptions(options);
    expect(result.ordered).toEqual(options);
    expect(result.grouped).toBe(false);
  });

  it('gathers each group together, groups in order of first appearance', () => {
    const result = groupOptions([
      option('a', 'Fruit'),
      option('b', 'Veg'),
      option('c', 'Fruit'),
      option('d', 'Veg'),
    ]);
    expect(result.ordered.map((o) => o.value)).toEqual(['a', 'c', 'b', 'd']);
    expect(result.grouped).toBe(true);
  });

  it('keeps ungrouped options as one run where the first appeared', () => {
    const result = groupOptions([
      option('x'),
      option('a', 'Fruit'),
      option('y'),
      option('b', 'Fruit'),
    ]);
    expect(result.ordered.map((o) => o.value)).toEqual(['x', 'y', 'a', 'b']);
  });

  it("answers a value's group, or undefined", () => {
    const result = groupOptions([option('a', 'Fruit'), option('x')]);
    expect(result.groupOf('a')).toBe('Fruit');
    expect(result.groupOf('x')).toBeUndefined();
    expect(result.groupOf('nope')).toBeUndefined();
  });

  it('does not confuse a group literally named like the ungrouped key', () => {
    const result = groupOptions([option('a', ''), option('x')]);
    expect(result.ordered.map((o) => o.value)).toEqual(['a', 'x']);
    expect(result.groupOf('a')).toBe('');
  });

  it('handles no options', () => {
    expect(groupOptions([])).toMatchObject({ ordered: [], grouped: false });
  });
});
