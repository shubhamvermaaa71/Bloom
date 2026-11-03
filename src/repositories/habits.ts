import { database, id, todayKey } from '../services/database';
export type Habit = { id:string; name:string; category:string; completed:boolean };
export async function listHabits(day=todayKey()):Promise<Habit[]> {
  const d=await database();
  return d.getAllAsync<Habit>(`SELECT h.id,h.name,h.category,COALESCE(l.completed,0) as completed
    FROM habits h LEFT JOIN habit_logs l ON l.habit_id=h.id AND l.day=? WHERE h.archived=0 ORDER BY h.created_at`,[day]);
}
export async function saveHabit(name:string,category='General',habitId?:string) {
  const d=await database(); if(!name.trim()) throw new Error('Habit name is required');
  if(habitId) await d.runAsync('UPDATE habits SET name=?,category=? WHERE id=?',[name.trim(),category,habitId]);
  else await d.runAsync('INSERT INTO habits(id,name,category,created_at) VALUES(?,?,?,?)',[id(),name.trim(),category,new Date().toISOString()]);
}
export async function deleteHabit(habitId:string) {
  const d=await database(); await d.runAsync('DELETE FROM habit_logs WHERE habit_id=?',[habitId]); await d.runAsync('DELETE FROM habits WHERE id=?',[habitId]);
}
export async function toggleHabit(habitId:string,completed:boolean,day=todayKey()) {
  const d=await database();
  await d.runAsync('INSERT INTO habit_logs(id,habit_id,day,completed) VALUES(?,?,?,?) ON CONFLICT(habit_id,day) DO UPDATE SET completed=excluded.completed',[id(),habitId,day,completed?1:0]);
  if(completed) await award('habit',`${habitId}:${day}`,5,day);
  const { evaluateAchievements } = await import('../services/achievements');
  await evaluateAchievements();
}
export async function award(kind:string,sourceId:string,points:number,day=todayKey()) {
  const d=await database(); await d.runAsync('INSERT OR IGNORE INTO garden_events(id,kind,source_id,points,day) VALUES(?,?,?,?,?)',[id(),kind,sourceId,points,day]);
}
