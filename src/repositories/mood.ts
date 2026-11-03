import {database,todayKey} from '../services/database';
export async function getMood(day=todayKey()){const d=await database();return d.getFirstAsync<{mood:string;reflection:string}>('SELECT mood,reflection FROM moods WHERE day=?',[day]);}
export async function saveMood(mood:string,reflection=''){const d=await database();await d.runAsync('INSERT INTO moods(day,mood,reflection) VALUES(?,?,?) ON CONFLICT(day) DO UPDATE SET mood=excluded.mood,reflection=excluded.reflection',[todayKey(),mood,reflection]);}
export async function moodHistory(limit=14){const d=await database();return d.getAllAsync<{day:string;mood:string;reflection:string}>('SELECT day,mood,reflection FROM moods ORDER BY day DESC LIMIT ?',[limit]);}
