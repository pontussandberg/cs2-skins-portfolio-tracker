// Small formatting helpers shared by UI, Discord and CLI. Dependency-free.
import { DEFAULT_SORT, type CsfloatQuery, type SortBy } from "./types";

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatFloat(value: number | null | undefined, digits = 6): string {
  return value == null ? "-" : value.toFixed(digits);
}

/** "#32 low", "#5 high", both joined, or null when the item is unranked. */
export function formatFloatRank(l: { lowRank?: number | null; highRank?: number | null }): string | null {
  const parts = [];
  if (l.lowRank != null) parts.push(`#${l.lowRank} low`);
  if (l.highRank != null) parts.push(`#${l.highRank} high`);
  return parts.length ? parts.join(" · ") : null;
}

export function listingUrl(id: string): string {
  return `https://csfloat.com/item/${id}`;
}

export function iconUrl(raw: string | null | undefined, size = 256): string | null {
  if (!raw) return null;
  if (/^https?:\/\//.test(raw)) return raw;
  return `https://community.cloudflare.steamstatic.com/economy/image/${raw}/${size}fx${size}f`;
}

export function timeAgo(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) return "never";
  const diff = Math.round((now.getTime() - new Date(iso).getTime()) / 1000);
  if (diff < 0) {
    const ahead = -diff;
    if (ahead < 60) return `in ${ahead}s`;
    if (ahead < 3600) return `in ${Math.round(ahead / 60)} min`;
    if (ahead < 86400) return `in ${Math.round(ahead / 3600)} h`;
    return `in ${Math.round(ahead / 86400)} d`;
  }
  if (diff < 45) return "just now";
  if (diff < 3600) return `${Math.max(1, Math.round(diff / 60))} min ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)} h ago`;
  return `${Math.round(diff / 86400)} d ago`;
}

export const SCHEDULE_PRESETS: { label: string; value: string | null }[] = [
  { label: "Manual only", value: null },
  { label: "Every 5 min", value: "*/5 * * * *" },
  { label: "Every 15 min", value: "*/15 * * * *" },
  { label: "Every 30 min", value: "*/30 * * * *" },
  { label: "Hourly", value: "0 * * * *" },
  { label: "Every 6 hours", value: "0 */6 * * *" },
];

export function describeSchedule(schedule: string | null): string {
  if (!schedule) return "Manual";
  return SCHEDULE_PRESETS.find((p) => p.value === schedule)?.label ?? schedule;
}

export const CATEGORY_LABELS: Record<number, string> = {
  0: "Any",
  1: "Normal",
  2: "StatTrak",
  3: "Souvenir",
};

export const SORT_LABELS: Record<SortBy, string> = {
  most_recent: "Newest",
  lowest_price: "Lowest price",
  highest_price: "Highest price",
  lowest_float: "Lowest float",
  highest_float: "Highest float",
  best_deal: "Best deal",
  highest_discount: "Highest discount",
};

/** "★ StatTrak™ Bayonet | Night (Field-Tested)" -> "★ Bayonet | Night". Wear and category are filters of their own. */
export function baseItemName(marketHashName: string): string {
  return marketHashName
    .replace(/\s*\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)\s*$/, "")
    .replace(/StatTrak™\s*/, "")
    .replace(/^Souvenir\s+/, "")
    .trim();
}

/**
 * CSFloat's sticker filter as it appears in search URLs: `[{"i":663},{"i":663,"s":2}]`
 * (i = sticker id, s = optional slot). Null when the text isn't that format.
 */
export function parseStickerFilter(text: string | null | undefined): { id: number; slot: number | null }[] | null {
  if (!text) return null;
  try {
    const parsed: unknown = JSON.parse(text);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    const out = [];
    for (const entry of parsed) {
      const id = (entry as { i?: unknown })?.i;
      const slot = (entry as { s?: unknown })?.s;
      if (typeof id !== "number") return null;
      out.push({ id, slot: typeof slot === "number" ? slot : null });
    }
    return out;
  } catch {
    return null;
  }
}

/** "Sticker | Titan (Foil) | Cologne 2015" -> "Titan (Foil) | Cologne 2015". */
export function stickerLabel(name: string): string {
  return name.replace(/^Sticker \| /, "");
}

/**
 * "4× Titan (Foil) | Cologne 2015 + sticker 5021": the filter's stickers, counted, using `names`
 * (sticker id -> label) where known and the raw id otherwise. "Stickers" for a filter we can't read.
 */
export function describeStickers(text: string, names?: ReadonlyMap<number, string>): string {
  const stickers = parseStickerFilter(text);
  if (!stickers) return "Stickers";
  const counts = new Map<number, number>();
  for (const s of stickers) counts.set(s.id, (counts.get(s.id) ?? 0) + 1);
  return [...counts].map(([id, n]) => `${n > 1 ? `${n}× ` : ""}${names?.get(id) ?? `sticker ${id}`}`).join(" + ");
}

const floatText = (v: number) => String(Number(v.toFixed(6)));

/** Label for a non-default sort ("Lowest float"), or null for newest-first. */
export function sortLabel(sort: SortBy | null | undefined): string | null {
  return sort && sort !== DEFAULT_SORT ? SORT_LABELS[sort] : null;
}

/** CsfloatQuery as GraphQL returns it (`type` is a plain string there). */
type QueryLike = Omit<CsfloatQuery, "type"> & { type?: string | null };

/** Short labels for a watch's filters and sort, e.g. ["Lowest float", "Float ≤ 0.07", "StatTrak"]. */
export function describeQuery(q: QueryLike): string[] {
  const out: string[] = [];
  const sort = sortLabel(q.sort_by);
  if (sort) out.push(sort);
  if (q.min_float != null && q.max_float != null) out.push(`Float ${floatText(q.min_float)}–${floatText(q.max_float)}`);
  else if (q.min_float != null) out.push(`Float ≥ ${floatText(q.min_float)}`);
  else if (q.max_float != null) out.push(`Float ≤ ${floatText(q.max_float)}`);
  if (q.min_price != null && q.max_price != null) out.push(`${formatPrice(q.min_price)}–${formatPrice(q.max_price)}`);
  else if (q.min_price != null) out.push(`≥ ${formatPrice(q.min_price)}`);
  else if (q.max_price != null) out.push(`≤ ${formatPrice(q.max_price)}`);
  if (q.category) out.push(CATEGORY_LABELS[q.category] ?? `Category ${q.category}`);
  if (q.type) out.push(q.type === "buy_now" ? "Buy now" : "Auctions");
  if (q.stickers) {
    // Count only: sticker ids mean nothing on their own, and the watch name carries the sticker names.
    const n = parseStickerFilter(q.stickers)?.length;
    out.push(n ? `${n} sticker${n === 1 ? "" : "s"}` : "Stickers");
  }
  if (q.collection) out.push(q.collection);
  if (q.rarity != null) out.push(`Rarity ${q.rarity}`);
  return out;
}
