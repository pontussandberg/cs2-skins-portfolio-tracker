import { DEFAULT_SORT, isSortBy, sortOf, type CsfloatQuery, type ListingType } from "./types";

export interface ParsedSearch {
  query: CsfloatQuery;
  seeds: number[];
  /** Params present in the URL that we don't map (shown to the user). */
  ignored: string[];
}

const INT_KEYS = ["def_index", "paint_index", "category", "min_price", "max_price", "rarity"] as const;
const FLOAT_KEYS = ["min_float", "max_float"] as const;
const STRING_KEYS = ["market_hash_name", "stickers", "collection", "filter"] as const;
const SKIP_KEYS = new Set(["limit", "cursor", "page"]);

/**
 * Parse a csfloat.com search URL (or a bare query string) into watch filters.
 * paint_seed may repeat or be comma-separated; each seed becomes one entry in `seeds`.
 */
export function parseCsfloatSearchUrl(input: string): ParsedSearch {
  const trimmed = input.trim();
  let search: string;
  try {
    search = new URL(trimmed).search;
  } catch {
    search = trimmed.includes("?") ? trimmed.slice(trimmed.indexOf("?")) : trimmed;
  }
  const params = new URLSearchParams(search);
  const query: CsfloatQuery = {};
  const seeds = new Set<number>();
  const ignored: string[] = [];

  for (const [key, raw] of params) {
    const value = raw.trim();
    if (!value) continue;
    if (key === "paint_seed") {
      for (const part of value.split(",")) {
        const n = Number.parseInt(part.trim(), 10);
        if (Number.isFinite(n)) seeds.add(n);
      }
    } else if ((INT_KEYS as readonly string[]).includes(key)) {
      const n = Number.parseInt(value, 10);
      if (Number.isFinite(n)) (query as Record<string, unknown>)[key] = n;
    } else if ((FLOAT_KEYS as readonly string[]).includes(key)) {
      const n = Number.parseFloat(value);
      if (Number.isFinite(n)) (query as Record<string, unknown>)[key] = n;
    } else if ((STRING_KEYS as readonly string[]).includes(key)) {
      (query as Record<string, unknown>)[key] = value;
    } else if (key === "type") {
      if (value === "buy_now" || value === "auction") query.type = value as ListingType;
    } else if (key === "sort_by") {
      // most_recent is the default, so it is stored as "no sort".
      if (!isSortBy(value)) ignored.push(`sort_by=${value}`);
      else if (value !== DEFAULT_SORT) query.sort_by = value;
    } else if (!SKIP_KEYS.has(key)) {
      ignored.push(key);
    }
  }

  return { query, seeds: [...seeds].sort((a, b) => a - b), ignored };
}

/** Parse a free-form seed list: "661, 670 321\n955" -> [321, 661, 670, 955]. */
export function parseSeedList(text: string): number[] {
  const seeds = new Set<number>();
  for (const part of text.split(/[\s,;]+/)) {
    if (!part) continue;
    const n = Number.parseInt(part, 10);
    if (Number.isFinite(n) && n >= 0 && n <= 100000) seeds.add(n);
  }
  return [...seeds].sort((a, b) => a - b);
}

/** Build a csfloat.com search URL for a watch (opens the same search in CSFloat's UI). */
export function buildCsfloatSearchUrl(query: CsfloatQuery, seed?: number | null): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === "") continue;
    params.set(k, String(v));
  }
  if (seed != null) params.set("paint_seed", String(seed));
  params.set("sort_by", sortOf(query));
  return `https://csfloat.com/search?${params.toString()}`;
}
