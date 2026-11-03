jest.mock('expo-sqlite', () => ({}));
jest.mock('expo-notifications', () => ({ cancelAllScheduledNotificationsAsync: jest.fn() }));

import * as Notifications from 'expo-notifications';
import { migrateSkincareRoutines, removeLegacyReminderSupport } from './database';

test('upgrades legacy reminder storage and cancels its scheduled notifications', async () => {
  const database = {
    execAsync: jest.fn().mockResolvedValue(undefined),
    getAllAsync: jest.fn().mockResolvedValue([
      { name: 'id' },
      { name: 'reminder_enabled' },
      { name: 'reminder_start' },
      { name: 'reminder_end' },
    ]),
  };

  await removeLegacyReminderSupport(database);

  expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
  expect(database.execAsync).toHaveBeenCalledWith('ALTER TABLE habits DROP COLUMN reminder_enabled');
  expect(database.execAsync).toHaveBeenCalledWith('ALTER TABLE habits DROP COLUMN reminder_start');
  expect(database.execAsync).toHaveBeenCalledWith('ALTER TABLE habits DROP COLUMN reminder_end');
  expect(database.execAsync).toHaveBeenCalledWith(expect.stringContaining('DROP TABLE IF EXISTS notification_state'));
  expect(database.execAsync).toHaveBeenCalledWith(expect.stringContaining('PRAGMA user_version = 4'));
});

test('upgrades skincare tables and seeds independent AM and PM templates without removing existing steps', async () => {
  const database = {
    execAsync: jest.fn().mockResolvedValue(undefined),
    getAllAsync: jest.fn(async (query: string) => {
      if (query.includes('table_info(skincare_steps)')) return [{ name: 'id' }, { name: 'routine' }, { name: 'label' }, { name: 'position' }];
      if (query.includes('table_info(skincare_logs)')) return [{ name: 'id' }, { name: 'step_id' }, { name: 'day' }, { name: 'completed' }];
      return [];
    }),
    getFirstAsync: jest.fn().mockResolvedValue({ count: 0 }),
    runAsync: jest.fn().mockResolvedValue(undefined),
  };

  await migrateSkincareRoutines(database, '2025-03-10');

  expect(database.execAsync).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS skincare_routines'));
  expect(database.execAsync).toHaveBeenCalledWith(expect.stringContaining('ALTER TABLE skincare_steps ADD COLUMN is_optional'));
  expect(database.execAsync).toHaveBeenCalledWith(expect.stringContaining('ALTER TABLE skincare_logs ADD COLUMN skipped'));
  const insertedSteps = database.runAsync.mock.calls.map(([query]) => query).filter(query => query.includes('INSERT OR IGNORE INTO skincare_steps'));
  expect(insertedSteps).toHaveLength(7);
  expect(database.runAsync).toHaveBeenCalledWith(expect.stringContaining('INSERT OR IGNORE INTO skincare_steps'), ['skincare-am-cleanser', 'Morning', 'Cleanser', 0, '', 0, '2025-03-10']);
  expect(database.execAsync).toHaveBeenCalledWith('PRAGMA user_version = 5');
});

test('preserves existing routine templates while seeding the missing routine', async () => {
  const database = {
    execAsync: jest.fn().mockResolvedValue(undefined),
    getAllAsync: jest.fn(async (query: string) => {
      if (query.includes('table_info(skincare_steps)')) return [{ name: 'id' }, { name: 'routine' }, { name: 'label' }, { name: 'position' }];
      if (query.includes('table_info(skincare_logs)')) return [{ name: 'id' }, { name: 'step_id' }, { name: 'day' }, { name: 'completed' }];
      return [];
    }),
    getFirstAsync: jest.fn()
      .mockResolvedValueOnce({ count: 3 })
      .mockResolvedValueOnce({ count: 0 }),
    runAsync: jest.fn().mockResolvedValue(undefined),
  };

  await migrateSkincareRoutines(database, '2025-03-10');

  expect(database.getFirstAsync).toHaveBeenCalledTimes(2);
  const insertedSteps = database.runAsync.mock.calls.map(([query]) => query).filter(query => query.includes('INSERT OR IGNORE INTO skincare_steps'));
  expect(insertedSteps).toHaveLength(3);
  expect(database.runAsync).not.toHaveBeenCalledWith(expect.stringContaining('DELETE FROM skincare_steps'), expect.anything());
});
