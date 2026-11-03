jest.mock('../services/database', () => ({
  database: jest.fn(),
  id: jest.fn(() => 'log-id'),
  todayKey: jest.fn(() => '2025-03-10'),
}));
jest.mock('./habits', () => ({ award: jest.fn() }));
jest.mock('../services/achievements', () => ({ evaluateAchievements: jest.fn() }));

import { database } from '../services/database';
import {
  listRoutines,
  listSteps,
  routineProgress,
  setStepStatus,
} from './skincare';

const db = {
  getAllAsync: jest.fn(),
  getFirstAsync: jest.fn(),
  runAsync: jest.fn().mockResolvedValue(undefined),
};

beforeEach(() => {
  jest.clearAllMocks();
  (database as jest.Mock).mockResolvedValue(db);
});

test('keeps Morning and Night routine settings independent', async () => {
  db.getAllAsync.mockResolvedValue([{ routine: 'Morning', enabled: 0 }, { routine: 'Night', enabled: 1 }]);

  await expect(listRoutines()).resolves.toEqual([
    { routine: 'Morning', enabled: false },
    { routine: 'Night', enabled: true },
  ]);
});

test('filters today steps by routine and weekday', async () => {
  db.getAllAsync.mockResolvedValue([]);

  await listSteps('Morning', '2025-03-10');

  expect(db.getAllAsync.mock.calls[0][0]).toContain("AND s.routine=?");
  expect(db.getAllAsync.mock.calls[0][0]).toContain("r.enabled=1");
  expect(db.getAllAsync.mock.calls[0][0]).toContain("s.enabled=1");
  expect(db.getAllAsync.mock.calls[0][1]).toEqual(['2025-03-10', 1, 'Morning']);
});

test('counts required completion independently from optional steps', async () => {
  db.getAllAsync
    .mockResolvedValueOnce([{ routine: 'Morning', enabled: 1 }, { routine: 'Night', enabled: 1 }])
    .mockResolvedValueOnce([
      { id: 'cleanser', is_optional: 0, completed: 1 },
      { id: 'moisturizer', is_optional: 0, completed: 0 },
      { id: 'serum', is_optional: 1, completed: 0 },
    ]);

  await expect(routineProgress('Morning')).resolves.toMatchObject({
    routine: 'Morning',
    required: 2,
    completed: 1,
    remaining: 1,
    isComplete: false,
  });
});

test('stores skipped state with a unique daily upsert and clears only today when pending', async () => {
  await setStepStatus('pm-treatment', 'skipped');
  expect(db.runAsync.mock.calls[0][0]).toContain('ON CONFLICT(step_id,day) DO UPDATE');
  expect(db.runAsync.mock.calls[0][1]).toEqual(['log-id', 'pm-treatment', '2025-03-10', 0, 1]);

  await setStepStatus('pm-treatment', 'pending');
  expect(db.runAsync.mock.calls[1]).toEqual([
    'DELETE FROM skincare_logs WHERE step_id=? AND day=?',
    ['pm-treatment', '2025-03-10'],
  ]);
});
