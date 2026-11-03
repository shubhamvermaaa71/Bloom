export type RollingWeekDay = {
  day: string;
  date: Date;
  locked: boolean;
};

function localDayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function rollingWeekDays(today = new Date()): RollingWeekDay[] {
  const start = new Date(today);
  start.setHours(12, 0, 0, 0);
  return Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);
    return { day: localDayKey(date), date, locked: offset > 0 };
  });
}
