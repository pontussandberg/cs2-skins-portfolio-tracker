import { CSFLOAT_QUERY_PARAMS, DEFAULT_SORT, isSortBy, sortOf, type CsfloatQuery, type ListingType } from "./types";

export interface ParsedSearch {
  query: CsfloatQuery;
  seeds: number[];
  /** Params present in the URL that we don't map (shown to the user). */
  ignored: string[];
}

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
      continue;
    }
    const kind = Object.hasOwn(CSFLOAT_QUERY_PARAMS, key) ? CSFLOAT_QUERY_PARAMS[key as keyof CsfloatQuery] : null;
    const set = (v: unknown) => ((query as Record<string, unknown>)[key] = v);
    if (kind === "int" || kind === "float") {
      const n = kind === "int" ? Number.parseInt(value, 10) : Number.parseFloat(value);
      if (Number.isFinite(n)) set(n);
    } else if (kind === "string") {
      set(value);
    } else if (kind === "listingType") {
      if (value === "buy_now" || value === "auction") query.type = value as ListingType;
    } else if (kind === "sort") {
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
