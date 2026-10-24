'use client';

import type { Ref } from 'react';
import { Button } from '@synapcity/frontend-ui/core/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@synapcity/frontend-ui/core/select';

import type { FieldOption, FieldRendererProps } from '../../types';
import { groupOptions } from '../../utils/group-options';
import { ComboboxRenderer, shouldVirtualize } from '../combobox-renderer';

/**
 * A select field emitting the chosen option's value; nothing chosen is
 * `undefined`. `searchable` swaps in a filter input; so does `virtualize` when
 * it applies, because the plain select cannot be windowed and a long list needs
 * filtering anyway. `clearable` offers a Clear control once something is chosen.
 */
export function SelectRenderer(props: FieldRendererProps) {
  const { field } = props;
  if (
    field.type === 'select' &&
    (field.props?.searchable === true ||
      shouldVirtualize(field.props?.virtualize, field.options.length))
  ) {
    return <ComboboxRenderer {...props} />;
  }
  return <PlainSelect {...props} />;
}

/** The plain select's options: under a heading each when they name groups. */
function PlainOptions({ options }: { options: readonly FieldOption[] }) {
  const { ordered, grouped } = groupOptions(options);
  if (!grouped) {
    return ordered.map((option) => (
      <SelectItem key={option.value} value={option.value}>
        {option.label}
      </SelectItem>
    ));
  }
  const runs: { label: string | undefined; options: FieldOption[] }[] = [];
  for (const option of ordered) {
    const last = runs[runs.length - 1];
    if (last !== undefined && last.label === option.group) {
      last.options.push(option);
    } else {
      runs.push({ label: option.group, options: [option] });
    }
  }
  return runs.map((run, index) => (
    <SelectGroup key={`${index}:${run.label ?? ''}`}>
      {run.label !== undefined ? <SelectLabel>{run.label}</SelectLabel> : null}
      {run.options.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </SelectGroup>
  ));
}

function PlainSelect({
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
  const options = field.type === 'select' ? field.options : [];
  const placeholder =
    field.type === 'select' ? field.props?.placeholder : undefined;
  const clearable = field.type === 'select' && field.props?.clearable === true;
  const chosen =
    typeof value === 'string' &&
    options.some((option) => option.value === value)
      ? value
      : null;
  return (
    <div className="flex items-center gap-1">
      <Select
        name={field.name}
        items={options}
        value={chosen}
        onValueChange={(next) => onChange(next ?? undefined)}
        disabled={disabled}
        required={required}
      >
        <SelectTrigger
          ref={focusRef as Ref<HTMLButtonElement>}
          id={id}
          className="flex-1"
          onBlur={onBlur}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <PlainOptions options={options} />
        </SelectContent>
      </Select>
      {clearable && chosen !== null ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          aria-label={`Clear ${field.label}`}
          onClick={() => onChange(undefined)}
        >
          Clear
        </Button>
      ) : null}
    </div>
  );
}
