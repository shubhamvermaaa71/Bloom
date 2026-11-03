import * as SQLite from 'expo-sqlite';
import * as Notifications from 'expo-notifications';

let db: SQLite.SQLiteDatabase | null = null;
let opening: Promise<SQLite.SQLiteDatabase> | null = null;

export async function removeLegacyReminderSupport(
  database: Pick<SQLite.SQLiteDatabase, 'execAsync' | 'getAllAsync'>,
) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const cols = await database.getAllAsync<{ name: string }>('PRAGMA table_info(habits)');
  const names = cols.map(c => c.name);
  for (const column of ['reminder_enabled', 'reminder_start', 'reminder_end']) {
    if (names.includes(column)) await database.execAsync(`ALTER TABLE habits DROP COLUMN ${column}`);
  }
  await database.execAsync(`
    DROP TABLE IF EXISTS notification_state;
    DELETE FROM settings WHERE lower(key) LIKE '%notif%' OR lower(key) LIKE '%remind%' OR key IN (
      'reminderMode', 'notificationsEnabled', 'waterReminders', 'restReminders',
      'dailyLimit', 'activeStart', 'activeEnd', 'quietStart', 'quietEnd',
      'minimumGap', 'waterIntervalMin', 'waterIntervalMax', 'restIntervalMin', 'restIntervalMax'
    );
    PRAGMA user_version = 4;
  `);
}

