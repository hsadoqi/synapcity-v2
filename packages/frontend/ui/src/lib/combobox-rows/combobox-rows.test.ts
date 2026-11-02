import { describe, expect, it } from 'vitest';

import { buildComboboxRows } from './combobox-rows';

const groupOf = (item: string) =>
  item.startsWith('f') ? 'Fruit' : item.startsWith('v') ? 'Veg' : undefined;

describe('buildComboboxRows', () => {
  it('has a row per option and no headings without groupBy', () => {
    const { rows, rowOfItem } = buildComboboxRows(['a', 'b']);
    expect(rows.map((row) => row.kind)).toEqual(['item', 'item']);
    expect(rowOfItem).toEqual([0, 1]);
  });

  it('puts one heading before each run of a group and maps options to their rows', () => {
    const { rows, rowOfItem } = buildComboboxRows(
      ['f1', 'f2', 'v1', 'x'],
      groupOf,
    );
    expect(
      rows.map((row) => (row.kind === 'label' ? `#${row.label}` : row.item)),
    ).toEqual(['#Fruit', 'f1', 'f2', '#Veg', 'v1', 'x']);
    expect(rowOfItem).toEqual([1, 2, 4, 5]);
  });

  it("keeps each option's own index, headings not counted", () => {
    const { rows } = buildComboboxRows(['f1', 'v1'], groupOf);
    const indexes = rows.flatMap((row) =>
      row.kind === 'item' ? [row.index] : [],
    );
    expect(indexes).toEqual([0, 1]);
  });

  it('gives every row a unique key', () => {
    const { rows } = buildComboboxRows(['f1', 'v1', 'f2'], groupOf);
    expect(new Set(rows.map((row) => row.key)).size).toBe(rows.length);
  });

  it('is empty for no options', () => {
    expect(buildComboboxRows([], groupOf)).toEqual({ rows: [], rowOfItem: [] });
  });
});
