import { database, id, todayKey } from '../services/database';
import { award } from './habits';

export type SkincareRoutine = 'Morning' | 'Night';
export type SkincareStatus = 'completed' | 'skipped' | 'pending';
export type RoutineSettings = { routine: SkincareRoutine; enabled: boolean };
export type SkincareStep = {
  id: string;
  routine: SkincareRoutine;
  label: string;
  description: string;
  position: number;
  is_optional: number;
  enabled: number;
  weekdays: string;
  created_day: string;
  deleted_day: string | null;
  completed: number;
  skipped: number;
};
export type RoutineProgress = {
  routine: SkincareRoutine;
  enabled: boolean;
  required: number;
  completed: number;
  remaining: number;
  isComplete: boolean;
};
export type ConsistencySummary = {
  routine: SkincareRoutine;
  eligibleDays: number;
  completedRoutines: number;
  missedRoutines: number;
  completedSteps: number;
  skippedSteps: number;
};
export type SkincareConsistency = { weekly: ConsistencySummary[]; monthly: ConsistencySummary[] };

const routines: SkincareRoutine[] = ['Morning', 'Night'];

function isScheduled(weekdays: string, date: Date) {
  return weekdays.split(',').includes(String(date.getDay()));
}

function dateKeys(days: number, end = new Date()) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(end.getFullYear(), end.getMonth(), end.getDate() - days + index + 1);
    return { day: todayKey(date), date };
  });
}

export async function listRoutines(): Promise<RoutineSettings[]> {
  const db = await database();
  const stored = await db.getAllAsync<{ routine: SkincareRoutine; enabled: number }>(
    'SELECT routine, enabled FROM skincare_routines ORDER BY CASE routine WHEN \'Morning\' THEN 0 ELSE 1 END',
  );
  return routines.map(routine => ({
    routine,
    enabled: stored.find(item => item.routine === routine)?.enabled !== 0,
  }));
}

export async function setRoutineEnabled(routine: SkincareRoutine, enabled: boolean) {
  const db = await database();
  await db.runAsync(
    'INSERT INTO skincare_routines(routine,enabled) VALUES(?,?) ON CONFLICT(routine) DO UPDATE SET enabled=excluded.enabled',
    [routine, enabled ? 1 : 0],
  );
}

export async function listSteps(routine?: SkincareRoutine, day = todayKey()): Promise<SkincareStep[]> {
  const db = await database();
  const date = new Date(`${day}T12:00:00`);
  const weekday = date.getDay();
  const whereRoutine = routine ? 'AND s.routine=?' : '';
  const params: (string | number)[] = [day, weekday];
  if (routine) params.push(routine);
  return db.getAllAsync<SkincareStep>(
    `SELECT s.*, COALESCE(l.completed,0) AS completed, COALESCE(l.skipped,0) AS skipped
     FROM skincare_steps s
     JOIN skincare_routines r ON r.routine=s.routine AND r.enabled=1
     LEFT JOIN skincare_logs l ON l.step_id=s.id AND l.day=?
     WHERE s.deleted=0 AND s.enabled=1
       AND (',' || s.weekdays || ',') LIKE '%,' || ? || ',%'
       ${whereRoutine}
     ORDER BY CASE s.routine WHEN 'Morning' THEN 0 ELSE 1 END, s.position`,
    params,
  );
}

export async function listAllSteps(routine: SkincareRoutine): Promise<SkincareStep[]> {
  const db = await database();
  return db.getAllAsync<SkincareStep>(
    `SELECT s.*, COALESCE(l.completed,0) AS completed, COALESCE(l.skipped,0) AS skipped
     FROM skincare_steps s
     LEFT JOIN skincare_logs l ON l.step_id=s.id AND l.day=?
     WHERE s.routine=? AND s.deleted=0
     ORDER BY s.position, s.created_day`,
    [todayKey(), routine],
  );
}

export async function addStep(
  routine: SkincareRoutine,
  label: string,
  options: { description?: string; optional?: boolean; weekdays?: number[] } = {},
) {
  const name = label.trim();
  if (!name) throw new Error('Step name required');
  if (name.length > 80) throw new Error('Step name must be 80 characters or fewer');
  const db = await database();
  const count = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM skincare_steps WHERE routine=? AND deleted=0',
    [routine],
  );
  const weekdays = [...new Set(options.weekdays ?? [0, 1, 2, 3, 4, 5, 6])]
    .filter(day => Number.isInteger(day) && day >= 0 && day <= 6)
    .sort((a, b) => a - b)
    .join(',');
  await db.runAsync(
    `INSERT INTO skincare_steps
      (id,routine,label,position,description,is_optional,enabled,weekdays,deleted,created_day)
     VALUES (?,?,?,?,?,?,1,?,0,?)`,
    [id(), routine, name, count?.count ?? 0, (options.description ?? '').trim(), options.optional ? 1 : 0, weekdays, todayKey()],
  );
}

