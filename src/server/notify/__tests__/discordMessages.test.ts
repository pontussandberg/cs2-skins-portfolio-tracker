import { describe, expect, it } from "vitest";
import { snap } from "@/core/__tests__/fixtures";
import { buildNewItemsPayloads, listingEmbed, MAX_EMBEDS } from "../discordMessages";

describe("Discord payloads", () => {
  it("returns nothing when there are no new items", () => {
    expect(buildNewItemsPayloads({ watchName: "w", items: [] })).toEqual([]);
  });

  it("splits more than 10 items into several messages", () => {
    const items = Array.from({ length: 23 }, (_, i) => snap({ id: `id${i}` }));
    const payloads = buildNewItemsPayloads({ watchName: "Blue gems", items });
    expect(payloads.map((p) => p.embeds.length)).toEqual([MAX_EMBEDS, MAX_EMBEDS, 3]);
    expect(payloads[0]!.content).toContain("23 new");
    expect(payloads[2]!.content).toContain("(3/3)");
  });

  it("links each embed to the CSFloat listing", () => {
    const e = listingEmbed(snap({ id: "123", price: 123456, seed: 661, float: 0.123456789 }));
    expect(e.url).toBe("https://csfloat.com/item/123");
    expect(e.title).toContain("seed 661");
    expect(e.description).toContain("$1,234.56");
    expect(e.description).toContain("0.123457");
  });

  it("shows the float rank when the item has one", () => {
    expect(listingEmbed(snap({ float: 0.0674, lowRank: 32 })).description).toContain("float 0.067400 (#32 low)");
    expect(listingEmbed(snap({ float: 0.2 })).description).not.toContain("#");
  });
});
