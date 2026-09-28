import { z } from "zod";
import type { ApiListing } from "@/core/listing";

// Lenient: we validate only the fields we use, so unrelated API additions don't break runs,
// but a changed shape for these fields fails the run loudly instead of diffing garbage.
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
    stickers: z
      .array(
        z.object({
          stickerId: z.number().nullish(),
          name: z.string().nullish(),
          icon_url: z.string().nullish(),
          slot: z.number().nullish(),
          wear: z.number().nullish(),
          reference: z.object({ price: z.number().nullish() }).nullish(),
        }),
      )
      .nullish(),
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
