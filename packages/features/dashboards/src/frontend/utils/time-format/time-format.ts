import { formatTime } from '@synapcity/domain-preferences';
import {
  deviceTimezone,
  useDateTimeFormatting,
} from '@synapcity/frontend-preferences';

/**
 * Writes an event's clock time in the person's hour cycle: "9:30 AM" or
 * "09:30". It stays in the device's zone because the prototype events are put
 * on days by local time; a time from another zone could disagree with the day
 * it is listed under.
 */
export function useEventTime() {
  const formatting = useDateTimeFormatting();
  return (time: number) =>
    formatTime(new Date(time), { ...formatting, timeZone: deviceTimezone() });
}
