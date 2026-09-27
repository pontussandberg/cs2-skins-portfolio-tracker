import type { ListingSnap } from "./types";

/** Shape of a CSFloat listing as returned by /api/v1/listings (only fields we use). */
export interface ApiListing {
  id: string;
  created_at: string;
  type: string;
  price: number;
  state?: string;
  item: {
    asset_id?: string | null;
    market_hash_name: string;
    paint_seed?: number | null;
    float_value?: number | null;
    icon_url?: string | null;
    inspect_link?: string | null;
    is_stattrak?: boolean | null;
    stickers?: { name?: string | null }[] | null;
  };
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
    inspectLink: l.item.inspect_link ?? null,
    iconUrl: l.item.icon_url ?? null,
    stickers: (l.item.stickers ?? []).map((s) => s.name ?? "").filter(Boolean),
    stattrak: Boolean(l.item.is_stattrak),
  };
}
