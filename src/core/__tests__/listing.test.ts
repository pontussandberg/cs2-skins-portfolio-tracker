import { describe, expect, it } from "vitest";
import { sortListings } from "../listing";
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
