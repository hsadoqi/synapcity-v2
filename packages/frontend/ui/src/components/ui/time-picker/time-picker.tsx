'use client';

import * as React from 'react';
import { ChevronDownIcon } from 'lucide-react';

import { useDateTimeFormatting } from '@synapcity/frontend-preferences';
import { Button } from '@synapcity/frontend-ui/core/button';
import { Calendar } from '@synapcity/frontend-ui/core/calendar';
import {
  Field,
  FieldGroup,
  FieldLabel,
} from '@synapcity/frontend-ui/core/field';
import { Input } from '@synapcity/frontend-ui/core/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@synapcity/frontend-ui/core/popover';
import { formatCalendarDay } from '@synapcity/frontend-ui/lib/calendar-utils';

export function TimePicker() {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const formatting = useDateTimeFormatting();

  return (
    <FieldGroup className="mx-auto max-w-xs flex-row">
      <Field>
        <FieldLabel htmlFor="date-picker-optional">Date</FieldLabel>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                id="date-picker-optional"
                className="w-32 justify-between font-normal"
              >
                {date
                  ? formatCalendarDay(date, formatting, {
                      weekday: false,
                      year: true,
                      month: 'long',
                    })
                  : 'Select date'}
                <ChevronDownIcon data-icon="inline-end" />
              </Button>
            }
          />
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              defaultMonth={date}
              onSelect={(date) => {
                setDate(date);
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </Field>
      <Field className="w-32">
        <FieldLabel htmlFor="time-picker-optional">Time</FieldLabel>
        <Input
          type="time"
          id="time-picker-optional"
          step="1"
          defaultValue="10:30:00"
          className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </Field>
    </FieldGroup>
  );
}
