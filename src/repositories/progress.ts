import {database} from '../services/database';
import {waterTotal} from './water';
import {rollingWeekDays} from '../utils/rollingWeek';
export async function weeklyHabitProgress() {
  const d=await database(),result:{day:string;completed:number;total:number;percent:number;locked:boolean}[]=[];
  for(const {day,locked} of rollingWeekDays()) {
    const row=locked?null:await d.getFirstAsync<{completed:number;total:number}>(`SELECT
      (SELECT COUNT(*) FROM habit_logs WHERE day=? AND completed=1) completed,
      (SELECT COUNT(*) FROM habits WHERE archived=0 AND date(created_at)<=date(?)) total`,[day,day]);
    const completed=locked?0:row?.completed??0,total=locked?0:row?.total??0;
    result.push({day,completed,total,percent:total?Math.round(completed/total*100):0,locked});
  }
  return result;
}
export async function weeklyWaterProgress() {
  const out:{day:string;total:number}[]=[];
  for(const {day} of rollingWeekDays()){out.push({day,total:await waterTotal(day)});}
  return out;
}
