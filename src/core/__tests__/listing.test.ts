import { describe, expect, it } from "vitest";
import { sortListings, stickerPercent } from "../listing";
import { snap } from "./fixtures";

describe("sortListings", () => {
  const items = [
    snap({ id: "mid", float: 0.2, price: 300, createdAt: "2026-09-27T10:00:00.000Z" }),
    snap({ id: "none", float: null, price: 100, createdAt: "2026-09-27T12:00:00.000Z" }),
    snap({ id: "low", float: 0.01, price: 200, createdAt: "2026-09-27T11:00:00.000Z" }),
  ];
  const ids = (sort: Parameters<typeof sortListings>[1]) => sortListings(items, sort).map((l) => l.id);

  it("orders by the watch's sort, nulls last", () => {
    expect(ids("lowest_float")).toEqual(["low", "mid", "none"]);
    expect(ids("highest_float")).toEqual(["mid", "low", "none"]);
    expect(ids("lowest_price")).toEqual(["none", "low", "mid"]);
    expect(ids("most_recent")).toEqual(["none", "low", "mid"]);
  });

  it("keeps CSFloat's order for sorts it cannot reproduce", () => {
    expect(ids("best_deal")).toEqual(["mid", "none", "low"]);
  });
});

describe("stickerPercent", () => {
  const sticker = (price: number | null) => ({ name: "Sticker | X", iconUrl: null, slot: 0, wear: null, price });

  it("is the premium over the base price as a share of sticker value", () => {
    // $150 asked, $100 base, 4 × $50 stickers: $50 extra of $200 sticker value = 25%.
    expect(stickerPercent({ price: 15_000, basePrice: 10_000, stickerDetails: [50, 50, 50, 50].map((d) => sticker(d * 100)) })).toBe(25);
    expect(stickerPercent({ price: 9_000, basePrice: 10_000, stickerDetails: [sticker(5_000)] })).toBe(-20);
  });

  it("prefers CSFloat's own sticker total", () => {
    expect(stickerPercent({ price: 15_000, basePrice: 10_000, stickerValue: 10_000, stickerDetails: [sticker(20_000)] })).toBe(50);
  });

  it("is unknown without a base price or priced stickers", () => {
    expect(stickerPercent({ price: 15_000, basePrice: null, stickerDetails: [sticker(5_000)] })).toBeNull();
    expect(stickerPercent({ price: 15_000, basePrice: 10_000, stickerDetails: [sticker(null)] })).toBeNull();
    expect(stickerPercent({ price: 15_000, basePrice: 10_000 })).toBeNull();
  });
});
