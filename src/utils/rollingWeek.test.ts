import { rollingWeekDays } from './rollingWeek';

describe('rollingWeekDays', () => {
  it('starts on the selected local date and follows the calendar for seven days', () => {
    const days = rollingWeekDays(new Date(2026, 10, 3, 23, 45));

    expect(days).toHaveLength(7);
    expect(days[0].day).toBe('2026-11-03');
    expect(days[6].day).toBe('2026-11-09');
  });

  it('keeps today open and locks dates until their day arrives', () => {
    const days = rollingWeekDays(new Date(2026, 10, 3));

    expect(days.map(day => day.locked)).toEqual([false, true, true, true, true, true, true]);
  });

  it('handles month and year boundaries', () => {
    const days = rollingWeekDays(new Date(2026, 11, 30));

    expect(days[0].day).toBe('2026-12-30');
    expect(days[6].day).toBe('2027-01-05');
  });
});
