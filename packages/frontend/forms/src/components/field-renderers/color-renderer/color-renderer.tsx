'use client';

import type { Ref } from 'react';
import { Button } from '@synapcity/frontend-ui/core/button';
import { Input } from '@synapcity/frontend-ui/core/input';

import type { FieldRendererProps } from '../../../types';

const HEX = /^#[0-9a-f]{6}$/i;
/* Not a styling colour: the value HTML gives an empty colour input (the
   "default color" of the colour state). Shown only while nothing is chosen,
   and never posted, because the hidden input carries the real value. */
const NATIVE_EMPTY_COLOUR = '#000000';

/**
 * A colour field. A native colour input cannot show "nothing chosen" (it
 * always reports a colour), so the chosen value is spelled out beside it,
 * "None chosen" is said while it is empty, the posted value comes from a
 * hidden input that stays empty until a colour is picked, and an optional
 * field offers Clear.
 */
export function ColorRenderer({
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
  if (field.type !== 'color') {
    throw new Error(
      `ColorRenderer cannot render a field of type "${field.type}"`,
    );
  }
  const chosen = typeof value === 'string' && HEX.test(value) ? value : '';
  const valueId = `${id}-value`;

  return (
    <div className="flex items-center gap-2">
      <Input
        ref={focusRef as Ref<HTMLInputElement>}
        id={id}
        type="color"
        className="w-16"
        value={chosen === '' ? NATIVE_EMPTY_COLOUR : chosen}
        data-empty={chosen === '' || undefined}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={[valueId, describedBy].filter(Boolean).join(' ')}
        autoComplete={field.props?.autoComplete}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value.toLowerCase())}
      />
      <span id={valueId} className="text-xs text-muted-foreground">
        {chosen === '' ? 'None chosen' : chosen.toUpperCase()}
      </span>
      {!required && chosen !== '' ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          aria-label={`Clear ${field.label}`}
          onClick={() => onChange('')}
        >
          Clear
        </Button>
      ) : null}
      <input type="hidden" name={field.name} value={chosen} />
    </div>
  );
}
