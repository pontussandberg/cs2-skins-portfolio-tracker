import type { ListingSnap, SortBy, StickerSnap } from "./types";

/** Shape of a CSFloat listing as returned by /api/v1/listings (only fields we use). */
export interface ApiListing {
  id: string;
  created_at: string;
  type: string;
  price: number;
  state?: string;
  reference?: { base_price?: number | null; sticker_overpay?: { total_price?: number | null } | null } | null;
  item: {
    asset_id?: string | null;
    market_hash_name: string;
    paint_seed?: number | null;
    float_value?: number | null;
    low_rank?: number | null;
    high_rank?: number | null;
    icon_url?: string | null;
    inspect_link?: string | null;
    is_stattrak?: boolean | null;
    stickers?: (ApiSticker & { stickerId?: number | null })[] | null;
  };
}

/** A sticker or charm as CSFloat returns it on listings and inventory items. */
export interface ApiSticker {
  name?: string | null;
  icon_url?: string | null;
  slot?: number | null;
  wear?: number | null;
  reference?: { price?: number | null } | null;
}

/** Named stickers (or charms), in slot order. */
export function toStickerSnaps(list: ApiSticker[] | null | undefined): StickerSnap[] {
  return (list ?? [])
    .filter((s) => s.name)
    .map((s) => ({ name: s.name!, iconUrl: s.icon_url ?? null, slot: s.slot ?? null, wear: s.wear ?? null, price: s.reference?.price ?? null }))
    .sort((a, b) => (a.slot ?? 99) - (b.slot ?? 99));
}

export function toSnap(l: ApiListing): ListingSnap {
  return {
    id: String(l.id),
    assetId: l.item.asset_id ?? null,
    type: l.type,
    price: l.price,
    createdAt: l.created_at,
    name: l.item.market_hash_name,
    seed: l.item.paint_seed ?? null,
    float: l.item.float_value ?? null,
    lowRank: l.item.low_rank ?? null,
    highRank: l.item.high_rank ?? null,
    inspectLink: l.item.inspect_link ?? null,
    iconUrl: l.item.icon_url ?? null,
    stickers: (l.item.stickers ?? []).map((s) => s.name ?? "").filter(Boolean),
    stickerDetails: toStickerSnaps(l.item.stickers),
    basePrice: l.reference?.base_price ?? null,
    stickerValue: l.reference?.sticker_overpay?.total_price ?? null,
    stattrak: Boolean(l.item.is_stattrak),
  };
}

/** The fields sorting looks at, so client-side listing shapes can be sorted too. */
type Sortable = Pick<ListingSnap, "price" | "float" | "createdAt">;
type Compare = (a: Sortable, b: Sortable) => number;

const byCreatedDesc: Compare = (a, b) => (b.createdAt < a.createdAt ? -1 : b.createdAt > a.createdAt ? 1 : 0);
/** Nulls always sort last. */
const byNumber =
  (pick: (l: Sortable) => number | null, dir: 1 | -1): Compare =>
  (a, b) => {
    const x = pick(a);
    const y = pick(b);
    if (x === null || y === null) return x === y ? 0 : x === null ? 1 : -1;
    return (x - y) * dir;
  };

// best_deal / highest_discount depend on reference prices we don't store: keep CSFloat's order.
const COMPARE: Partial<Record<SortBy, Compare>> = {
  most_recent: byCreatedDesc,
  lowest_price: byNumber((l) => l.price, 1),
  highest_price: byNumber((l) => l.price, -1),
  lowest_float: byNumber((l) => l.float, 1),
  highest_float: byNumber((l) => l.float, -1),
};

/** Sorts sortListings can reproduce locally (the others need CSFloat's reference prices). */
export const LOCAL_SORTS = Object.keys(COMPARE) as SortBy[];

/** Order listings the way the watch's sort_by does (stable; unknown sorts keep input order). */
export function sortListings<T extends Sortable>(items: T[], sort: SortBy): T[] {
  const compare = COMPARE[sort];
  return compare ? [...items].sort(compare) : [...items];
}

/**
 * CSFloat's sticker percentage ("SP"): what share of the stickers' reference value the price asks
 * on top of the item's own reference price. 20 = paying 20% of the sticker value extra.
 * Null without a base price or priced stickers (e.g. snapshots saved before prices were tracked).
 */
export function stickerPercent(l: Pick<ListingSnap, "price" | "basePrice" | "stickerValue" | "stickerDetails">): number | null {
  if (l.basePrice == null) return null;
  // CSFloat's own sticker total when it sent one, else the sum of the stickers' reference prices.
  const stickerValue = l.stickerValue ?? (l.stickerDetails ?? []).reduce((sum, s) => sum + (s.price ?? 0), 0);
  if (stickerValue <= 0) return null;
  return ((l.price - l.basePrice) / stickerValue) * 100;
}

/** Sticker details for display; older snapshots only have names. */
export function stickersOf(l: Pick<ListingSnap, "stickers" | "stickerDetails">): StickerSnap[] {
  return l.stickerDetails ?? l.stickers.map((name) => ({ name, iconUrl: null, slot: null, wear: null }));
}
