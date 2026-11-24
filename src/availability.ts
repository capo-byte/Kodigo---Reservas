const minute = 60_000;
const utcOffset = 360 * minute;

export function localDay(date: string): Date {
  const day = new Date(date + 'T00:00:00.000Z');
  if (!Number.isFinite(+day) || day.toISOString().slice(0, 10) !== date) {
    throw new RangeError('Fecha inválida');
  }
  return day;
}

function monthLimit(now: Date): number {
  const local = new Date(+now - utcOffset);
  const day = local.getUTCDate();
  local.setUTCDate(1);
  local.setUTCMonth(local.getUTCMonth() + 1);
  const lastDay = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + 1, 0)).getUTCDate();
  local.setUTCDate(Math.min(day, lastDay));
  return +local + utcOffset;
}

export interface Schedule {
  branch_open: number;
  branch_close: number;
  labor_open: number;
  labor_close: number;
}

export function slots(
  day: Date,
  now: Date,
  occupied: Set<number>,
  breaks: { starts_minute: number; ends_minute: number }[] = [],
  schedule: Schedule = { branch_open: 480, branch_close: 960, labor_open: 480, labor_close: 1020 },
) {
  if (day.getUTCDay() === 0) return [];
  const start = schedule.branch_open === schedule.labor_open ? schedule.branch_open : schedule.labor_open;
  const end = schedule.branch_close === schedule.labor_close ? schedule.branch_close : schedule.labor_close;
  const result: { time: string; startsAt: string }[] = [];
  const latest = monthLimit(now);
  for (let offset = Math.ceil(start / 30) * 30; offset + 30 <= end; offset += 30) {
    const starts = +day + utcOffset + offset * minute;
    if (starts < +now + 60 * minute || starts > latest || occupied.has(starts)) continue;
    if (breaks.some(rest => offset < rest.ends_minute && rest.starts_minute < offset + 30)) continue;
    const startsAt = new Date(starts).toISOString();
    const time = new Date(starts - utcOffset).toISOString().slice(11, 16);
    result.push({ time, startsAt });
  }
  return result;
}
