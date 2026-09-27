import type { ListingSnap } from "../types";

let counter = 0;

export function snap(overrides: Partial<ListingSnap> = {}): ListingSnap {
  counter += 1;
  return {
    id: overrides.id ?? `L${counter}`,
    assetId: null,
    type: "buy_now",
    price: 10_000,
    createdAt: "2026-09-27T10:00:00.000Z",
    name: "AK-47 | Case Hardened (Field-Tested)",
    seed: 661,
    float: 0.2,
    inspectLink: null,
    iconUrl: null,
    stickers: [],
    stattrak: false,
    ...overrides,
  };
}
