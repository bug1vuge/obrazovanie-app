import type { ID, Table } from '@/entities/types';

/** Immutable helpers for `Record<id, entity>` tables. */

export const values = <T extends { id: ID }>(table: Table<T>): T[] => Object.values(table);

export const upsert = <T extends { id: ID }>(table: Table<T>, ...items: T[]): Table<T> => {
  const next = { ...table };
  for (const item of items) next[item.id] = item;
  return next;
};

export const patch = <T extends { id: ID }>(
  table: Table<T>,
  id: ID,
  changes: Partial<Omit<T, 'id'>>,
): Table<T> => {
  const current = table[id];
  if (!current) return table;
  return { ...table, [id]: { ...current, ...changes } };
};

export const removeWhere = <T extends { id: ID }>(
  table: Table<T>,
  predicate: (item: T) => boolean,
): Table<T> => {
  const next: Table<T> = {};
  let changed = false;
  for (const [id, item] of Object.entries(table)) {
    if (predicate(item)) changed = true;
    else next[id] = item;
  }
  return changed ? next : table;
};
