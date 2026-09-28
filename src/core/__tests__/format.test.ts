import { describe, expect, it } from "vitest";
import { baseItemName, describeQuery, describeStickers, parseStickerFilter } from "../format";

describe("baseItemName", () => {
  it("drops wear, StatTrak and Souvenir", () => {
    expect(baseItemName("★ StatTrak™ Bayonet | Night (Field-Tested)")).toBe("★ Bayonet | Night");
    expect(baseItemName("Souvenir AWP | Dragon Lore (Factory New)")).toBe("AWP | Dragon Lore");
    expect(baseItemName("★ Bayonet")).toBe("★ Bayonet");
  });
});

describe("describeQuery", () => {
  it("summarises sort and filters", () => {
    expect(describeQuery({ def_index: 500, sort_by: "lowest_float", max_float: 0.07, category: 2, type: "buy_now", max_price: 50000 })).toEqual([
      "Lowest float",
      "Float ≤ 0.07",
      "≤ $500.00",
      "StatTrak",
      "Buy now",
    ]);
  });

  it("skips the default sort and 'any' category", () => {
    expect(describeQuery({ def_index: 500, sort_by: "most_recent", category: 0 })).toEqual([]);
  });
});

describe("sticker filters", () => {
  const craft = '[{"i":663},{"i":663},{"i":663},{"i":663}]';

  it("parses CSFloat's URL format", () => {
    expect(parseStickerFilter('[{"i":663},{"i":5021,"s":2}]')).toEqual([
      { id: 663, slot: null },
      { id: 5021, slot: 2 },
    ]);
    expect(parseStickerFilter("663|0")).toBeNull();
  });

  it("describes repeated and mixed stickers", () => {
    expect(describeStickers(craft)).toBe("4× sticker 663");
    expect(describeStickers('[{"i":663},{"i":5021}]')).toBe("sticker 663 + sticker 5021");
    expect(describeStickers("not json")).toBe("Stickers");
    expect(describeQuery({ stickers: craft })).toEqual(["4 stickers"]);
  });
});
