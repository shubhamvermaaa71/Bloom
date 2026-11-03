import { database } from '../services/database';
export async function getSetting(key:string):Promise<string|null>{
 const d=await database(); const row=await d.getFirstAsync<{value:string}>('SELECT value FROM settings WHERE key=?',[key]); return row?.value ?? null;
}
export async function setSetting(key:string,value:string){const d=await database();await d.runAsync('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',[key,value]);}
export async function allSettings(){const d=await database();return d.getAllAsync<{key:string,value:string}>('SELECT key,value FROM settings');}
