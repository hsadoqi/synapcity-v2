'use client';

import * as React from 'react';
import { parseDate } from 'chrono-node';
import { CalendarIcon } from 'lucide-react';

import type { DateTimeFormatting } from '@synapcity/domain-preferences';
import { useDateTimeFormatting } from '@synapcity/frontend-preferences';
import { Calendar } from '@synapcity/frontend-ui/core/calendar';
import { Field, FieldLabel } from '@synapcity/frontend-ui/core/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@synapcity/frontend-ui/core/input-group';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@synapcity/frontend-ui/core/popover';
import { formatCalendarDay } from '@synapcity/frontend-ui/lib/calendar-utils';

function formatDate(date: Date | undefined, formatting: DateTimeFormatting) {
  if (!date) {
    return '';
  }

  return formatCalendarDay(date, formatting, {
    weekday: false,
    year: true,
    month: 'long',
  });
}

export function NLDatePicker() {
  const formatting = useDateTimeFormatting();
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState('In 2 days');
  const [date, setDate] = React.useState<Date | undefined>(
    parseDate(value) || undefined,
  );

  return (
    <Field className="mx-auto max-w-xs">
      <FieldLabel htmlFor="date-optional">Schedule Date</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id="date-optional"
          value={value}
          placeholder="Tomorrow or next week"
          onChange={(e) => {
            setValue(e.target.value);
            const date = parseDate(e.target.value);
            if (date) {
              setDate(date);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setOpen(true);
            }
          }}
        />
        <InputGroupAddon align="inline-end">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
              render={
                <InputGroupButton
                  id="date-picker"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Select date"
                >
                  <CalendarIcon />
                  <span className="sr-only">Select date</span>
                </InputGroupButton>
              }
            />
            <PopoverContent
              className="w-auto overflow-hidden p-0"
              align="end"
              sideOffset={8}
            >
              <Calendar
                mode="single"
                selected={date}
                captionLayout="dropdown"
                defaultMonth={date}
                onSelect={(date) => {
                  setDate(date);
                  setValue(formatDate(date, formatting));
                  setOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </InputGroupAddon>
      </InputGroup>
      <div className="px-1 text-sm text-muted-foreground">
        Your post will be published on{' '}
        <span className="font-medium">{formatDate(date, formatting)}</span>.
      </div>
    </Field>
  );
}
