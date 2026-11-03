import { database,id,todayKey } from '../services/database';
import { award } from './habits';
export async function waterTotal(day=todayKey()) {
  const d=await database(); const r=await d.getFirstAsync<{total:number|null}>('SELECT SUM(amount) total FROM water_logs WHERE day=?',[day]); return r?.total??0;
}
export async function waterHistory(days=7) {
  const d=await database(); const out:{day:string;total:number}[]=[];
  for(let i=days-1;i>=0;i--){const date=new Date();date.setDate(date.getDate()-i);const day=todayKey(date);out.push({day,total:await waterTotal(day)});}
  return out;
}
export async function addWater(amount:number) {
  if(!Number.isInteger(amount)||amount<1||amount>5000) throw new Error('Enter an amount between 1 and 5000 ml');
  const d=await database(),key=id(),now=new Date().toISOString(),day=todayKey();
  await d.runAsync('INSERT INTO water_logs(id,amount,created_at,day) VALUES(?,?,?,?)',[key,amount,now,day]);
  await award('water',key,3,day);
  const {evaluateAchievements}=await import('../services/achievements'); await evaluateAchievements();
  return key;
}
export async function undoWater() {
  const d=await database(); const r=await d.getFirstAsync<{id:string}>('SELECT id FROM water_logs WHERE day=? ORDER BY created_at DESC LIMIT 1',[todayKey()]);
  if(r){await d.runAsync('DELETE FROM water_logs WHERE id=?',[r.id]);await d.runAsync('DELETE FROM garden_events WHERE kind="water" AND source_id=?',[r.id]);}
}
