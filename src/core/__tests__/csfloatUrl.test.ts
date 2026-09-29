import { describe, expect, it } from "vitest";
import { buildCsfloatSearchUrl, parseCsfloatSearchUrl, parseSeedList } from "../csfloatUrl";

describe("parseCsfloatSearchUrl", () => {
  it("maps known params and collects seeds", () => {
    const r = parseCsfloatSearchUrl(
      "https://csfloat.com/search?def_index=7&paint_index=44&paint_seed=661&paint_seed=670,321&max_float=0.38&category=1&type=buy_now&sort_by=lowest_price&foo=bar",
    );
    expect(r.query).toEqual({ def_index: 7, paint_index: 44, max_float: 0.38, category: 1, type: "buy_now", sort_by: "lowest_price" });
    expect(r.seeds).toEqual([321, 661, 670]);
    expect(r.ignored).toEqual(["foo"]);
  });

  it("keeps the sort order", () => {
    const r = parseCsfloatSearchUrl("https://csfloat.com/search?sort_by=lowest_float&def_index=500&paint_index=40");
    expect(r.query).toEqual({ def_index: 500, paint_index: 40, sort_by: "lowest_float" });
    expect(r.ignored).toEqual([]);
  });

  it("reports an unknown sort instead of guessing", () => {
    const r = parseCsfloatSearchUrl("def_index=7&sort_by=nonsense");
    expect(r.query).toEqual({ def_index: 7 });
    expect(r.ignored).toEqual(["sort_by=nonsense"]);
  });

  it("keeps a sticker-only search", () => {
    const r = parseCsfloatSearchUrl(
      "https://csfloat.com/search?sort_by=most_recent&stickers=%5B%7B%22i%22:663%7D,%7B%22i%22:663%7D,%7B%22i%22:663%7D,%7B%22i%22:663%7D%5D",
    );
    expect(r.query).toEqual({ stickers: '[{"i":663},{"i":663},{"i":663},{"i":663}]' });
    expect(r.ignored).toEqual([]);
  });

  it("keeps CSFloat's filter preset", () => {
    const r = parseCsfloatSearchUrl("https://csfloat.com/search?def_index=7&filter=sticker_combos&sort_by=lowest_price");
    expect(r.query).toEqual({ def_index: 7, filter: "sticker_combos", sort_by: "lowest_price" });
    expect(r.ignored).toEqual([]);
  });

  it("maps blue %, fade % and charm filters", () => {
    const { query, ignored } = parseCsfloatSearchUrl(
      "https://csfloat.com/search?category=1&sort_by=most_recent&max_float=0.27&def_index=514&paint_index=44&min_blue=50&max_fade=99.5&keychains=%5B%7B%22i%22%3A20%7D%5D",
    );
    expect(query).toEqual({ category: 1, max_float: 0.27, def_index: 514, paint_index: 44, min_blue: 50, max_fade: 99.5, keychains: '[{"i":20}]' });
    expect(ignored).toEqual([]);
  });

  it("accepts a bare query string", () => {
    expect(parseCsfloatSearchUrl("market_hash_name=AK-47%20%7C%20Redline%20(Field-Tested)").query).toEqual({
      market_hash_name: "AK-47 | Redline (Field-Tested)",
    });
  });

  it("round-trips through buildCsfloatSearchUrl", () => {
    const url = buildCsfloatSearchUrl({ def_index: 7, paint_index: 44, max_price: 100000 }, 661);
    const r = parseCsfloatSearchUrl(url);
    expect(r.query).toEqual({ def_index: 7, paint_index: 44, max_price: 100000 });
    expect(r.seeds).toEqual([661]);
  });

  it("builds links with the watch's sort, defaulting to most_recent", () => {
    expect(buildCsfloatSearchUrl({ def_index: 500, sort_by: "lowest_float" })).toContain("sort_by=lowest_float");
    expect(buildCsfloatSearchUrl({ def_index: 500 })).toContain("sort_by=most_recent");
  });
});

describe("parseSeedList", () => {
  it("accepts commas, spaces and newlines, dedupes and sorts", () => {
    expect(parseSeedList("661, 670 321\n955,661 x")).toEqual([321, 661, 670, 955]);
  });
});
