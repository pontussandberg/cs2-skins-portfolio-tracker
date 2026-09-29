import { describe, expect, it } from "vitest";
import type { ApiListing } from "@/core/listing";
import { composeWatchName, lookupSearchName } from "../searchName";

function listing(name: string, stickers: { stickerId: number; name: string }[] = [], keychains: { stickerId: number; name: string }[] = []): ApiListing {
  return { id: "1", created_at: "2026-09-27T10:00:00Z", type: "buy_now", price: 100, item: { market_hash_name: name, stickers, keychains } };
}

function fake(listings: ApiListing[]) {
  const calls: Record<string, string | number>[] = [];
  return { calls, fetch: async (params: Record<string, string | number>) => (calls.push(params), { listings }) };
}

const titan = { stickerId: 663, name: "Sticker | Titan (Foil) | Cologne 2015" };
const craft = '[{"i":663},{"i":663},{"i":663},{"i":663}]';

describe("lookupSearchName", () => {
  it("names a sticker-only search after the sticker", async () => {
    const f = fake([listing("AK-47 | Vulcan (Field-Tested)", [titan, titan, titan, { stickerId: 1, name: "Sticker | Other" }])]);
    expect(await lookupSearchName(f.fetch, { stickers: craft })).toBe("4× Titan (Foil) | Cologne 2015");
    expect(f.calls[0]).toMatchObject({ stickers: craft, limit: 1 });
  });

  it("combines item and stickers", async () => {
    const f = fake([listing("★ StatTrak™ Bayonet | Night (Field-Tested)", [titan])]);
    expect(await lookupSearchName(f.fetch, { def_index: 500, paint_index: 40, stickers: '[{"i":663}]' })).toBe("★ Bayonet | Night · Titan (Foil) | Cologne 2015");
  });

  it("names a charm-only search after the charm", async () => {
    const f = fake([listing("AWP | Redline (Field-Tested)", [], [{ stickerId: 20, name: "Charm | Titeenium AWP" }])]);
    expect(await lookupSearchName(f.fetch, { keychains: '[{"i":20}]' })).toBe("Titeenium AWP");
    expect(f.calls[0]).toMatchObject({ keychains: '[{"i":20}]' });
    expect(await lookupSearchName(fake([]).fetch, { keychains: '[{"i":20}]' })).toBe("charm 20");
  });

  it("falls back to sticker ids when nothing matches", async () => {
    expect(await lookupSearchName(fake([]).fetch, { stickers: craft })).toBe("4× sticker 663");
  });

  it("skips the request when the name is already known", async () => {
    const f = fake([]);
    expect(await lookupSearchName(f.fetch, { market_hash_name: "AK-47 | Redline (Field-Tested)" })).toBe("AK-47 | Redline");
    expect(f.calls).toEqual([]);
  });
});

describe("composeWatchName", () => {
  it("adds sort and seed count to the looked-up name", () => {
    expect(composeWatchName("★ Bayonet | Night", { def_index: 500, paint_index: 40, sort_by: "lowest_float" }, 3)).toBe("★ Bayonet | Night · Lowest float · 3 seeds");
  });

  it("falls back to the filters when the lookup found nothing", () => {
    expect(composeWatchName(null, { def_index: 500, paint_index: 40 }, 0)).toBe("def 500 / paint 40");
    expect(composeWatchName(null, { stickers: craft }, 0)).toBe("4× sticker 663");
    expect(composeWatchName(null, { collection: "set_bravo_ii" }, 1)).toBe("set_bravo_ii · 1 seed");
  });
});
