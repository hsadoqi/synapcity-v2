'use client';

import { useDateTimeFormatting } from '@synapcity/frontend-preferences';
import { useNow } from '@synapcity/frontend-ui/hooks/use-now';
import {
  blockSurface,
  type BlockSurface,
} from '@synapcity/frontend-ui/lib/block-surface';
import { cn } from '@synapcity/frontend-ui/lib/utils';
import {
  describeMoment,
  type MomentOptions,
} from '@synapcity/frontend-ui/lib/moment';

export interface DatePillProps extends Omit<MomentOptions, 'hourCycle'> {
  /**
   * A moment to show. Its weekday, date, time and relative day follow the
   * person's regional settings (language, time zone, 12- or 24-hour time);
   * `locale` and `timeZone` override those, and the parts below replace
   * whichever of them you write.
   */
  value?: Date | number;
  /** Leave the time out of what is read from `value`. */
  showTime?: boolean;
  weekday?: string;
  date?: string;
  time?: string;
  relative?: string;
  surface?: BlockSurface;
  bordered?: boolean;
  inverted?: boolean;
  className?: string;
}

export function DatePill({
  value,
  locale,
  timeZone,
  showTime = true,
  weekday,
  date,
  time,
  relative,
  surface = 'card',
  bordered = false,
  inverted = false,
  className,
}: DatePillProps) {
  const now = useNow();
  const formatting = useDateTimeFormatting();
  // The server's clock and zone are not the browser's, so nothing is read from
  // the moment until the browser clock is known.
  const read =
    value !== undefined && now !== null
      ? describeMoment(value, now, {
          locale: locale ?? formatting.locale,
          timeZone: timeZone ?? formatting.timeZone,
          hourCycle: formatting.hourCycle,
        })
      : null;

  const parts = {
    relative: relative ?? read?.relative ?? undefined,
    weekday: weekday ?? read?.weekday,
    date: date ?? read?.date,
    time: time ?? (showTime ? read?.time : undefined),
  };

  const instant = typeof value === 'number' ? value : value?.getTime();
  const iso =
    instant !== undefined && Number.isFinite(instant)
      ? new Date(instant).toISOString()
      : undefined;
  const Pill = iso ? 'time' : 'div';

  return (
    <div
      className={cn(
        'relative flex size-full items-center justify-center p-4',
        className,
      )}
    >
      <Pill
        dateTime={iso}
        className={cn(
          'inline-flex items-center gap-3 truncate rounded-full px-4 py-1.5 shadow-sm',
          parts.relative && 'pl-2',
          blockSurface({ surface, inverted, bordered }),
        )}
      >
        {parts.relative && (
          <>
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
              {parts.relative}
            </span>
            <span className="h-3 w-px bg-border" aria-hidden="true" />
          </>
        )}
        {parts.weekday && (
          <span className="text-xs font-semibold text-current/60">
            {parts.weekday}
          </span>
        )}
        {parts.date && <span className="text-sm font-bold">{parts.date}</span>}
        {parts.time && (
          <>
            <span className="h-3 w-px bg-border" aria-hidden="true" />
            <span className="text-sm text-current/60">{parts.time}</span>
          </>
        )}
      </Pill>
    </div>
  );
}
