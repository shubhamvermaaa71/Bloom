jest.mock('../services/database', () => ({
  database: jest.fn(),
  id: jest.fn(() => 'water-id'),
  todayKey: (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
}));
jest.mock('./habits', () => ({ award: jest.fn() }));

import { database } from '../services/database';
import { deleteWater, waterEntries, waterHistory } from './water';

const db = {
  getAllAsync: jest.fn(),
  runAsync: jest.fn().mockResolvedValue(undefined),
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2025, 2, 10, 12));
  jest.clearAllMocks();
  (database as jest.Mock).mockResolvedValue(db);
});

afterEach(() => {
  jest.useRealTimers();
});

test('returns a continuous date range and fills days without logged water', async () => {
  db.getAllAsync.mockResolvedValue([
    { day: '2025-03-08', total: 500 },
    { day: '2025-03-10', total: 250 },
  ]);

  await expect(waterHistory(3)).resolves.toEqual([
    { day: '2025-03-08', total: 500 },
    { day: '2025-03-09', total: 0 },
    { day: '2025-03-10', total: 250 },
  ]);
  expect(db.getAllAsync).toHaveBeenCalledWith(
    expect.stringContaining('GROUP BY day'),
    ['2025-03-08', '2025-03-10'],
  );
});

test('loads water entries newest first for the selected day', async () => {
  db.getAllAsync.mockResolvedValue([{ id: 'entry-1', amount: 250, created_at: '2025-03-10T12:00:00.000Z' }]);

  await expect(waterEntries('2025-03-10')).resolves.toEqual([
    { id: 'entry-1', amount: 250, created_at: '2025-03-10T12:00:00.000Z' },
  ]);
  expect(db.getAllAsync).toHaveBeenCalledWith(
    expect.stringContaining('ORDER BY created_at DESC'),
    ['2025-03-10'],
  );
});

test('deletes only today’s water entry and its garden event', async () => {
  await deleteWater('water-id');

  expect(db.runAsync).toHaveBeenNthCalledWith(
    1,
    'DELETE FROM water_logs WHERE id=? AND day=?',
    ['water-id', '2025-03-10'],
  );
  expect(db.runAsync).toHaveBeenNthCalledWith(
    2,
    'DELETE FROM garden_events WHERE kind="water" AND source_id=?',
    ['water-id'],
  );
});
