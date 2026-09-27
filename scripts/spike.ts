/**
 * Phase 0 API spike. Hits CSFloat once (or a few times) and reports:
 *  - response shape (array vs { data, cursor })
 *  - rate-limit headers
 *  - whether multiple paint_seed values work in one call
 * Saves raw responses to fixtures/ for tests.
 *
 *   pnpm spike -- def_index=7 paint_index=44 paint_seed=661,670
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadEnvFile } from "node:process";

try {
  loadEnvFile(".env.local");
} catch {
  /* optional */
}

const key = process.env.CSFLOAT_API_KEY;
if (!key) {
  console.error("Set CSFLOAT_API_KEY in .env.local first.");
  process.exit(1);
}

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((a) => a.includes("="))
    .map((a) => a.split("=") as [string, string]),
);
if (Object.keys(args).length === 0) Object.assign(args, { def_index: "7", paint_index: "44" });

async function call(label: string, params: URLSearchParams) {
  const url = new URL("https://csfloat.com/api/v1/listings");
  params.set("sort_by", "most_recent");
  params.set("limit", "50");
  url.search = params.toString();
  const res = await fetch(url, { headers: { Authorization: key!, Accept: "application/json" } });
  const rate = [...res.headers].filter(([k]) => /rate|retry/i.test(k));
  const json: unknown = await res.json().catch(() => null);
  const list = Array.isArray(json) ? json : ((json as { data?: unknown[] } | null)?.data ?? []);
  const cursor = Array.isArray(json) ? null : ((json as { cursor?: string } | null)?.cursor ?? null);
  const seeds = [...new Set(list.map((l) => (l as { item?: { paint_seed?: number } }).item?.paint_seed))];
  console.log(`\n== ${label}\n${url}`);
  console.log(`HTTP ${res.status} · shape: ${Array.isArray(json) ? "array" : "object"} · listings: ${list.length} · cursor: ${cursor ? "yes" : "no"}`);
  console.log("rate headers:", Object.fromEntries(rate));
  console.log("seeds in result:", seeds.slice(0, 20));
  await mkdir("fixtures", { recursive: true });
  const file = path.join("fixtures", `${label.replace(/\W+/g, "_")}.json`);
  await writeFile(file, JSON.stringify(json, null, 2));
  console.log("saved", file);
  return seeds;
}

const seedArg = args.paint_seed;
delete args.paint_seed;
const base = new URLSearchParams(args);

if (!seedArg) {
  await call("no-seed", new URLSearchParams(base));
} else {
  const seeds = seedArg.split(",");
  await call(`seed-${seeds[0]}`, new URLSearchParams({ ...args, paint_seed: seeds[0]! }));
  if (seeds.length > 1) {
    const comma = await call("multi-comma", new URLSearchParams({ ...args, paint_seed: seeds.join(",") }));
    const repeated = new URLSearchParams(base);
    for (const s of seeds) repeated.append("paint_seed", s);
    const rep = await call("multi-repeated", repeated);
    const works = (found: unknown[]) => seeds.filter((s) => found.includes(Number(s))).length > 1;
    console.log(`\nMulti-seed via comma: ${works(comma) ? "seems to work" : "no (or not enough listings to tell)"}`);
    console.log(`Multi-seed via repeated param: ${works(rep) ? "seems to work" : "no (or not enough listings to tell)"}`);
  }
}
