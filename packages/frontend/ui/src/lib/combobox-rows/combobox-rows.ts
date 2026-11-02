/** One row of an option list: an option, or the heading above a group of them. */
export type ComboboxRow<Item> =
  | { readonly kind: 'label'; readonly key: string; readonly label: string }
  | {
      readonly kind: 'item';
      readonly key: string;
      readonly item: Item;
      /** The option's position among the options, headings not counted. */
      readonly index: number;
    };

export interface ComboboxRows<Item> {
  readonly rows: readonly ComboboxRow<Item>[];
  /** For each option index, the row it is drawn in. */
  readonly rowOfItem: readonly number[];
}

/**
 * Lays options out as rows, putting a heading row before the first option of
 * each run that shares a group. Options must already be gathered by group, so a
 * run is a whole group. Without `groupBy` there are no headings.
 */
export function buildComboboxRows<Item>(
  items: readonly Item[],
  groupBy?: (item: Item) => string | undefined,
): ComboboxRows<Item> {
  const rows: ComboboxRow<Item>[] = [];
  const rowOfItem: number[] = [];
  let previous: string | undefined;
  items.forEach((item, index) => {
    const group = groupBy?.(item);
    if (group !== undefined && group !== previous) {
      rows.push({ kind: 'label', key: `label:${rows.length}`, label: group });
    }
    previous = group;
    rowOfItem.push(rows.length);
    rows.push({ kind: 'item', key: `item:${index}`, item, index });
  });
  return { rows, rowOfItem };
}
