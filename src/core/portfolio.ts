// Portfolio: owned items (synced from CSFloat's inventory endpoint) and your own valuations.
// Dependency-free so the UI can import it. Prices in USD cents.
import { toStickerSnaps, type ApiSticker } from "./listing";
import type { StickerSnap } from "./types";

/** Shape of an item from CSFloat GET /api/v1/me/inventory (only fields we use). */
export interface ApiInventoryItem {
  asset_id: string;
  market_hash_name: string;
  type?: string | null;
  icon_url?: string | null;
  paint_seed?: number | null;
  float_value?: number | null;
  low_rank?: number | null;
  high_rank?: number | null;
  is_stattrak?: boolean | null;
  is_souvenir?: boolean | null;
  tradable?: number | boolean | null;
  serialized_inspect?: string | null;
  listing_id?: string | null;
  stickers?: ApiSticker[] | null;
  keychains?: ApiSticker[] | null;
  reference?: { base_price?: number | null; predicted_price?: number | null } | null;
}

/** One owned item. */
export interface InventoryItem {
  assetId: string;
  name: string;
  /** CSFloat item type: skin, agent, container, charm, collectible, music_kit, ... */
  type: string;
  iconUrl: string | null;
  float: number | null;
  seed: number | null;
  lowRank: number | null;
  highRank: number | null;
  stattrak: boolean;
  souvenir: boolean;
  tradable: boolean;
  /** Set when the item is listed for sale on CSFloat. */
  listingId: string | null;
  inspectLink: string | null;
  stickers: StickerSnap[];
  /** Attached charms (keychains), same shape as stickers. */
  charms: StickerSnap[];
  /** CSFloat's price for the item itself (float-adjusted when it has one), without stickers or charms. */
  marketPrice: number | null;
}

export interface InventorySnapshot {
  syncedAt: string;
  items: InventoryItem[];
}

/** Your judgement of one item's worth on top of the market price. */
export interface Valuation {
  /** Share of the stickers' reference value the craft adds: 15 = +15% of the sticker value. Null = portfolio default. */
  craftPercent: number | null;
  /** Skin value as a multiple of the market price (patterns, rare floats): 3 = 3× market. */
  multiplier: number | null;
  /** Fixed skin value; wins over `multiplier`. */
  skinPrice: number | null;
  note: string | null;
  updatedAt: string;
}

export type ValuationInput = Omit<Valuation, "updatedAt">;

export interface PortfolioSettings {
  /** Craft % for items with stickers that have no craft % of their own. */
  defaultCraftPercent: number;
}

/** Everything you enter by hand, stored together (data/portfolio.json). Valuations by itemKey. */
export interface PortfolioData {
  settings: PortfolioSettings;
  valuations: Record<string, Valuation>;
}

export const EMPTY_PORTFOLIO: PortfolioData = { settings: { defaultCraftPercent: 0 }, valuations: {} };

/** Breakdown of an item's value. */
export interface ItemValue {
  /** CSFloat's price for the item itself. */
  market: number;
  /** Your value for the item itself: market, × multiplier, or a fixed price. */
  skin: number;
  /** Reference value of the applied stickers. */
  stickers: number;
  /** Craft % used (the item's own, else the default; 0 without stickers). */
  craftPercent: number;
  /** What the stickers add: `stickers` × `craftPercent`. */
  craft: number;
  /** Attached charms at their reference price (they can be removed and sold). */
  charms: number;
  /** skin + craft + charms. */
  total: number;
  /** What the market pays without your premiums: market + charms. */
  marketTotal: number;
}

export function toInventoryItem(i: ApiInventoryItem): InventoryItem {
  return {
    assetId: String(i.asset_id),
    name: i.market_hash_name,
    type: i.type ?? "other",
    iconUrl: i.icon_url ?? null,
    float: i.float_value ?? null,
    seed: i.paint_seed ?? null,
    lowRank: i.low_rank ?? null,
    highRank: i.high_rank ?? null,
    stattrak: Boolean(i.is_stattrak),
    souvenir: Boolean(i.is_souvenir),
    tradable: Boolean(i.tradable),
    listingId: i.listing_id ?? null,
    inspectLink: i.serialized_inspect ?? null,
    stickers: toStickerSnaps(i.stickers),
    charms: toStickerSnaps(i.keychains),
    marketPrice: i.reference?.predicted_price ?? i.reference?.base_price ?? null,
  };
}

/**
 * Stable id for valuations. Steam gives an item a new asset id whenever it moves (trade, storage
 * unit), but name + seed + float identify a skin for good, so valuations follow it back.
 */
export function itemKey(i: Pick<InventoryItem, "assetId" | "name" | "seed" | "float">): string {
  return i.float != null ? `${i.name}|${i.seed ?? ""}|${i.float}` : `asset:${i.assetId}`;
}

const priceSum = (list: StickerSnap[]) => list.reduce((sum, s) => sum + (s.price ?? 0), 0);

export function valueItem(item: Pick<InventoryItem, "marketPrice" | "stickers" | "charms">, valuation: Valuation | null | undefined, settings: PortfolioSettings): ItemValue {
  const market = item.marketPrice ?? 0;
  const skin = valuation?.skinPrice ?? Math.round(market * (valuation?.multiplier ?? 1));
  const stickers = priceSum(item.stickers);
  const craftPercent = stickers > 0 ? (valuation?.craftPercent ?? settings.defaultCraftPercent) : 0;
  const craft = Math.round((stickers * craftPercent) / 100);
  const charms = priceSum(item.charms);
  return { market, skin, stickers, craftPercent, craft, charms, total: skin + craft + charms, marketTotal: market + charms };
}

export interface PortfolioTotals {
  items: number;
  /** Your valuation of everything. */
  value: number;
  /** Market value of everything (market + charms). */
  market: number;
  /** Reference value of all applied stickers. */
  stickers: number;
}

export function portfolioTotals(values: ItemValue[]): PortfolioTotals {
  return values.reduce<PortfolioTotals>(
    (t, v) => ({ items: t.items + 1, value: t.value + v.total, market: t.market + v.marketTotal, stickers: t.stickers + v.stickers }),
    { items: 0, value: 0, market: 0, stickers: 0 },
  );
}

/** An owned item with your valuation and its value breakdown. */
export interface PortfolioEntry extends InventoryItem {
  key: string;
  valuation: Valuation | null;
  value: ItemValue;
}

/** Owned items joined with their valuations, most valuable first. */
export function buildPortfolio(items: InventoryItem[], data: PortfolioData): PortfolioEntry[] {
  return items
    .map((item) => {
      const key = itemKey(item);
      const valuation = data.valuations[key] ?? null;
      return { ...item, key, valuation, value: valueItem(item, valuation, data.settings) };
    })
    .sort((a, b) => b.value.total - a.value.total);
}

/** Summary of a saved snapshot (what lists show). */
export interface SnapshotMeta {
  id: string;
  /** Your name for it; null = just the date. */
  label: string | null;
  takenAt: string;
  /** Totals at the time, so lists don't have to load every snapshot. */
  totals: PortfolioTotals;
}

/** The portfolio frozen at one moment: items, their prices then, and your valuations then. */
export interface PortfolioSnapshot extends SnapshotMeta {
  inventory: InventorySnapshot;
  portfolio: PortfolioData;
}
