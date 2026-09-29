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

/** CSFloat's full-size in-game screenshots of both sides of an item (~600 KB PNGs). */
export function screenshotUrls(id: string): { playside: string; backside: string } {
  const base = `https://csfloat.pics/m/${encodeURIComponent(id)}`;
  return { playside: `${base}/playside.png`, backside: `${base}/backside.png` };
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

/** CSFloat search presets (`filter=`) we have a label for; others show their raw value. */
export const FILTER_LABELS: Record<string, string> = {
  sticker_combos: "Sticker combos",
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

/** Sticker percentage as CSFloat labels it: "12% SP". */
export function formatStickerPercent(percent: number): string {
  return `${Math.round(percent)}% SP`;
}

/** "Sticker | Titan (Foil) | Cologne 2015" -> "Titan (Foil) | Cologne 2015". */
export function stickerLabel(name: string): string {
  return name.replace(/^Sticker \| /, "");
}

/** "26% scraped", or null for a pristine (or unknown) sticker. */
export function formatScrape(wear: number | null | undefined): string | null {
  return wear ? `${Math.round(wear * 100)}% scraped` : null;
}

/**
 * "4× Titan (Foil) | Cologne 2015 + sticker 5021": the filter's stickers (or charms, with
 * `noun` "charm"), counted, using `names` (id -> label) where known and the raw id otherwise.
 * "Stickers" / "Charms" for a filter we can't read.
 */
export function describeStickers(text: string, names?: ReadonlyMap<number, string>, noun: "sticker" | "charm" = "sticker"): string {
  const stickers = parseStickerFilter(text);
  if (!stickers) return noun === "charm" ? "Charms" : "Stickers";
  const counts = new Map<number, number>();
  for (const s of stickers) counts.set(s.id, (counts.get(s.id) ?? 0) + 1);
  return [...counts].map(([id, n]) => `${n > 1 ? `${n}× ` : ""}${names?.get(id) ?? `${noun} ${id}`}`).join(" + ");
}

/** "Charm | Titeenium AWP" -> "Titeenium AWP". */
export function charmLabel(name: string): string {
  return name.replace(/^Charm \| /, "");
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
  const float = describeRange("Float", q.min_float, q.max_float, floatText);
  if (float) out.push(float);
  if (q.min_price != null && q.max_price != null) out.push(`${formatPrice(q.min_price)}–${formatPrice(q.max_price)}`);
  else if (q.min_price != null) out.push(`≥ ${formatPrice(q.min_price)}`);
  else if (q.max_price != null) out.push(`≤ ${formatPrice(q.max_price)}`);
  if (q.category) out.push(CATEGORY_LABELS[q.category] ?? `Category ${q.category}`);
  if (q.type) out.push(q.type === "buy_now" ? "Buy now" : "Auctions");
  // Counts only: sticker and charm ids mean nothing on their own, and the watch name carries the names.
  if (q.stickers) out.push(countAttachments(q.stickers, "sticker"));
  if (q.keychains) out.push(countAttachments(q.keychains, "charm"));
  for (const range of [describeRange("Blue", q.min_blue, q.max_blue, formatPercent), describeRange("Fade", q.min_fade, q.max_fade, formatPercent)]) {
    if (range) out.push(range);
  }
  if (q.collection) out.push(q.collection);
  if (q.rarity != null) out.push(`Rarity ${q.rarity}`);
  if (q.filter) out.push(FILTER_LABELS[q.filter] ?? q.filter);
  return out;
}

/** "Blue 50%–80%", "Float ≥ 0.1", "Blue ≤ 10%", or null when neither bound is set. */
function describeRange(label: string, min: number | null | undefined, max: number | null | undefined, format: (n: number) => string): string | null {
  if (min != null && max != null) return `${label} ${format(min)}–${format(max)}`;
  if (min != null) return `${label} ≥ ${format(min)}`;
  if (max != null) return `${label} ≤ ${format(max)}`;
  return null;
}

/** "3 stickers", "1 charm", or "Stickers" / "Charms" for a filter we can't read. */
function countAttachments(text: string, noun: "sticker" | "charm"): string {
  const n = parseStickerFilter(text)?.length;
  return n ? `${n} ${noun}${n === 1 ? "" : "s"}` : noun === "charm" ? "Charms" : "Stickers";
}

/** "15%", "12.5%": at most one decimal. */
export function formatPercent(percent: number): string {
  return `${Number(percent.toFixed(1))}%`;
}

const sign = (n: number) => (n >= 0 ? "+" : "−");

/** "+$12.00" / "−$3.50". */
export function formatSignedPrice(cents: number): string {
  return `${sign(cents)}${formatPrice(Math.abs(cents))}`;
}

/** "+4.2%" / "−10%". */
export function formatSignedPercent(percent: number): string {
  return `${sign(percent)}${formatPercent(Math.abs(percent))}`;
}

/** Value as a multiple of market: "1.4×", "12×". */
export function formatMultiple(ratio: number): string {
  return `${ratio >= 10 ? Math.round(ratio) : Number(ratio.toFixed(1))}×`;
}

/** "29 Sep 2026, 01:25" in the local time zone. */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

/** A snapshot's name and date; just the date when it has no name. */
export function snapshotTitle(s: { label: string | null; takenAt: string }): string {
  const date = formatDateTime(s.takenAt);
  return s.label ? `${s.label} · ${date}` : date;
}
