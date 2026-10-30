'use client';

import { AgendaDate } from '../../day-agenda/agenda-date';
import { IconButton } from '@synapcity/frontend-ui/core/icon-button';
import { Button } from '@synapcity/frontend-ui/core/button';
import { Calendar } from '@synapcity/frontend-ui/core/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@synapcity/frontend-ui/core/popover';
import {
  addCalendarDays,
  parseCalendarDate,
  toCalendarDate,
} from '@synapcity/frontend-ui/lib/calendar-utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export interface AgendaDateNavProps {
  /** Calendar date as `yyyy-MM-dd`. */
  date: string;
  /** Called with the new `yyyy-MM-dd` date. The owner sets `date` and loads that day's slots. */
  onDateChange: (date: string) => void;
  locale?: Intl.LocalesArgument;
  format?: Intl.DateTimeFormatOptions;
}

/**
 * Previous and next day buttons around the date, which opens a calendar to
 * jump to any day. Controlled: it reports the date and the owner sets it,
 * because a new day also means new slots, which only the owner can load.
 * Follows DatePicker's Popover and Calendar composition.
 */
export function AgendaDateNav({
  date,
  onDateChange,
  locale,
  format,
}: AgendaDateNavProps) {
  const [open, setOpen] = useState(false);
  const selected = parseCalendarDate(date) ?? undefined;
  const shift = (days: number) => {
    const next = addCalendarDays(date, days);
    if (next) onDateChange(next);
  };

  return (
    <div className="flex items-center gap-1">
      <IconButton
        size="sm"
        variant="ghost"
        aria-label="Previous day"
        disabled={!selected}
        onClick={() => shift(-1)}
      >
        <ChevronLeft className="size-4" />
      </IconButton>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            // The visible date stays the start of the accessible name (WCAG 2.5.3,
            // label in name); the hint is added for screen readers only.
            <Button variant="ghost" size="sm">
              <AgendaDate date={date} locale={locale} format={format} />
              <span className="sr-only">, choose a date</span>
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            autoFocus
            onSelect={(next) => {
              if (next) onDateChange(toCalendarDate(next));
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      <IconButton
        size="sm"
        variant="ghost"
        aria-label="Next day"
        disabled={!selected}
        onClick={() => shift(1)}
      >
        <ChevronRight className="size-4" />
      </IconButton>
    </div>
  );
}
