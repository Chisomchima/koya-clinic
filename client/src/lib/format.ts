const fmt = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(undefined, options);

const longDay = fmt({ weekday: 'long', day: 'numeric', month: 'long' });
const shortDay = fmt({ weekday: 'short', day: 'numeric', month: 'short' });
const monthYear = fmt({ month: 'long', year: 'numeric' });
const time = fmt({ hour: 'numeric', minute: '2-digit' });

export const formatLongDay = (d: Date | string) => longDay.format(new Date(d));
export const formatMonthYear = (d: Date) => monthYear.format(d);
export const formatTime = (d: Date | string) => time.format(new Date(d));
export const formatTimeRange = (start: string, end: string) =>
  `${formatTime(start)} – ${formatTime(end)}`;
export const formatDateTime = (iso: string) => `${formatLongDay(iso)} at ${formatTime(iso)}`;

export const durationMinutes = (start: string, end: string) =>
  Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000);

export const localTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

/** YYYY-MM-DD in local time. */
export const dayKey = (d: Date | string) => {
  const date = new Date(d);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mm}-${dd}`;
};

export const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
export const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);

/** The weekday names, Monday first, in the viewer's locale ("Mon", "Tue", ...). */
export const weekdayLabels = () => {
  const f = fmt({ weekday: 'short' });
  return Array.from({ length: 7 }, (_, i) => f.format(new Date(2024, 0, 1 + i))); // 1 Jan 2024 was a Monday
};

/** The days to draw for a month grid, Monday first, padded with nulls. */
export function monthGrid(month: Date): (Date | null)[] {
  const first = startOfMonth(month);
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const leading = (first.getDay() + 6) % 7;
  const cells: (Date | null)[] = Array.from({ length: leading }, () => null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(first.getFullYear(), first.getMonth(), day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** "Dr Ade" → "A", "Ada Obi" → "AO". */
export const initials = (name: string) =>
  name
    .replace(/^(dr|mr|mrs|ms|prof)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

/** "today", "tomorrow" or a short date. */
export function relativeDay(iso: string, now = new Date()) {
  const key = dayKey(iso);
  if (key === dayKey(now)) return 'today';
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (key === dayKey(tomorrow)) return 'tomorrow';
  return shortDay.format(new Date(iso));
}
