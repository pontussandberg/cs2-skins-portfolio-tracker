// Domain types shared by server, GraphQL resolvers and UI.
// This file must stay dependency-free (no node:*, no zod) so client code can import it.

export type ListingType = "buy_now" | "auction";

/** CSFloat `sort_by` values we pass through. most_recent is the default. */
export const CSFLOAT_SORTS = [
  "most_recent",
  "lowest_price",
  "highest_price",
  "lowest_float",
  "highest_float",
  "best_deal",
  "highest_discount",
] as const;
export type SortBy = (typeof CSFLOAT_SORTS)[number];
export const DEFAULT_SORT: SortBy = "most_recent";

export function isSortBy(value: unknown): value is SortBy {
  return (CSFLOAT_SORTS as readonly unknown[]).includes(value);
}

export function sortOf(query: Pick<CsfloatQuery, "sort_by">): SortBy {
  return query.sort_by ?? DEFAULT_SORT;
}

/** Validated subset of CSFloat GET /api/v1/listings params. Prices in USD cents. */
export interface CsfloatQuery {
  def_index?: number | null;
  paint_index?: number | null;
  market_hash_name?: string | null;
  min_float?: number | null;
  max_float?: number | null;
  /** Case Hardened blue % on the play side, 0-100. */
  min_blue?: number | null;
  max_blue?: number | null;
  /** Fade %, 0-100. */
  min_fade?: number | null;
  max_fade?: number | null;
  /** 0 any, 1 normal, 2 StatTrak, 3 souvenir */
  category?: number | null;
  min_price?: number | null;
  max_price?: number | null;
  type?: ListingType | null;
  stickers?: string | null;
  /** Charm filter, same format as stickers: [{"i":20}] (i = charm id). */
  keychains?: string | null;
  collection?: string | null;
  rarity?: number | null;
  /** CSFloat search preset, e.g. "sticker_combos" (4+ of the same sticker). Passed through as-is. */
  filter?: string | null;
  /**
   * Result order. With most_recent the watch follows the newest listings; with any other sort it
   * tracks the top `maxPages` pages in that order (e.g. the 50 lowest floats).
   */
  sort_by?: SortBy | null;
}

/**
 * Every CSFloat query param we support, with how its URL value is read. The key list, the URL
 * parser and the validation schema are all derived from or checked against this one list.
 */
export const CSFLOAT_QUERY_PARAMS = {
  def_index: "int",
  paint_index: "int",
  market_hash_name: "string",
  min_float: "float",
  max_float: "float",
  min_blue: "float",
  max_blue: "float",
  min_fade: "float",
  max_fade: "float",
  category: "int",
  min_price: "int",
  max_price: "int",
  type: "listingType",
  stickers: "string",
  keychains: "string",
  collection: "string",
  rarity: "int",
  filter: "string",
  sort_by: "sort",
} as const satisfies Record<keyof CsfloatQuery, "int" | "float" | "string" | "listingType" | "sort">;

export const CSFLOAT_QUERY_KEYS = Object.keys(CSFLOAT_QUERY_PARAMS) as (keyof CsfloatQuery)[];

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
  /** Custom order on the dashboard (ascending). Assigned by the store; omit it when creating a watch. */
  position?: number;
}

export interface StickerSnap {
  name: string;
  /** Full image URL. */
  iconUrl: string | null;
  /** 0-based position on the weapon. */
  slot: number | null;
  /** Scrape, 0 = pristine. Only present when CSFloat reports it. */
  wear: number | null;
  /** CSFloat reference price in USD cents. Missing on snapshots saved before this was tracked. */
  price?: number | null;
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
  /** CSFloat float rank among all known items of this skin (1 = lowest / highest). Only set when ranked. */
  lowRank?: number | null;
  highRank?: number | null;
  inspectLink: string | null;
  /** Raw Steam economy icon hash or URL as returned by CSFloat. */
  iconUrl: string | null;
  stickers: string[];
  /** Stickers with images, in slot order. Missing on snapshots saved before this was tracked. */
  stickerDetails?: StickerSnap[];
  /** CSFloat reference price of the item itself (no stickers), USD cents. */
  basePrice?: number | null;
  /** CSFloat's total reference value of the stickers, USD cents (used for the sticker percentage). */
  stickerValue?: number | null;
  /** Attached charms, same shape as stickers. */
  charms?: StickerSnap[];
  /** Case Hardened blue % on the play side. */
  bluePercent?: number | null;
  /** Fade % and its rank among all known items of this skin (1 = best). */
  fadePercent?: number | null;
  fadeRank?: number | null;
  /** CSFloat's in-game screenshot of this item (see screenshotUrl). */
  screenshotId?: string | null;
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
