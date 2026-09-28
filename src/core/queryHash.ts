// Server-only (uses node:crypto). Do not import from client components.
import { createHash } from "node:crypto";
import { CSFLOAT_QUERY_KEYS, sortOf, type CsfloatQuery, type SubQuery, type Watch } from "./types";

export const PAGE_LIMIT = 50;

/** JSON with sorted keys and null/undefined/"" dropped, so equal filters hash equally. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

/** Base request params for a watch query (no seed, no cursor). */
export function baseParams(query: CsfloatQuery): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  for (const key of CSFLOAT_QUERY_KEYS) {
    const v = query[key];
    if (v === undefined || v === null || v === "") continue;
    if (key === "category" && v === 0) continue; // 0 = any, same as omitting
    params[key] = v as string | number;
  }
  params.sort_by = sortOf(query);
  params.limit = PAGE_LIMIT;
  return params;
}

/** Hash identity of one sub-query: base filters + seed. Page size is not part of identity. */
export function subQueryHash(query: CsfloatQuery, seed: number | null): string {
  const { limit: _limit, ...identity } = baseParams(query);
  return sha256(canonicalJson({ ...identity, paint_seed: seed }));
}

/** Fan a watch out into one sub-query per seed (or a single one without seeds). */
export function buildSubQueries(watch: Pick<Watch, "query" | "seeds">): SubQuery[] {
  const base = baseParams(watch.query);
  const seeds = [...new Set(watch.seeds)].sort((a, b) => a - b);
  if (seeds.length === 0) {
    return [{ hash: subQueryHash(watch.query, null), seed: null, params: base }];
  }
  return seeds.map((seed) => ({
    hash: subQueryHash(watch.query, seed),
    seed,
    params: { ...base, paint_seed: seed },
  }));
}
