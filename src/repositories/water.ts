import { database,id,todayKey } from '../services/database';
import { award } from './habits';
export type WaterEntry = { id:string; amount:number; created_at:string };

export async function waterTotal(day=todayKey()) {
  const d=await database(); const r=await d.getFirstAsync<{total:number|null}>('SELECT SUM(amount) total FROM water_logs WHERE day=?',[day]); return r?.total??0;
}
export async function waterHistory(days=7) {
  const count=Math.max(0,Math.floor(days));
  if(count===0)return [];
  const endDate=new Date(),startDate=new Date(endDate);
  startDate.setDate(endDate.getDate()-count+1);
  const startDay=todayKey(startDate),endDay=todayKey(endDate),d=await database();
  const rows=await d.getAllAsync<{day:string;total:number|null}>(
    'SELECT day,SUM(amount) AS total FROM water_logs WHERE day BETWEEN ? AND ? GROUP BY day ORDER BY day',
    [startDay,endDay],
  );
  const totals=new Map(rows.map(row=>[row.day,row.total??0]));
  const out:{day:string;total:number}[]=[];
  for(let i=0;i<count;i++){
    const date=new Date(startDate);date.setDate(startDate.getDate()+i);
    const day=todayKey(date);out.push({day,total:totals.get(day)??0});
  }
  return out;
}
export async function waterEntries(day=todayKey()):Promise<WaterEntry[]> {
  const d=await database();
  return d.getAllAsync<WaterEntry>('SELECT id,amount,created_at FROM water_logs WHERE day=? ORDER BY created_at DESC',[day]);
}
export async function addWater(amount:number) {
  if(!Number.isInteger(amount)||amount<1||amount>5000) throw new Error('Enter an amount between 1 and 5000 ml');
  const d=await database(),key=id(),now=new Date().toISOString(),day=todayKey();
  await d.runAsync('INSERT INTO water_logs(id,amount,created_at,day) VALUES(?,?,?,?)',[key,amount,now,day]);
  await award('water',key,3,day);
  const {evaluateAchievements}=await import('../services/achievements'); await evaluateAchievements();
  return key;
}
export async function deleteWater(entryId:string) {
  const d=await database();
  await d.runAsync('DELETE FROM water_logs WHERE id=? AND day=?',[entryId,todayKey()]);
  await d.runAsync('DELETE FROM garden_events WHERE kind="water" AND source_id=?',[entryId]);
}
export async function undoWater() {
  const d=await database(); const r=await d.getFirstAsync<{id:string}>('SELECT id FROM water_logs WHERE day=? ORDER BY created_at DESC LIMIT 1',[todayKey()]);
  if(r)await deleteWater(r.id);
}
