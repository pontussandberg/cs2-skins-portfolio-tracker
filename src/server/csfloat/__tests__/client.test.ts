import { describe, expect, it } from "vitest";
import { CsfloatAuthError, CsfloatClient } from "../client";
import { RateGate } from "../rateGate";
import { parseListingsResponse } from "../schemas";

const silent = { child: () => silent, info: () => {}, debug: () => {}, warn: () => {}, error: () => {} } as never;

const apiListing = {
  id: "324288155723370196",
  created_at: "2026-09-27T10:00:00Z",
  type: "buy_now",
  price: 123456,
  state: "listed",
  reference: { base_price: 100000, predicted_price: 101000, sticker_overpay: { total_price: 2500, lower_sigma: 0.1 } },
  item: {
    asset_id: "40000000000",
    market_hash_name: "AK-47 | Case Hardened (Field-Tested)",
    paint_seed: 661,
    float_value: 0.2012,
    low_rank: 32,
    icon_url: "abc",
    inspect_link: "steam://rungame/730/...",
    is_stattrak: false,
    cs2_screenshot_id: "3752978620153463426",
    blue_gem: { playside_blue: 54.2, backside_blue: 53.9 },
    keychains: [{ stickerId: 20, name: "Charm | Titeenium AWP", slot: 0, reference: { price: 290 } }],
    stickers: [
      { stickerId: 2, name: "Sticker | Bar", icon_url: "https://img/bar", slot: 3, wear: 0.5, reference: { price: 2500, quantity: 3 } },
      { stickerId: 1, name: "Sticker | Foo", icon_url: "https://img/foo", slot: 0 },
    ],
    extra_field_we_ignore: true,
  },
  seller: { username: "x" },
};

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
}

function client(responses: Response[]) {
  const calls: string[] = [];
  const fetchImpl = (async (url: URL) => {
    calls.push(String(url));
    const next = responses.shift();
    if (!next) throw new Error("no more responses");
    return next;
  }) as unknown as typeof fetch;
  const gate = new RateGate(0, async () => {}, () => Date.now());
  return { c: new CsfloatClient({ apiKey: "k", gate, logger: silent, fetchImpl }), calls, gate };
}

describe("parseListingsResponse", () => {
  it("accepts { data, cursor }", () => {
    const r = parseListingsResponse({ data: [apiListing], cursor: "abc" });
    expect(r.cursor).toBe("abc");
    expect(r.listings[0]!.item.paint_seed).toBe(661);
  });
  it("accepts a bare array", () => {
    expect(parseListingsResponse([apiListing]).cursor).toBeNull();
  });
  it("rejects a changed shape loudly", () => {
    expect(() => parseListingsResponse({ data: [{ id: 1 }] })).toThrow();
  });
});

describe("CsfloatClient", () => {
  it("sends params + cursor and maps listings", async () => {
    const { c, calls } = client([jsonResponse({ data: [apiListing], cursor: "n2" })]);
    const page = await c.fetchListingsPage({ def_index: 7, paint_seed: 661, sort_by: "most_recent", limit: 50 }, "n1");
    expect(calls[0]).toContain("def_index=7");
    expect(calls[0]).toContain("paint_seed=661");
    expect(calls[0]).toContain("cursor=n1");
    expect(page.cursor).toBe("n2");
    expect(page.items[0]).toMatchObject({ id: "324288155723370196", price: 123456, seed: 661, stickers: ["Sticker | Bar", "Sticker | Foo"], lowRank: 32, highRank: null, basePrice: 100000, stickerValue: 2500 });
    expect(page.items[0]).toMatchObject({ screenshotId: "3752978620153463426", bluePercent: 54.2, charms: [{ name: "Charm | Titeenium AWP", price: 290 }] });
    expect(page.items[0]).not.toHaveProperty("fadePercent");
    expect(page.items[0]!.stickerDetails).toEqual([
      { name: "Sticker | Foo", iconUrl: "https://img/foo", slot: 0, wear: null, price: null },
      { name: "Sticker | Bar", iconUrl: "https://img/bar", slot: 3, wear: 0.5, price: 2500 },
    ]);
  });

  it("pauses and retries on 429", async () => {
    const { c, gate } = client([jsonResponse({}, 429, { "retry-after": "1" }), jsonResponse([apiListing])]);
    const before = Date.now();
    const page = await c.fetchListingsPage({}, null);
    expect(page.items).toHaveLength(1);
    expect(gate.pausedUntilMs).toBeGreaterThanOrEqual(before + 900);
    expect(c.requestCount).toBe(2);
  });

  it("throws an auth error on 401 without retrying", async () => {
    const { c } = client([jsonResponse({ message: "bad" }, 401)]);
    await expect(c.fetchListingsPage({}, null)).rejects.toBeInstanceOf(CsfloatAuthError);
    expect(c.requestCount).toBe(1);
  });

  it("pauses when the quota header says 0 remaining", async () => {
    const reset = Math.floor(Date.now() / 1000) + 120;
    const { c, gate } = client([jsonResponse([apiListing], 200, { "x-ratelimit-remaining": "0", "x-ratelimit-reset": String(reset) })]);
    await c.fetchListingsPage({}, null);
    expect(gate.pausedUntilMs).toBe(reset * 1000);
  });
});
