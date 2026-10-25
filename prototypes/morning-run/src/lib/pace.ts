type EnergyLevel = 'low' | 'steady' | 'high';

export type Pace = {
  level: EnergyLevel;
  startHour: number;
  /** Length of one focus session, in minutes. */
  sessionMin: number;
  breakMin: number;
  note: string;
};

const BREAK_MIN = 10;

/** Energy shapes the day: later and shorter when low, earlier and longer when high. */
export function paceFor(energy: number | null): Pace {
  const level: EnergyLevel =
    energy === null
      ? 'steady'
      : energy <= 4
        ? 'low'
        : energy >= 7
          ? 'high'
          : 'steady';
  if (level === 'low') {
    return {
      level,
      startHour: 11,
      sessionMin: 25,
      breakMin: BREAK_MIN,
      note: 'A later start and shorter sessions, since energy is low.',
    };
  }
  if (level === 'high') {
    return {
      level,
      startHour: 9,
      sessionMin: 50,
      breakMin: BREAK_MIN,
      note: 'An early start and longer sessions, since energy is high.',
    };
  }
  return {
    level,
    startHour: 10,
    sessionMin: 35,
    breakMin: BREAK_MIN,
    note: 'A steady pace.',
  };
}

export function formatHour(hour: number): string {
  return `${hour % 12 || 12}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
}

export const HOURS_BY_OPTION: Record<string, number> = {
  '1 hour': 1,
  '2 hours': 2,
  'Half a day': 4,
};
