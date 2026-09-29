import { z } from "zod";
import type { ApiListing } from "@/core/listing";
import type { ApiInventoryItem } from "@/core/portfolio";

// Lenient: we validate only the fields we use, so unrelated API additions don't break runs,
// but a changed shape for these fields fails the run loudly instead of diffing garbage.

/** Stickers and charms, on listings and inventory items. */
const ApiStickerSchema = z.object({
  name: z.string().nullish(),
  icon_url: z.string().nullish(),
  slot: z.number().nullish(),
  wear: z.number().nullish(),
  reference: z.object({ price: z.number().nullish() }).nullish(),
});

const ApiListingSchema = z.object({
  id: z.coerce.string(),
  created_at: z.string(),
  type: z.string(),
  price: z.number(),
  state: z.string().optional(),
  reference: z
    .object({
      base_price: z.number().nullish(),
      sticker_overpay: z.object({ total_price: z.number().nullish() }).nullish(),
    })
    .nullish(),
  item: z.object({
    asset_id: z.coerce.string().nullish(),
    market_hash_name: z.string(),
    paint_seed: z.number().nullish(),
    float_value: z.number().nullish(),
    low_rank: z.number().int().nullish(),
    high_rank: z.number().int().nullish(),
    icon_url: z.string().nullish(),
    inspect_link: z.string().nullish(),
    is_stattrak: z.boolean().nullish(),
    stickers: z.array(ApiStickerSchema.extend({ stickerId: z.number().nullish() })).nullish(),
  }),
});

const WrappedSchema = z.object({
  data: z.array(ApiListingSchema),
  cursor: z.string().nullish(),
});

/** CSFloat has returned both a bare array and `{ data, cursor }`; accept either. */
export function parseListingsResponse(json: unknown): { listings: ApiListing[]; cursor: string | null } {
  if (Array.isArray(json)) {
    const listings = z.array(ApiListingSchema).parse(json);
    return { listings: listings as ApiListing[], cursor: null };
  }
  const parsed = WrappedSchema.parse(json);
  return { listings: parsed.data as ApiListing[], cursor: parsed.cursor ?? null };
}

const ApiInventoryItemSchema = z.object({
  asset_id: z.coerce.string(),
  market_hash_name: z.string(),
  type: z.string().nullish(),
  icon_url: z.string().nullish(),
  paint_seed: z.number().nullish(),
  float_value: z.number().nullish(),
  low_rank: z.number().int().nullish(),
  high_rank: z.number().int().nullish(),
  is_stattrak: z.boolean().nullish(),
  is_souvenir: z.boolean().nullish(),
  tradable: z.union([z.number(), z.boolean()]).nullish(),
  serialized_inspect: z.string().nullish(),
  listing_id: z.coerce.string().nullish(),
  stickers: z.array(ApiStickerSchema).nullish(),
  keychains: z.array(ApiStickerSchema).nullish(),
  reference: z.object({ base_price: z.number().nullish(), predicted_price: z.number().nullish() }).nullish(),
});

/** GET /me/inventory: a bare array (accepts `{ data }` too, like listings). */
export function parseInventoryResponse(json: unknown): ApiInventoryItem[] {
  const list = Array.isArray(json) ? json : z.object({ data: z.array(z.unknown()) }).parse(json).data;
  return z.array(ApiInventoryItemSchema).parse(list) as ApiInventoryItem[];
}
