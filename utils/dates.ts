export interface CalendarDay {
  date: string;          // YYYY-MM-DD
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
}

export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayString(): string {
  return toDateString(new Date());
}

export function formatMonthYear(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function formatShortDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getCalendarDays(year: number, month: number): CalendarDay[] {
  const todayDate = new Date();
  const todayMs = new Date(
    todayDate.getFullYear(),
    todayDate.getMonth(),
    todayDate.getDate()
  ).getTime();
  const today = todayString();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay(); // 0 = Sunday
  const daysInMonth = lastDay.getDate();

  const days: CalendarDay[] = [];

  // Leading days from previous month
  if (startWeekday > 0) {
    const prevLast = new Date(year, month, 0);
    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = prevLast.getDate() - i;
      const date = new Date(year, month - 1, d);
      days.push({
        date: toDateString(date),
        day: d,
        isCurrentMonth: false,
        isToday: false,
        isFuture: date.getTime() > todayMs,
      });
    }
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dateStr = toDateString(date);
    days.push({
      date: dateStr,
      day: d,
      isCurrentMonth: true,
      isToday: dateStr === today,
      isFuture: date.getTime() > todayMs,
    });
  }

  // Trailing days for next month
  const remainder = days.length % 7;
  if (remainder > 0) {
    const trailing = 7 - remainder;
    for (let d = 1; d <= trailing; d++) {
      const date = new Date(year, month + 1, d);
      days.push({
        date: toDateString(date),
        day: d,
        isCurrentMonth: false,
        isToday: false,
        isFuture: date.getTime() > todayMs,
      });
    }
  }

  return days;
}

export function calculateStreak(entries: { date: string }[]): number {
  if (entries.length === 0) return 0;
  const today = todayString();
  const dateSet = new Set(entries.map(e => e.date));

  let streak = 0;
  const cursor = new Date();
  // Start from today; if today has no entry, start from yesterday
  if (!dateSet.has(today)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (true) {
    const dateStr = toDateString(cursor);
    if (dateSet.has(dateStr)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function getLastNDays(
  entries: { date: string }[],
  n: number
): { date: string; hasEntry: boolean }[] {
  const dateSet = new Set(entries.map(e => e.date));
  const today = new Date();
  const result: { date: string; hasEntry: boolean }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = toDateString(d);
    result.push({ date: dateStr, hasEntry: dateSet.has(dateStr) });
  }
  return result;
}

export function calculateBestStreak(entries: { date: string }[]): number {
  if (entries.length === 0) return 0;
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  let best = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].date);
    const curr = new Date(sorted[i].date);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }

  return best;
}
