'use client';

import type { Ref } from 'react';
import { Button } from '@synapcity/frontend-ui/core/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@synapcity/frontend-ui/core/select';

import type { FieldRendererProps } from '../../types';
import { ComboboxRenderer } from '../combobox-renderer';

/**
 * A select field emitting the chosen option's value; nothing chosen is
 * `undefined`. `searchable` swaps in a filter input (and can window a long
 * list); `clearable` offers a Clear control once something is chosen.
 */
export function SelectRenderer(props: FieldRendererProps) {
  if (props.field.type === 'select' && props.field.props?.searchable === true) {
    return <ComboboxRenderer {...props} />;
  }
  return <PlainSelect {...props} />;
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
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
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
