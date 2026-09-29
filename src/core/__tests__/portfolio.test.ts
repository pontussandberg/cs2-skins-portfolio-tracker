import { describe, expect, it } from "vitest";
import { buildPortfolio, itemKey, portfolioTotals, toInventoryItem, valueItem, type InventoryItem, type Valuation } from "../portfolio";

const apiItem = {
  asset_id: "53860446940",
  market_hash_name: "AWP | Containment Breach (Minimal Wear)",
  type: "skin",
  icon_url: "abc",
  paint_seed: 52,
  float_value: 0.127,
  low_rank: 40,
  is_stattrak: false,
  tradable: 1,
  serialized_inspect: "steam://rungame/730/...",
  stickers: [
    { name: "Sticker | B", icon_url: "https://img/b", slot: 2, wear: 0.3, reference: { price: 1000 } },
    { name: "Sticker | A", icon_url: "https://img/a", slot: 0, reference: { price: 3000 } },
  ],
  keychains: [{ name: "Charm | Titeenium AWP", slot: 0, reference: { price: 290 } }],
  reference: { base_price: 12271, predicted_price: 12275 },
};

function item(over: Partial<InventoryItem> = {}): InventoryItem {
  return { ...toInventoryItem(apiItem), ...over };
}

function valuation(over: Partial<Valuation>): Valuation {
  return { craftPercent: null, multiplier: null, skinPrice: null, note: null, updatedAt: "2026-09-28T10:00:00.000Z", ...over };
}

const settings = { defaultCraftPercent: 0 };

describe("toInventoryItem", () => {
  it("maps stickers and charms in slot order and prefers the float-adjusted price", () => {
    const i = toInventoryItem(apiItem);
    expect(i.marketPrice).toBe(12275);
    expect(i.tradable).toBe(true);
    expect(i.stickers.map((s) => [s.name, s.slot, s.wear, s.price])).toEqual([
      ["Sticker | A", 0, null, 3000],
      ["Sticker | B", 2, 0.3, 1000],
    ]);
    expect(i.charms).toEqual([{ name: "Charm | Titeenium AWP", iconUrl: null, slot: 0, wear: null, price: 290 }]);
  });

  it("falls back to the base price", () => {
    expect(toInventoryItem({ ...apiItem, reference: { base_price: 500 } }).marketPrice).toBe(500);
  });
});

describe("itemKey", () => {
  it("survives an asset id change for skins with a float", () => {
    expect(itemKey(item())).toBe(itemKey(item({ assetId: "1" })));
  });

  it("uses the asset id for items without a float", () => {
    expect(itemKey(item({ float: null, assetId: "7" }))).toBe("asset:7");
  });
});

describe("valueItem", () => {
  it("is market + charms with no valuation and a 0% default", () => {
    const v = valueItem(item(), null, settings);
    expect(v).toMatchObject({ market: 12275, skin: 12275, stickers: 4000, craftPercent: 0, craft: 0, charms: 290, total: 12565, marketTotal: 12565 });
  });

  it("adds the craft % of the sticker value", () => {
    expect(valueItem(item(), valuation({ craftPercent: 25 }), settings)).toMatchObject({ craft: 1000, total: 13565 });
  });

  it("uses the default craft % only for items with stickers and no own %", () => {
    expect(valueItem(item(), null, { defaultCraftPercent: 10 }).craft).toBe(400);
    expect(valueItem(item(), valuation({ craftPercent: 0 }), { defaultCraftPercent: 10 }).craft).toBe(0);
    expect(valueItem(item({ stickers: [] }), null, { defaultCraftPercent: 10 }).craftPercent).toBe(0);
  });

  it("scales the skin by the multiplier, or replaces it with a fixed price", () => {
    expect(valueItem(item(), valuation({ multiplier: 3 }), settings).skin).toBe(36825);
    expect(valueItem(item(), valuation({ multiplier: 3, skinPrice: 50_000 }), settings).skin).toBe(50_000);
  });

  it("treats a missing market price as 0", () => {
    expect(valueItem(item({ marketPrice: null, charms: [] }), null, settings).total).toBe(0);
  });
});

describe("portfolioTotals", () => {
  it("sums value, market and sticker value", () => {
    const values = [valueItem(item(), valuation({ craftPercent: 25 }), settings), valueItem(item({ stickers: [], charms: [] }), null, settings)];
    expect(portfolioTotals(values)).toEqual({ items: 2, value: 13565 + 12275, market: 12565 + 12275, stickers: 4000 });
  });
});

describe("buildPortfolio", () => {
  it("joins valuations by key and sorts by value", () => {
    const cheap = item({ assetId: "c", float: 0.5, stickers: [], charms: [] });
    const craft = item();
    const entries = buildPortfolio([cheap, craft], { settings, valuations: { [itemKey(cheap)]: valuation({ multiplier: 10 }) } });
    expect(entries.map((e) => [e.assetId, e.value.total])).toEqual([
      ["c", 122750],
      [craft.assetId, 12565],
    ]);
    expect(entries[1]!.valuation).toBeNull();
  });
});
