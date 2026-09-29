import { z } from "zod";
import { CSFLOAT_QUERY_KEYS, CSFLOAT_SORTS, DEFAULT_SORT, type CsfloatQuery } from "@/core/types";

/** Paired bounds that must not cross. */
const RANGES = [
  ["min_float", "max_float"],
  ["min_blue", "max_blue"],
  ["min_fade", "max_fade"],
  ["min_price", "max_price"],
] as const;

const QueryShape = {
    def_index: z.number().int().min(0).nullish(),
    paint_index: z.number().int().min(0).nullish(),
    market_hash_name: z.string().trim().max(200).nullish(),
    min_float: z.number().min(0).max(1).nullish(),
    max_float: z.number().min(0).max(1).nullish(),
    min_blue: z.number().min(0).max(100).nullish(),
    max_blue: z.number().min(0).max(100).nullish(),
    min_fade: z.number().min(0).max(100).nullish(),
    max_fade: z.number().min(0).max(100).nullish(),
    category: z.number().int().min(0).max(3).nullish(),
    min_price: z.number().int().min(0).nullish(),
    max_price: z.number().int().min(0).nullish(),
    type: z.enum(["buy_now", "auction"]).nullish(),
    stickers: z.string().trim().max(500).nullish(),
    keychains: z.string().trim().max(500).nullish(),
    collection: z.string().trim().max(100).nullish(),
    rarity: z.number().int().min(0).max(10).nullish(),
    filter: z.string().trim().max(50).nullish(),
    // most_recent is the default, so it is stored as "no sort".
    sort_by: z
      .enum(CSFLOAT_SORTS)
      .nullish()
      .transform((v) => (v === DEFAULT_SORT ? null : v)),
} satisfies Record<keyof CsfloatQuery, z.ZodType>;

const QuerySchema = z
  .object(QueryShape)
  .refine((q) => q.def_index != null || q.paint_index != null || Boolean(q.market_hash_name) || Boolean(q.collection) || Boolean(q.stickers) || Boolean(q.keychains) || Boolean(q.filter), {
    message: "Set at least one of def_index, paint_index, market_hash_name, collection, stickers, charms or filter",
  })
  .superRefine((q, ctx) => {
    for (const [min, max] of RANGES) {
      const lo = q[min];
      const hi = q[max];
      if (lo != null && hi != null && lo > hi) ctx.addIssue({ code: "custom", message: `${min} must be <= ${max}` });
    }
  });

export const WatchInputSchema = z.object({
  /** Empty = generate one from the search (see composeWatchName). */
  name: z.string().trim().max(80).nullish(),
  query: QuerySchema,
  seeds: z.array(z.number().int().min(0).max(100000)).max(500).nullish(),
  schedule: z.string().trim().max(100).nullish(),
  maxPages: z.number().int().min(1).max(20).nullish(),
  enabled: z.boolean().nullish(),
  notify: z.boolean().nullish(),
});

export type WatchInput = z.input<typeof WatchInputSchema>;

export interface NormalizedWatchInput {
  /** Null when the caller left it empty. */
  name: string | null;
  query: CsfloatQuery;
  seeds: number[];
  schedule: string | null;
  maxPages: number;
  enabled: boolean;
  notify: boolean;
}

/** Invalid user input; resolvers turn it into a BAD_USER_INPUT error listing the issues. */
export class InputError extends Error {
  constructor(public issues: string[]) {
    super(issues.join("; "));
    this.name = "InputError";
  }
}

/** Parse with `schema`, throwing an InputError with one issue per invalid field. */
export function parseInput<T extends z.ZodType>(schema: T, raw: unknown): z.output<T> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new InputError(parsed.error.issues.map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message)));
  }
  return parsed.data;
}

/** Validate + normalise user input. `validateCron` returns an error message or null. */
export function normalizeWatchInput(raw: unknown, validateCron: (expr: string) => string | null): NormalizedWatchInput {
  const input = parseInput(WatchInputSchema, raw);
  const query: CsfloatQuery = {};
  for (const key of CSFLOAT_QUERY_KEYS) {
    const v = input.query[key];
    if (v !== undefined && v !== null && v !== "") (query as Record<string, unknown>)[key] = v;
  }
  const schedule = input.schedule ? input.schedule : null;
  if (schedule) {
    const err = validateCron(schedule);
    if (err) throw new InputError([`schedule: ${err}`]);
  }
  return {
    name: input.name || null,
    query,
    seeds: [...new Set(input.seeds ?? [])].sort((a, b) => a - b),
    schedule,
    maxPages: input.maxPages ?? 3,
    enabled: input.enabled ?? true,
    notify: input.notify ?? true,
  };
}
