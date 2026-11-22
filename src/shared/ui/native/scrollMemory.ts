/** Remembers scroll offsets of screens by history entry, restored on «Назад». */
const positions = new Map<string, number>();

export const rememberScroll = (key: string, top: number) => {
  positions.set(key, top);
  if (positions.size > 100) positions.delete(positions.keys().next().value as string);
};
export const recallScroll = (key: string) => positions.get(key) ?? 0;
