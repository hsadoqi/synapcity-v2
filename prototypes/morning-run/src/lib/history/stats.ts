import type { HistoryEntry } from './model';

export function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const DAY = 86_400_000;

/** Consecutive days with at least one run. A streak is still alive if today has none yet but yesterday did. */
export function currentStreak(entries: HistoryEntry[], today: Date): number {
  const days = new Set(entries.map((e) => dateKey(new Date(e.completedAt))));
  let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!days.has(dateKey(cursor))) cursor = new Date(cursor.getTime() - DAY);
  let streak = 0;
  while (days.has(dateKey(cursor))) {
    streak += 1;
    cursor = new Date(
      cursor.getFullYear(),
      cursor.getMonth(),
      cursor.getDate() - 1,
    );
  }
  return streak;
}

export type WeekBucket = { start: string; count: number };

function mondayOf(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return d;
}

/** Runs per week for the last `weeks` weeks, oldest first, ending with the current week. */
export function weeklyCounts(
  entries: HistoryEntry[],
  today: Date,
  weeks = 8,
): WeekBucket[] {
  const thisMonday = mondayOf(today);
  const buckets: WeekBucket[] = [];
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const start = new Date(thisMonday);
    start.setDate(start.getDate() - i * 7);
    buckets.push({ start: dateKey(start), count: 0 });
  }
  for (const entry of entries) {
    const key = dateKey(mondayOf(new Date(entry.completedAt)));
    const bucket = buckets.find((b) => b.start === key);
    if (bucket) bucket.count += 1;
  }
  return buckets;
}

export type EnergyPoint = { at: string; value: number };

/** Energy ratings over time, oldest first. */
export function energySeries(
  entries: HistoryEntry[],
  limit = 30,
): EnergyPoint[] {
  return entries
    .filter((e): e is HistoryEntry & { energy: number } => e.energy !== null)
    .sort((a, b) => a.completedAt.localeCompare(b.completedAt))
    .slice(-limit)
    .map((e) => ({ at: e.completedAt, value: e.energy }));
}

export function averageEnergy(points: EnergyPoint[]): number | null {
  if (points.length === 0) return null;
  return (
    Math.round((points.reduce((s, p) => s + p.value, 0) / points.length) * 10) /
    10
  );
}

export function runCounts(
  entries: HistoryEntry[],
): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const e of entries)
    counts.set(e.runName, (counts.get(e.runName) ?? 0) + 1);
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function totalMinutes(entries: HistoryEntry[]): number {
  return Math.round(entries.reduce((s, e) => s + e.durationSec, 0) / 60);
}
