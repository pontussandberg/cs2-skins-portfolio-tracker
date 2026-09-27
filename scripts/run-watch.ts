/**
 * Run watches from the terminal (no web UI, no cron). Uses the same data dir as the app,
 * so stop the app first to avoid two writers.
 *
 *   pnpm watch:run --list
 *   pnpm watch:run <watchId|name>
 *   pnpm watch:run --all
 */
import { loadEnvFile } from "node:process";
import { formatFloat, formatPrice, listingUrl } from "../src/core/format";

try {
  loadEnvFile(".env.local");
} catch {
  /* optional */
}

const { createRuntime } = await import("../src/server/runtime");
const rt = createRuntime({ scheduler: false });
await rt.ready;

const arg = process.argv[2];
const watches = await rt.store.listWatches();

if (!arg || arg === "--list") {
  if (watches.length === 0) console.log("No watches yet. Create one in the web UI.");
  for (const w of watches) console.log(`${w.id}  ${w.name}  seeds=[${w.seeds.join(",")}]  schedule=${w.schedule ?? "manual"}`);
  process.exit(0);
}

const targets = arg === "--all" ? watches : watches.filter((w) => w.id === arg || w.name.toLowerCase() === arg.toLowerCase());
if (targets.length === 0) {
  console.error(`No watch matches "${arg}". Try --list.`);
  process.exit(1);
}

for (const w of targets) {
  const queued = await rt.queue.enqueue(w.id, "manual");
  await rt.queue.onIdle();
  const run = await rt.store.getRun(queued.id);
  if (!run) continue;
  console.log(`\n${w.name}: ${run.status}${run.error ? ` (${run.error})` : ""} · ${run.total} listings · ${run.requests} requests`);
  if (run.baseline) console.log("  baseline run: everything recorded, nothing flagged");
  for (const l of run.added) console.log(`  NEW   ${formatPrice(l.price).padStart(10)}  seed ${l.seed ?? "-"}  float ${formatFloat(l.float)}  ${l.name}  ${listingUrl(l.id)}`);
  for (const p of run.priceChanged) console.log(`  PRICE ${formatPrice(p.before)} -> ${formatPrice(p.after)}  ${p.listing.name}  ${listingUrl(p.id)}`);
  if (run.gone.length) console.log(`  GONE  ${run.gone.length} listing(s)`);
}
process.exit(0);
