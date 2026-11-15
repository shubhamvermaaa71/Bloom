import {database,todayKey} from './database';
import {waterTotal} from '../repositories/water';
import {listHabits} from '../repositories/habits';
import {listSteps} from '../repositories/skincare';
import {entries} from '../repositories/journal';
import {getSetting} from '../repositories/settings';

const definitions = [
  {key:'first_step',title:'First Step',description:'Complete your first habit.',icon:'footsteps-outline'},
  {key:'growing_daily',title:'Growing Daily',description:'Complete three habits in one day.',icon:'leaf-outline'},
  {key:'hydrated',title:'Hydrated',description:'Reach your daily water goal.',icon:'water-outline'},
  {key:'self_care_star',title:'Self-Care Star',description:'Complete three skincare steps in one day.',icon:'sparkles-outline'},
  {key:'reflective_soul',title:'Reflective Soul',description:'Write two journal entries.',icon:'book-outline'},
  {key:'blooming',title:'Blooming',description:'Earn 100 growth points in your garden.',icon:'flower-outline'},
  {key:'hydration_rhythm',title:'Hydration Rhythm',description:'Reach your water goal on three different days.',icon:'water-outline'},
  {key:'radiant_garden',title:'Radiant Garden',description:'Earn 150 growth points in your garden.',icon:'sparkles-outline'},
  {key:'garden_abundance',title:'Garden of Abundance',description:'Earn 250 growth points in your garden.',icon:'flower-outline'}
];
export async function evaluateAchievements() {
  const d=await database(),day=todayKey(),earned=new Set<string>();
  const all=await d.getFirstAsync<{n:number}>('SELECT COUNT(*) n FROM habit_logs WHERE completed=1');
  if((all?.n??0)>0) earned.add('first_step');
  const habits=await listHabits(day); if(habits.filter(h=>h.completed).length>=3) earned.add('growing_daily');
  const goal=Number(await getSetting('waterGoal')||2000); if(await waterTotal(day)>=goal) earned.add('hydrated');
  const hydratedDays=await d.getFirstAsync<{n:number}>('SELECT COUNT(*) n FROM (SELECT day FROM water_logs GROUP BY day HAVING SUM(amount)>=?)',[goal]);
  if((hydratedDays?.n??0)>=3) earned.add('hydration_rhythm');
  const steps=await listSteps(); if(steps.filter(s=>s.completed).length>=3) earned.add('self_care_star');
  if((await entries()).length>1) earned.add('reflective_soul');
  const pts=await d.getFirstAsync<{n:number}>('SELECT COALESCE(SUM(points),0) n FROM garden_events');
  if((pts?.n??0)>=100) earned.add('blooming');
  if((pts?.n??0)>=150) earned.add('radiant_garden');
  if((pts?.n??0)>=250) earned.add('garden_abundance');
  for(const key of earned) await d.runAsync('INSERT OR IGNORE INTO achievements(key,unlocked_at) VALUES(?,?)',[key,new Date().toISOString()]);
}
export async function achievementList() {
  const d=await database(),day=todayKey(); const rows=await d.getAllAsync<{key:string;unlocked_at:string}>('SELECT key,unlocked_at FROM achievements');
  const map=new Map(rows.map(r=>[r.key,r.unlocked_at]));
  const habitCount=(await d.getFirstAsync<{n:number}>('SELECT COUNT(*) n FROM habit_logs WHERE completed=1'))?.n??0;
  const todayHabits=(await listHabits(day)).filter(habit=>habit.completed).length;
  const goal=Number(await getSetting('waterGoal')||2000);
  const water=await waterTotal(day);
  const hydratedDays=(await d.getFirstAsync<{n:number}>('SELECT COUNT(*) n FROM (SELECT day FROM water_logs GROUP BY day HAVING SUM(amount)>=?)',[goal]))?.n??0;
  const skincare=(await listSteps()).filter(step=>step.completed).length;
  const journal=(await entries()).length;
  const points=(await d.getFirstAsync<{n:number}>('SELECT COALESCE(SUM(points),0) n FROM garden_events'))?.n??0;
  const progress:Record<string,{current:number;target:number}>={
    first_step:{current:habitCount,target:1},
    growing_daily:{current:todayHabits,target:3},
    hydrated:{current:water,target:goal},
    self_care_star:{current:skincare,target:3},
    reflective_soul:{current:journal,target:2},
    blooming:{current:points,target:100},
    hydration_rhythm:{current:hydratedDays,target:3},
    radiant_garden:{current:points,target:150},
    garden_abundance:{current:points,target:250}
  };
  return definitions.map(item=>({...item,...progress[item.key],unlocked:map.has(item.key),unlockedAt:map.get(item.key)??null}));
}
