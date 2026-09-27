# CSFloat Watcher

Saved CSFloat searches that tell you what's new. Each **watch** is a CSFloat search (item, float range, price, StatTrak, …) plus an optional list of **pattern seeds**. Watches run on a cron schedule or when you press **Run**; every run is diffed against the previous one, and only listings that appeared since then are flagged in the feed and posted to Discord.

Stack: Next.js (App Router) · GraphQL (Apollo Server + Apollo Client, GraphQL Code Generator) · p-queue + croner · JSON file store · Tailwind claymorphism UI.

## Quick start (Windows / macOS / Linux)

```bash
pnpm install                 # also runs graphql-codegen
cp .env.example .env.local   # add CSFLOAT_API_KEY and DISCORD_WEBHOOK_URL
pnpm test                    # unit tests (diff engine, pagination, client, store, worker)
pnpm typecheck
pnpm dev                     # http://localhost:3000
```

Get the API key from csfloat.com → Profile → Developers. The Discord webhook is under Channel settings → Integrations → Webhooks.

### Phase 0: check the API first

```bash
pnpm spike -- def_index=7 paint_index=44 paint_seed=661,670
```

Prints the response shape, rate-limit headers and whether several `paint_seed` values work in one call, and saves raw responses to `fixtures/`. The app doesn't depend on the answer: a watch with N seeds makes N requests.

### Run a watch from the terminal

```bash
pnpm watch:run --list
pnpm watch:run "AK CH blue gems"
pnpm watch:run --all
```

Uses the same `data/` as the app; stop the app first so there's only one writer.

## How "new" is decided

- Each watch fans out into one sub-query per seed. A sub-query is identified by a hash of its filters + seed.
- Every sub-query keeps a **seen-set** of listing IDs (last 60 days). A listing is **new** if its ID was never seen for that hash.
- The first run of a sub-query is a **baseline**: everything is recorded, nothing is flagged. Adding a seed baselines only that seed; changing filters baselines the whole watch.
- Results are fetched newest-first; paging stops early when a full page has nothing unseen.
- **Price changed** is tracked for buy-now listings only. **Gone** is only reported when the run saw the full result set.
- A failed run doesn't touch the baseline.

## Project layout

```text
schema.graphql            GraphQL schema (source of truth)
codegen.ts                resolvers-types.ts (server) + graphql.ts (client operation types)
src/instrumentation.ts    boots store, queue and cron once when the server starts
src/core/                 pure logic: types, diff, pagination, query hashing, URL parsing
src/server/               CSFloat client + rate gate, FileStore, queue, scheduler, worker, Discord
src/graphql/              resolvers, Apollo Server, operations used by the UI
src/app/                  pages + /api/graphql + /api/events (SSE)
src/components/           clay UI primitives and views
scripts/                  spike + CLI runner
deploy/                   systemd unit + packaging script
```

## Deploy on the Raspberry Pi

Use 64-bit Raspberry Pi OS with Node 22 LTS.

1. On your PC: `bash deploy/package.sh` builds `dist/` (plain JavaScript, no native modules, so it runs on the Pi's arm64).
2. Copy it over: `rsync -av --delete --exclude data --exclude .env.local dist/ pi@raspberrypi.local:/opt/csfloat-watcher/`
3. On the Pi, create `/opt/csfloat-watcher/.env.local` (see `.env.example`). Point `DATA_DIR` at a USB SSD if you have one, since every run rewrites JSON files.
4. Install the service: `sudo cp /opt/csfloat-watcher/csfloat-watcher.service /etc/systemd/system/ && sudo systemctl daemon-reload && sudo systemctl enable --now csfloat-watcher`
5. Logs: `journalctl -u csfloat-watcher -f`. Open `http://raspberrypi.local:3000`.

The UI has no login: keep it on your LAN, and use Tailscale for access away from home instead of port-forwarding. Back up `DATA_DIR` now and then.

## Notes

- One process only (`next start` or `node server.js`). Cron, the queue and the file store live inside it; don't deploy to serverless platforms.
- CSFloat rate limits are undocumented. Requests go through one shared gate (default one every 2 s, `CSFLOAT_MIN_INTERVAL_MS`), which also obeys `Retry-After` and quota headers. A rejected API key pauses cron until you resume it in the UI.
- `pnpm-lock.yaml` pins exact versions; keep it committed.
