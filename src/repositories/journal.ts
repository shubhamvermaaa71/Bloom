import {database,id} from '../services/database';

export type JournalEntry={id:string;title:string;body:string;created_at:string;updated_at:string};

export async function entries():Promise<JournalEntry[]> {
  const d=await database();
  return d.getAllAsync<JournalEntry>('SELECT * FROM journal ORDER BY updated_at DESC');
}

export async function saveEntry(title:string,body:string,entryId?:string) {
  if(!title.trim()&&!body.trim()) throw new Error('Write something before saving');
  const d=await database(),now=new Date().toISOString();
  const savedTitle=title.trim()||'Untitled';
  if(entryId) {
    await d.runAsync('UPDATE journal SET title=?,body=?,updated_at=? WHERE id=?',[savedTitle,body,now,entryId]);
  } else {
    const key=id();
    await d.runAsync('INSERT INTO journal(id,title,body,created_at,updated_at) VALUES(?,?,?,?,?)',[key,savedTitle,body,now,now]);
    const {award}=await import('./habits');
    await award('journal',key,4);
    const {evaluateAchievements}=await import('../services/achievements');
    await evaluateAchievements();
  }
}

export async function deleteEntry(entryId:string) {
  const d=await database();
  await d.runAsync('DELETE FROM journal WHERE id=?',[entryId]);
}
