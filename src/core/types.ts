// Domain types shared by server, GraphQL resolvers and UI.
// This file must stay dependency-free (no node:*, no zod) so client code can import it.

export type ListingType = "buy_now" | "auction";

/** Validated subset of CSFloat GET /api/v1/listings params. Prices in USD cents. */
export interface CsfloatQuery {
  def_index?: number | null;
  paint_index?: number | null;
  market_hash_name?: string | null;
  min_float?: number | null;
  max_float?: number | null;
  /** 0 any, 1 normal, 2 StatTrak, 3 souvenir */
  category?: number | null;
  min_price?: number | null;
  max_price?: number | null;
  type?: ListingType | null;
  stickers?: string | null;
  collection?: string | null;
  rarity?: number | null;
}

export const CSFLOAT_QUERY_KEYS = [
  "def_index",
  "paint_index",
  "market_hash_name",
  "min_float",
  "max_float",
  "category",
  "min_price",
  "max_price",
  "type",
  "stickers",
  "collection",
  "rarity",
] as const satisfies readonly (keyof CsfloatQuery)[];

/** A saved search. */
export interface Watch {
  id: string;
  name: string;
  query: CsfloatQuery;
  /** Pattern seeds. Empty = one query without paint_seed. */
  seeds: number[];
  /** Cron expression, or null for manual-only. */
  schedule: string | null;
  /** Safety cap on pages fetched per seed (50 listings per page). */
  maxPages: number;
  enabled: boolean;
  /** Post new items to Discord. */
  notify: boolean;
  createdAt: string;
  updatedAt: string;
  /** Bumped when you open the watch in the UI; drives the unread badge. */
  lastSeenAt: string | null;
}

/** Compact listing: only what the diff, UI and Discord need. */
export interface ListingSnap {
  id: string;
  assetId: string | null;
  type: string;
  /** USD cents */
  price: number;
  createdAt: string;
  name: string;
  seed: number | null;
  float: number | null;
  inspectLink: string | null;
  /** Raw Steam economy icon hash or URL as returned by CSFloat. */
  iconUrl: string | null;
  stickers: string[];
  stattrak: boolean;
}

export interface PriceChange {
  id: string;
  before: number;
  after: number;
  listing: ListingSnap;
}

/** One CSFloat request stream inside a watch: base filters + at most one seed. */
export interface SubQuery {
  hash: string;
  seed: number | null;
  params: Record<string, string | number>;
}

/** Persisted per sub-query hash. */
export interface QueryState {
  hash: string;
  /** What the last successful run fetched. */
  lastSnapshot: ListingSnap[];
  /** Whether lastSnapshot is the complete result set (no page cap / early stop). */
  coveredFully: boolean;
  /** listing id -> ISO time last seen. Used to decide "new". */
  seen: Record<string, string>;
  lastRunAt: string;
}

export interface DiffResult {
  baseline: boolean;
  added: ListingSnap[];
  priceChanged: PriceChange[];
  gone: string[];
}

export type RunTrigger = "manual" | "cron";
export type RunStatus = "queued" | "running" | "done" | "failed";

export interface RunRecord {
  id: string;
  watchId: string;
  trigger: RunTrigger;
  status: RunStatus;
  queuedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  /** CSFloat requests spent. */
  requests: number;
  /** True when every sub-query was a first run (nothing flagged). */
  baseline: boolean;
  total: number;
  added: ListingSnap[];
  priceChanged: PriceChange[];
  gone: string[];
  error: string | null;
}

export type FeedKind = "NEW" | "PRICE_DROP";

export interface FeedItem {
  id: string;
  kind: FeedKind;
  at: string;
  listing: ListingSnap;
  priceBefore: number | null;
  runId: string;
  watchId: string;
}

export interface SystemStatus {
  csfloatKeyConfigured: boolean;
  discordConfigured: boolean;
  schedulerSuspended: boolean;
  suspendedReason: string | null;
  queueSize: number;
  timezone: string;
}
