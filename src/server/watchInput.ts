import { z } from "zod";
import { CSFLOAT_QUERY_KEYS, type CsfloatQuery } from "@/core/types";

const QuerySchema = z
  .object({
    def_index: z.number().int().min(0).nullish(),
    paint_index: z.number().int().min(0).nullish(),
    market_hash_name: z.string().trim().max(200).nullish(),
    min_float: z.number().min(0).max(1).nullish(),
    max_float: z.number().min(0).max(1).nullish(),
    category: z.number().int().min(0).max(3).nullish(),
    min_price: z.number().int().min(0).nullish(),
    max_price: z.number().int().min(0).nullish(),
    type: z.enum(["buy_now", "auction"]).nullish(),
    stickers: z.string().trim().max(500).nullish(),
    collection: z.string().trim().max(100).nullish(),
    rarity: z.number().int().min(0).max(10).nullish(),
  })
  .refine((q) => q.def_index != null || q.paint_index != null || Boolean(q.market_hash_name) || Boolean(q.collection), {
    message: "Set at least one of def_index, paint_index, market_hash_name or collection",
  })
  .refine((q) => q.min_float == null || q.max_float == null || q.min_float <= q.max_float, {
    message: "min_float must be <= max_float",
  })
  .refine((q) => q.min_price == null || q.max_price == null || q.min_price <= q.max_price, {
    message: "min_price must be <= max_price",
  });

export const WatchInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  query: QuerySchema,
  seeds: z.array(z.number().int().min(0).max(100000)).max(500).nullish(),
  schedule: z.string().trim().max(100).nullish(),
  maxPages: z.number().int().min(1).max(20).nullish(),
  enabled: z.boolean().nullish(),
  notify: z.boolean().nullish(),
});

export type WatchInput = z.input<typeof WatchInputSchema>;

export interface NormalizedWatchInput {
  name: string;
  query: CsfloatQuery;
  seeds: number[];
  schedule: string | null;
  maxPages: number;
  enabled: boolean;
  notify: boolean;
}

export class WatchInputError extends Error {
  constructor(public issues: string[]) {
    super(issues.join("; "));
    this.name = "WatchInputError";
  }
}

/** Validate + normalise user input. `validateCron` returns an error message or null. */
export function normalizeWatchInput(raw: unknown, validateCron: (expr: string) => string | null): NormalizedWatchInput {
  const parsed = WatchInputSchema.safeParse(raw);
  if (!parsed.success) {
    throw new WatchInputError(parsed.error.issues.map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message)));
  }
  const input = parsed.data;
  const query: CsfloatQuery = {};
  for (const key of CSFLOAT_QUERY_KEYS) {
    const v = input.query[key];
    if (v !== undefined && v !== null && v !== "") (query as Record<string, unknown>)[key] = v;
  }
  const schedule = input.schedule ? input.schedule : null;
  if (schedule) {
    const err = validateCron(schedule);
    if (err) throw new WatchInputError([`schedule: ${err}`]);
  }
  return {
    name: input.name,
    query,
    seeds: [...new Set(input.seeds ?? [])].sort((a, b) => a - b),
    schedule,
    maxPages: input.maxPages ?? 3,
    enabled: input.enabled ?? true,
    notify: input.notify ?? true,
  };
}
