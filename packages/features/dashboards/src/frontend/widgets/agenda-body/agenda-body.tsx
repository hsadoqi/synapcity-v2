'use client';

import {
  eventsOnDay,
  type PrototypeRecords,
} from '@synapcity/domain-prototypes';
import {
  DayAgenda,
  type TimeSlot,
} from '@synapcity/frontend-ui/blocks/day-agenda';
import { toCalendarDate } from '@synapcity/frontend-ui/lib/calendar-date';
import { useState } from 'react';

import { WidgetEmpty } from '../widget-states';

const timeFormat = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});

/**
 * One day's events, through the host-agnostic DayAgenda: no card or toolbar
 * of its own, because the widget shell draws both. The day shown is screen
 * state, not saved: it starts at `now`, or the owner holds it by passing `day`
 * and `onDayChange` (so, for one, an Add event dialog can default to it).
 */
export function AgendaBody({
  events,
  now,
  day: controlledDay,
  onDayChange,
}: {
  events: PrototypeRecords['event'];
  now: number;
  /** The day shown, `yyyy-MM-dd`. Omit it and the body keeps the day itself. */
  day?: string;
  onDayChange?: (day: string) => void;
}) {
  const [ownDay, setOwnDay] = useState(() => toCalendarDate(new Date(now)));
  const day = controlledDay ?? ownDay;
  const setDay = (next: string) => {
    setOwnDay(next);
    onDayChange?.(next);
  };
  const slots: TimeSlot[] = eventsOnDay(events, day).map((event) => ({
    id: event.id,
    start: timeFormat.format(Date.parse(event.startsAt)),
    label: event.name,
    // Events carry no kind yet, so every one reads as a meeting.
    tone: 'meeting',
  }));
  return (
    <DayAgenda
      date={day}
      slots={slots}
      onDateChange={setDay}
      frame={false}
      toolbar={false}
      empty={<WidgetEmpty>Nothing scheduled.</WidgetEmpty>}
    />
  );
}