export async function migrateSkincareRoutines(
  database: Pick<SQLite.SQLiteDatabase, 'execAsync' | 'getAllAsync' | 'getFirstAsync' | 'runAsync'>,
  today = todayKey(),
) {
  const stepColumns = await database.getAllAsync<{ name: string }>('PRAGMA table_info(skincare_steps)');
  const existingStepColumns = new Set(stepColumns.map(column => column.name));
  const stepAdditions = [
    ['description', "TEXT NOT NULL DEFAULT ''"],
    ['is_optional', 'INTEGER NOT NULL DEFAULT 0'],
    ['enabled', 'INTEGER NOT NULL DEFAULT 1'],
    ['weekdays', "TEXT NOT NULL DEFAULT '0,1,2,3,4,5,6'"],
    ['deleted', 'INTEGER NOT NULL DEFAULT 0'],
    ['created_day', "TEXT NOT NULL DEFAULT ''"],
    ['deleted_day', 'TEXT'],
  ] as const;
  for (const [column, definition] of stepAdditions) {
    if (!existingStepColumns.has(column)) {
      await database.execAsync(`ALTER TABLE skincare_steps ADD COLUMN ${column} ${definition}`);
    }
  }
  const logColumns = await database.getAllAsync<{ name: string }>('PRAGMA table_info(skincare_logs)');
  if (!logColumns.some(column => column.name === 'skipped')) {
    await database.execAsync('ALTER TABLE skincare_logs ADD COLUMN skipped INTEGER NOT NULL DEFAULT 0');
  }
  await database.runAsync('UPDATE skincare_steps SET created_day=? WHERE created_day=\'\'', [today]);
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS skincare_routines (
      routine TEXT PRIMARY KEY CHECK (routine IN ('Morning', 'Night')),
      enabled INTEGER NOT NULL DEFAULT 1
    );
    INSERT OR IGNORE INTO skincare_routines(routine, enabled) VALUES ('Morning', 1), ('Night', 1);
  `);

  const defaults = [
    ['Morning', [
      ['skincare-am-cleanser', 'Cleanser', '', 0],
      ['skincare-am-serum', 'Serum', '', 1],
      ['skincare-am-moisturizer', 'Moisturizer', '', 0],
      ['skincare-am-sunscreen', 'Sunscreen', '', 0],
    ]],
    ['Night', [
      ['skincare-pm-cleanser', 'Cleanser', '', 0],
      ['skincare-pm-treatment', 'Treatment', '', 1],
      ['skincare-pm-moisturizer', 'Moisturizer', '', 0],
    ]],
  ] as const;
  for (const [routine, steps] of defaults) {
    const count = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM skincare_steps WHERE routine=?',
      [routine],
    );
    if ((count?.count ?? 0) > 0) continue;
    for (const [position, [stepId, label, description, optional]] of steps.entries()) {
      await database.runAsync(
        'INSERT OR IGNORE INTO skincare_steps(id,routine,label,position,description,is_optional,enabled,weekdays,deleted,created_day) VALUES(?,?,?,?,?,?,1,\'0,1,2,3,4,5,6\',0,?)',
        [stepId, routine, label, position, description, optional, today],
      );
    }
  }
  await database.execAsync('CREATE INDEX IF NOT EXISTS idx_skincare_steps_routine ON skincare_steps(routine, deleted, position)');
  await database.execAsync('PRAGMA user_version = 5');
}

export async function initializeDatabase() {
  if (db) return db;
  if (opening) return opening;
  opening = (async () => {
  db = await SQLite.openDatabaseAsync('bloom.db');
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  if ((version?.user_version ?? 0) < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS habits (id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, created_at TEXT NOT NULL, archived INTEGER NOT NULL DEFAULT 0, reminder_enabled INTEGER NOT NULL DEFAULT 0, reminder_start INTEGER NOT NULL DEFAULT 9, reminder_end INTEGER NOT NULL DEFAULT 20);
      CREATE TABLE IF NOT EXISTS habit_logs (id TEXT PRIMARY KEY, habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE, day TEXT NOT NULL, completed INTEGER NOT NULL, UNIQUE(habit_id, day));
      CREATE TABLE IF NOT EXISTS water_logs (id TEXT PRIMARY KEY, amount INTEGER NOT NULL, created_at TEXT NOT NULL, day TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS skincare_steps (id TEXT PRIMARY KEY, routine TEXT NOT NULL, label TEXT NOT NULL, position INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS skincare_logs (id TEXT PRIMARY KEY, step_id TEXT NOT NULL REFERENCES skincare_steps(id) ON DELETE CASCADE, day TEXT NOT NULL, completed INTEGER NOT NULL, UNIQUE(step_id, day));
      CREATE TABLE IF NOT EXISTS journal (id TEXT PRIMARY KEY, title TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS moods (day TEXT PRIMARY KEY, mood TEXT NOT NULL, reflection TEXT NOT NULL DEFAULT '');
      CREATE TABLE IF NOT EXISTS garden_events (id TEXT PRIMARY KEY, kind TEXT NOT NULL, source_id TEXT NOT NULL, points INTEGER NOT NULL, day TEXT NOT NULL, UNIQUE(kind, source_id));
      CREATE TABLE IF NOT EXISTS achievements (key TEXT PRIMARY KEY, unlocked_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      PRAGMA user_version = 1;
    `);
  }
  if ((version?.user_version ?? 0) < 2) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS notification_state (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS idx_habit_logs_day ON habit_logs(day);
      CREATE INDEX IF NOT EXISTS idx_water_logs_day ON water_logs(day);
      CREATE INDEX IF NOT EXISTS idx_skincare_logs_day ON skincare_logs(day);
      CREATE INDEX IF NOT EXISTS idx_journal_updated ON journal(updated_at);
      PRAGMA user_version = 2;
    `);
  }
  if ((version?.user_version ?? 0) < 3) {
    const cols = await db.getAllAsync<{ name: string }>("PRAGMA table_info(habits)");
    const names = cols.map(c => c.name);
    if (!names.includes('reminder_enabled')) await db.execAsync('ALTER TABLE habits ADD COLUMN reminder_enabled INTEGER NOT NULL DEFAULT 0');
    if (!names.includes('reminder_start')) await db.execAsync('ALTER TABLE habits ADD COLUMN reminder_start INTEGER NOT NULL DEFAULT 9');
    if (!names.includes('reminder_end')) await db.execAsync('ALTER TABLE habits ADD COLUMN reminder_end INTEGER NOT NULL DEFAULT 20');
    await db.execAsync('PRAGMA user_version = 3');
  }
  if ((version?.user_version ?? 0) < 4) {
    await removeLegacyReminderSupport(db);
  }
  if ((version?.user_version ?? 0) < 5) {
    await migrateSkincareRoutines(db);
  }
  return db;
  })();
  try { return await opening; } catch (error) { opening = null; db = null; throw error; }
}
export async function database() { return db ?? initializeDatabase(); }
export function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function id() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`; }
