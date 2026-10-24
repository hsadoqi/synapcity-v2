'use client';

import { useMemo, type Ref } from 'react';
import { Button } from '@synapcity/frontend-ui/core/button';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxValue,
  ComboboxVirtualList,
  useComboboxAnchor,
  useComboboxVirtualizer,
} from '@synapcity/frontend-ui/core/combobox';

import type {
  FieldOption,
  FieldRendererProps,
  VirtualizeOption,
} from '../../types';
import { groupOptions } from '../../utils/group-options';

/** Whether an option list of `count` rows should be windowed. */
export function shouldVirtualize(
  option: VirtualizeOption | undefined,
  count: number,
): boolean {
  if (option === undefined || option === false) return false;
  if (option === true) return true;
  return count > option.threshold;
}

function useOptions(options: readonly FieldOption[]) {
  return useMemo(() => {
    const { ordered, groupOf, grouped } = groupOptions(options);
    const labels = new Map(
      ordered.map((option) => [option.value, option.label]),
    );
    return {
      // Gathered by group, so the keyboard order is the order drawn.
      values: ordered.map((option) => option.value),
      has: (value: string) => labels.has(value),
      label: (value: string) => labels.get(value) ?? value,
      groupBy: grouped ? groupOf : undefined,
    };
  }, [options]);
}

const NO_MATCHES = 'No matches.';

/**
 * A select with a filter input: a searchable `select` (one value or
 * `undefined`) or a `multiselect` (a list of values, removable chips). Option
 * lists can be windowed with `virtualize`. The value is posted under the
 * field's name, once per chosen value.
 */
export function ComboboxRenderer(props: FieldRendererProps) {
  const { field } = props;
  if (field.type === 'multiselect') return <MultiSelect {...props} />;
  if (field.type === 'select') return <SearchableSelect {...props} />;
  throw new Error(
    `ComboboxRenderer cannot render a field of type "${field.type}"`,
  );
}

function SearchableSelect({
  field,
  id,
  value,
  onChange,
  onBlur,
  invalid,
  disabled,
  required,
  describedBy,
  focusRef,
}: FieldRendererProps) {
  const config = field.type === 'select' ? field : undefined;
  const options = useOptions(config?.options ?? []);
  const virtualizer = useComboboxVirtualizer();
  const windowed = shouldVirtualize(
    config?.props?.virtualize,
    options.values.length,
  );
  const chosen = typeof value === 'string' && options.has(value) ? value : null;

  return (
    <>
      <Combobox
        items={options.values}
        value={chosen}
        onValueChange={(next: string | null) => onChange(next ?? undefined)}
        itemToStringLabel={options.label}
        disabled={disabled}
        virtualized={windowed}
        onItemHighlighted={virtualizer.onItemHighlighted}
        autoHighlight
      >
        <ComboboxInput
          ref={focusRef as Ref<HTMLInputElement>}
          id={id}
          className="w-full"
          placeholder={config?.props?.placeholder}
          disabled={disabled}
          showClear={config?.props?.clearable === true && chosen !== null}
          aria-invalid={invalid || undefined}
          aria-required={required || undefined}
          aria-describedby={describedBy}
          onBlur={onBlur}
        />
        <ComboboxContent>
          <ComboboxEmpty>{NO_MATCHES}</ComboboxEmpty>
          <ComboboxVirtualList
            virtualizer={virtualizer}
            enabled={windowed}
            groupBy={options.groupBy}
            aria-labelledby={`${id}-label`}
          >
            {(item: string, index: number) => (
              <ComboboxItem key={item} value={item} index={index}>
                {options.label(item)}
              </ComboboxItem>
            )}
          </ComboboxVirtualList>
        </ComboboxContent>
      </Combobox>
      <input type="hidden" name={field.name} value={chosen ?? ''} />
    </>
  );
}

function MultiSelect({
  field,
  id,
  value,
  onChange,
  onBlur,
  invalid,
  disabled,
  required,
  describedBy,
  focusRef,
}: FieldRendererProps) {
  const config = field.type === 'multiselect' ? field : undefined;
  const options = useOptions(config?.options ?? []);
  const anchor = useComboboxAnchor();
  const virtualizer = useComboboxVirtualizer();
  const windowed = shouldVirtualize(
    config?.props?.virtualize,
    options.values.length,
  );
  const chosen = Array.isArray(value)
    ? value.filter(
        (item): item is string => typeof item === 'string' && options.has(item),
      )
    : [];
  const max = config?.props?.maxSelected;
  const full = max !== undefined && chosen.length >= max;

  return (
    <div className="flex items-start gap-1">
      <Combobox
        multiple
        items={options.values}
        value={chosen}
        onValueChange={(next: string[]) => onChange(next)}
        itemToStringLabel={options.label}
        disabled={disabled}
        virtualized={windowed}
        onItemHighlighted={virtualizer.onItemHighlighted}
        autoHighlight
      >
        <ComboboxChips ref={anchor} className="flex-1">
          <ComboboxValue>
            {(selected: string[]) =>
              selected.map((item) => (
                <ComboboxChip
                  key={item}
                  removeLabel={`Remove ${options.label(item)}`}
                >
                  {options.label(item)}
                </ComboboxChip>
              ))
            }
          </ComboboxValue>
          <ComboboxChipsInput
            ref={focusRef as Ref<HTMLInputElement>}
            id={id}
            placeholder={
              chosen.length === 0 ? config?.props?.placeholder : undefined
            }
            disabled={disabled}
            aria-invalid={invalid || undefined}
            aria-required={required || undefined}
            aria-describedby={describedBy}
            onBlur={onBlur}
          />
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>{NO_MATCHES}</ComboboxEmpty>
          <ComboboxVirtualList
            virtualizer={virtualizer}
            enabled={windowed}
            groupBy={options.groupBy}
            aria-labelledby={`${id}-label`}
          >
            {(item: string, index: number) => (
              <ComboboxItem
                key={item}
                value={item}
                index={index}
                disabled={full && !chosen.includes(item)}
              >
                {options.label(item)}
              </ComboboxItem>
            )}
          </ComboboxVirtualList>
        </ComboboxContent>
      </Combobox>
      {config?.props?.clearable === true && chosen.length > 0 ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          aria-label={`Clear ${field.label}`}
          onClick={() => onChange([])}
        >
          Clear
        </Button>
      ) : null}
      {chosen.map((item) => (
        <input key={item} type="hidden" name={field.name} value={item} />
      ))}
    </div>
  );
}
