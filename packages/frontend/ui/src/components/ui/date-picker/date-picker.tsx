'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import type { DateRange, Matcher } from 'react-day-picker';

import { useDateTimeFormatting } from '@synapcity/frontend-preferences';
import { Button } from '@synapcity/frontend-ui/core/button';
import { formatCalendarDay } from '@synapcity/frontend-ui/lib/calendar-utils';
import { Calendar } from '@synapcity/frontend-ui/core/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@synapcity/frontend-ui/core/popover';

/** How a date is written into a hidden input for a plain form post. */
const toFormValue = (date: Date | undefined) =>
  date ? format(date, 'yyyy-MM-dd') : '';

/**
 * The trigger's default text, in the person's date order: "October 24, 2026"
 * or "24 October 2026" for one date, "Oct 24, 2026" for each end of a range.
 */
function useDefaultFormat(month: 'short' | 'long') {
  const formatting = useDateTimeFormatting();
  return React.useCallback(
    (date: Date) =>
      formatCalendarDay(date, formatting, {
        weekday: false,
        year: true,
        month,
      }),
    [formatting, month],
  );
}

/** Days outside `min` and `max` cannot be chosen. */
function outside(min?: Date, max?: Date, step?: number): Matcher[] {
  const matchers: Matcher[] = [];
  if (min) matchers.push({ before: min });
  if (max) matchers.push({ after: max });
  if (step !== undefined && Number.isFinite(step) && step > 0) {
    const base = min ?? new Date(1970, 0, 1);
    const dayNumber = (date: Date) =>
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) /
      (24 * 60 * 60 * 1000);
    const baseDay = dayNumber(base);
    matchers.push((date) => (dayNumber(date) - baseDay) % step !== 0);
  }
  return matchers;
}

/**
 * State that is controlled when `value` is passed (even as `undefined`) and
 * kept here otherwise, so the picker works both inside a form library and on
 * its own.
 */
function useControllable<T>(
  controlled: boolean,
  value: T,
  defaultValue: T,
  onChange?: (next: T) => void,
): [T, (next: T) => void] {
  const [own, setOwn] = React.useState(defaultValue);
  const current = controlled ? value : own;
  const set = (next: T) => {
    if (!controlled) setOwn(next);
    onChange?.(next);
  };
  return [current, set];
}

interface PickerTriggerProps {
  /** On the trigger, so a label's `htmlFor` names it. */
  readonly id?: string;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  /**
   * Accepted so a form can pass it through, but not put on the trigger: a
   * button cannot be `aria-required`, and a hidden input cannot be `required`.
   * The form's own validation owns the rule.
   */
  readonly required?: boolean;
  /** Earliest and latest day that can be chosen. */
  readonly min?: Date;
  readonly max?: Date;
  /** Allowed interval in days, based on `min` or 1970-01-01. */
  readonly step?: number;
  readonly className?: string;
  readonly ref?: React.Ref<HTMLButtonElement>;
  readonly onBlur?: React.FocusEventHandler<HTMLButtonElement>;
  readonly 'aria-invalid'?: boolean;
  readonly 'aria-describedby'?: string;
  readonly 'aria-labelledby'?: string;
}

export interface DatePickerProps extends PickerTriggerProps {
  /** Writes a hidden `yyyy-MM-dd` input under this name. */
  readonly name?: string;
  readonly value?: Date;
  readonly defaultValue?: Date;
  readonly onValueChange?: (date: Date | undefined) => void;
  /** The trigger's text for a chosen date. Defaults to the person's date order with a full month. */
  readonly formatValue?: (date: Date) => string;
}

/**
 * A button that opens a calendar for one date. It renders no label: the form
 * around it owns that, and points at the trigger with `id`.
 */
export function DatePicker({
  id,
  name,
  placeholder = 'Pick a date',
  disabled,
  required: _required,
  min,
  max,
  step,
  formatValue,
  className,
  ref,
  onBlur,
  onValueChange,
  defaultValue,
  ...rest
}: DatePickerProps) {
  const controlled = Object.prototype.hasOwnProperty.call(rest, 'value');
  const { value, ...aria } = rest;
  const [date, setDate] = useControllable(
    controlled,
    value,
    defaultValue,
    onValueChange,
  );
  const [open, setOpen] = React.useState(false);
  const defaultFormat = useDefaultFormat('long');
  const writeDate = formatValue ?? defaultFormat;

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              ref={ref}
              onBlur={onBlur}
              id={id}
              variant="outline"
              disabled={disabled}
              className={className}
              {...aria}
            >
              <CalendarIcon data-icon="inline-start" />
              {date ? writeDate(date) : <span>{placeholder}</span>}
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            defaultMonth={date ?? min}
            disabled={outside(min, max, step)}
            autoFocus
            onSelect={(next) => {
              setDate(next);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {name ? (
        <input type="hidden" name={name} value={toFormValue(date)} />
      ) : null}
    </>
  );
}

export interface DateRangePickerProps extends PickerTriggerProps {
  /** Hidden `yyyy-MM-dd` inputs for each end, for a plain form post. */
  readonly fromName?: string;
  readonly toName?: string;
  readonly value?: DateRange;
  readonly defaultValue?: DateRange;
  readonly onValueChange?: (range: DateRange | undefined) => void;
  readonly numberOfMonths?: number;
  /** The trigger's text for one end. Defaults to the person's date order with a short month. */
  readonly formatValue?: (date: Date) => string;
}

/** A button that opens a calendar for a range of dates. */
export function DateRangePicker({
  id,
  fromName,
  toName,
  placeholder = 'Pick a date range',
  disabled,
  required: _required,
  min,
  max,
  step,
  numberOfMonths = 2,
  formatValue,
  className,
  ref,
  onBlur,
  onValueChange,
  defaultValue,
  ...rest
}: DateRangePickerProps) {
  const controlled = Object.prototype.hasOwnProperty.call(rest, 'value');
  const { value, ...aria } = rest;
  const [range, setRange] = useControllable(
    controlled,
    value,
    defaultValue,
    onValueChange,
  );

  const defaultFormat = useDefaultFormat('short');
  const writeDate = formatValue ?? defaultFormat;
  const label = range?.from
    ? range.to
      ? `${writeDate(range.from)} – ${writeDate(range.to)}`
      : writeDate(range.from)
    : undefined;

  return (
    <>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              ref={ref}
              onBlur={onBlur}
              id={id}
              variant="outline"
              disabled={disabled}
              className={className}
              {...aria}
            >
              <CalendarIcon data-icon="inline-start" />
              {label ?? <span>{placeholder}</span>}
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={range}
            defaultMonth={range?.from ?? min}
            disabled={outside(min, max, step)}
            numberOfMonths={numberOfMonths}
            autoFocus
            onSelect={setRange}
          />
        </PopoverContent>
      </Popover>
      {fromName ? (
        <input type="hidden" name={fromName} value={toFormValue(range?.from)} />
      ) : null}
      {toName ? (
        <input type="hidden" name={toName} value={toFormValue(range?.to)} />
      ) : null}
    </>
  );
}
