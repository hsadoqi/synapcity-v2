/** Local-time calendar helpers. Weeks start on Monday, matching the prototype. */

/** Shape of a {@link dayKey}: YYYY-MM-DD. */
export const DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** YYYY-MM-DD for the local calendar day containing `time`. */
export function dayKey(time: number): string {
  const d = new Date(time);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/** Local midnight of the Monday that starts the week containing `time`. */
export function startOfWeek(time: number): number {
  const d = new Date(time);
  const mondayOffset = (d.getDay() + 6) % 7;
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate() - mondayOffset,
  ).getTime();
}

/** Local midnight of each day Monday to Sunday of the week containing `time`. */
export function weekDayStarts(time: number): number[] {
  const monday = new Date(startOfWeek(time));
  return Array.from({ length: 7 }, (_, i) =>
    new Date(
      monday.getFullYear(),
      monday.getMonth(),
      monday.getDate() + i,
    ).getTime(),
  );
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayIndex(time: number): number {
  return (new Date(time).getDay() + 6) % 7;
}

export function isSameWeek(a: number, b: number): boolean {
  return startOfWeek(a) === startOfWeek(b);
}
