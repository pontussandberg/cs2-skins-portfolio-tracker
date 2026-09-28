/**
 * Put `ids` first, in that order; everything else keeps its current order after them.
 * Unknown ids are ignored. Shared by the dashboard (optimistic order) and the store (saved order).
 */
export function applyOrder<T extends { id: string }>(items: readonly T[], ids: readonly string[]): T[] {
  const rank = new Map(ids.map((id, i) => [id, i]));
  return [...items].sort((a, b) => (rank.get(a.id) ?? ids.length) - (rank.get(b.id) ?? ids.length));
}
