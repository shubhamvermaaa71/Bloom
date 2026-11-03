export type SortableHabit={id:string;completed:boolean};
export function homeHabits<T extends SortableHabit>(habits:T[],limit=3):T[] {
  const incomplete=habits.filter(h=>!h.completed),complete=habits.filter(h=>h.completed);
  const seen=new Set<string>();
  return [...incomplete,...complete].filter(h=>!seen.has(h.id)&&!!seen.add(h.id)).slice(0,Math.max(0,limit));
}
