import { baseItemName, describeStickers, parseStickerFilter, sortLabel, stickerLabel } from "@/core/format";
import type { ApiListing } from "@/core/listing";
import { DEFAULT_SORT, type CsfloatQuery } from "@/core/types";

type Fetch = (params: Record<string, string | number>) => Promise<{ listings: ApiListing[] }>;

/** Sticker id -> label for every sticker on a listing. */
function stickerNames(listing: ApiListing | undefined): Map<number, string> {
  const names = new Map<number, string>();
  for (const s of listing?.item.stickers ?? []) {
    if (s.stickerId != null && s.name) names.set(s.stickerId, stickerLabel(s.name));
  }
  return names;
}

/**
 * Human name for a search: the item ("★ Bayonet | Night"), its sticker filter, or both.
 * Makes at most one CSFloat request. Null when there is nothing to name it by.
 */
export async function lookupSearchName(fetchListings: Fetch, query: Pick<CsfloatQuery, "def_index" | "paint_index" | "market_hash_name" | "stickers">): Promise<string | null> {
  const stickers = query.stickers && parseStickerFilter(query.stickers) ? query.stickers : null;
  const knownItem = query.market_hash_name ? baseItemName(query.market_hash_name) : null;
  const hasItemIds = query.def_index != null || query.paint_index != null;
  if (knownItem && !stickers) return knownItem;
  if (!hasItemIds && !stickers) return null;

  // Only identity filters: price/float limits would just make an empty page more likely.
  const params: Record<string, string | number> = { sort_by: DEFAULT_SORT, limit: 1 };
  if (query.market_hash_name) params.market_hash_name = query.market_hash_name;
  if (query.def_index != null) params.def_index = query.def_index;
  if (query.paint_index != null) params.paint_index = query.paint_index;
  if (query.stickers) params.stickers = query.stickers;
  const first = (await fetchListings(params)).listings[0];

  const item = knownItem ?? (hasItemIds && first ? baseItemName(first.item.market_hash_name) : null);
  const parts = [item, stickers ? describeStickers(stickers, stickerNames(first)) : null].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

/**
 * Watch name from its search: "★ Bayonet | Night · Lowest float · 3 seeds". `item` is the result of
 * lookupSearchName; without it, fall back to the sticker filter, collection or raw ids.
 */
export function composeWatchName(item: string | null, query: CsfloatQuery, seedCount: number): string {
  const ids = [query.def_index != null ? `def ${query.def_index}` : "", query.paint_index != null ? `paint ${query.paint_index}` : ""].filter(Boolean).join(" / ");
  const parts = [item ?? ((query.stickers ? describeStickers(query.stickers) : "") || query.collection || ids || "CSFloat search")];
  const sort = sortLabel(query.sort_by);
  if (sort) parts.push(sort);
  if (seedCount) parts.push(`${seedCount} seed${seedCount === 1 ? "" : "s"}`);
  return parts.join(" · ").slice(0, 80);
}