export async function updateStep(
  stepId: string,
  changes: { label: string; description: string; optional: boolean; enabled: boolean; weekdays: number[] },
) {
  const label = changes.label.trim();
  if (!label) throw new Error('Step name required');
  if (label.length > 80) throw new Error('Step name must be 80 characters or fewer');
  const weekdays = [...new Set(changes.weekdays)]
    .filter(day => Number.isInteger(day) && day >= 0 && day <= 6)
    .sort((a, b) => a - b)
    .join(',');
  const db = await database();
  await db.runAsync(
    `UPDATE skincare_steps
     SET label=?, description=?, is_optional=?, enabled=?, weekdays=?
     WHERE id=? AND deleted=0`,
    [label, changes.description.trim(), changes.optional ? 1 : 0, changes.enabled ? 1 : 0, weekdays, stepId],
  );
}

export async function removeStep(stepId: string) {
  const db = await database();
  await db.runAsync('UPDATE skincare_steps SET deleted=1, deleted_day=? WHERE id=? AND deleted=0', [todayKey(), stepId]);
}

export async function reorderSteps(routine: SkincareRoutine, orderedIds: string[]) {
  const db = await database();
  for (const [position, stepId] of orderedIds.entries()) {
    await db.runAsync(
      'UPDATE skincare_steps SET position=? WHERE id=? AND routine=? AND deleted=0',
      [position, stepId, routine],
    );
  }
}

export async function setStepStatus(stepId: string, status: SkincareStatus, day = todayKey()) {
  const db = await database();
  if (status === 'pending') {
    await db.runAsync('DELETE FROM skincare_logs WHERE step_id=? AND day=?', [stepId, day]);
    return;
  }
  const completed = status === 'completed' ? 1 : 0;
  const skipped = status === 'skipped' ? 1 : 0;
  await db.runAsync(
    `INSERT INTO skincare_logs(id,step_id,day,completed,skipped) VALUES(?,?,?,?,?)
     ON CONFLICT(step_id,day) DO UPDATE SET completed=excluded.completed, skipped=excluded.skipped`,
    [id(), stepId, day, completed, skipped],
  );
  if (status === 'completed') {
    await award('skincare', `${stepId}:${day}`, 2, day);
    const { evaluateAchievements } = await import('../services/achievements');
    await evaluateAchievements();
  }
}

export async function toggleStep(stepId: string, done: boolean) {
  await setStepStatus(stepId, done ? 'completed' : 'pending');
}

export async function routineProgress(routine: SkincareRoutine, day = todayKey()): Promise<RoutineProgress> {
  const [settings, steps] = await Promise.all([listRoutines(), listSteps(routine, day)]);
  const requiredSteps = steps.filter(step => !step.is_optional);
  const completed = requiredSteps.filter(step => step.completed).length;
  return {
    routine,
    enabled: settings.find(item => item.routine === routine)?.enabled ?? false,
    required: requiredSteps.length,
    completed,
    remaining: Math.max(0, requiredSteps.length - completed),
    isComplete: steps.length > 0 && completed === requiredSteps.length,
  };
}

async function consistencyForDays(days: number): Promise<ConsistencySummary[]> {
  const db = await database();
  const dates = dateKeys(days);
  const firstDay = dates[0].day;
  const lastDay = dates[dates.length - 1].day;
  const [steps, logs, routineRows] = await Promise.all([
    db.getAllAsync<Pick<SkincareStep, 'id' | 'routine' | 'is_optional' | 'weekdays' | 'created_day' | 'enabled' | 'deleted_day'>>(
      `SELECT id,routine,is_optional,weekdays,created_day,enabled,deleted_day
       FROM skincare_steps WHERE created_day<=?`,
      [lastDay],
    ),
    db.getAllAsync<{ step_id: string; day: string; completed: number; skipped: number }>(
      'SELECT step_id,day,completed,skipped FROM skincare_logs WHERE day BETWEEN ? AND ?',
      [firstDay, lastDay],
    ),
    listRoutines(),
  ]);
  const logMap = new Map(logs.map(log => [`${log.step_id}:${log.day}`, log]));
  return routines.map(routine => {
    const enabled = routineRows.find(item => item.routine === routine)?.enabled ?? false;
    let eligibleDays = 0;
    let completedRoutines = 0;
    let missedRoutines = 0;
    let completedSteps = 0;
    let skippedSteps = 0;
    for (const { day, date } of dates) {
      const dailySteps = steps.filter(step =>
        step.routine === routine &&
        step.created_day <= day &&
        (!step.deleted_day || step.deleted_day > day) &&
        step.enabled === 1 &&
        !step.is_optional &&
        isScheduled(step.weekdays, date),
      );
      if (enabled && dailySteps.length) {
        eligibleDays += 1;
        const complete = dailySteps.every(step => logMap.get(`${step.id}:${day}`)?.completed === 1);
        if (complete) completedRoutines += 1;
        else if (day < todayKey()) missedRoutines += 1;
      }
      for (const step of steps) {
        if (step.routine !== routine || step.created_day > day || (step.deleted_day && step.deleted_day < day) || !isScheduled(step.weekdays, date)) continue;
        const log = logMap.get(`${step.id}:${day}`);
        if (log?.completed) completedSteps += 1;
        if (log?.skipped) skippedSteps += 1;
      }
    }
    return { routine, eligibleDays, completedRoutines, missedRoutines, completedSteps, skippedSteps };
  });
}

export async function skincareConsistency(): Promise<SkincareConsistency> {
  const [weekly, monthly] = await Promise.all([consistencyForDays(7), consistencyForDays(30)]);
  return { weekly, monthly };
}
