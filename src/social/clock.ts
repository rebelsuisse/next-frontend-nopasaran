// src/social/clock.ts

import { RULES } from './config';

// Wall-clock time in Switzerland. Vercel functions run in UTC, and the
// publishing rules (hours, days, weeks) are expressed in Swiss time.
export interface SwissClock {
  date: string; // YYYY-MM-DD
  hour: number; // 0-23
  minute: number;
  weekday: number; // 0 = Sunday
  isoWeek: string; // e.g. 2026-W40
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: RULES.timeZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  weekday: 'short',
  hourCycle: 'h23',
});

export function swissClock(now: Date): SwissClock {
  const parts = Object.fromEntries(
    formatter.formatToParts(now).map(part => [part.type, part.value])
  );
  const date = `${parts.year}-${parts.month}-${parts.day}`;

  return {
    date,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: WEEKDAYS.indexOf(parts.weekday),
    isoWeek: isoWeekKey(date),
  };
}

export function isWithinPublishingHours(clock: SwissClock): boolean {
  return clock.hour >= RULES.windowStartHour && clock.hour < RULES.windowEndHour;
}

// ISO 8601 week of a calendar date: weeks start on Monday, and week 1 is the
// one that contains the year's first Thursday.
function isoWeekKey(date: string): string {
  const day = new Date(`${date}T00:00:00Z`);
  const weekday = day.getUTCDay() || 7; // Monday = 1 ... Sunday = 7
  day.setUTCDate(day.getUTCDate() + 4 - weekday); // Thursday of that week
  const yearStart = Date.UTC(day.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((day.getTime() - yearStart) / 86_400_000 + 1) / 7);
  return `${day.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}
