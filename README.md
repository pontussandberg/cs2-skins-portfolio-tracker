# CS2 Skins Portfolio Tracker

Your CS2 skin portfolio, valued the way you see it (crafts, patterns), plus saved CSFloat searches that tell you what's new. Each **watch** is a CSFloat search (item, float range, price, StatTrak, …) plus an optional list of **pattern seeds**. Watches run on a cron schedule or when you press **Run**; every run is diffed against the previous one, and only listings that appeared since then are flagged in the feed and posted to Discord.

Stack: Next.js (App Router) · GraphQL (Apollo Server + Apollo Client, GraphQL Code Generator) · p-queue + croner · JSON file store · styled-components UI in the Nord palette.

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
- Results are fetched in the watch's sort order (the `sort_by` from the pasted URL, default newest-first).
  Newest-first paging stops early when a full page has nothing unseen. Any other sort (e.g.
  `lowest_float`) tracks the top `maxPages` pages in that order and fetches all of them every run.
- **Price changed** is tracked for buy-now listings only. **Gone** is only reported when the run saw the full result set.
- A failed run doesn't touch the baseline.

## Portfolio

`/portfolio` lists the Steam inventory of the account that owns `CSFLOAT_API_KEY` (read from CSFloat's `/me/inventory`, so floats, stickers and prices come along; storage units are not included). It syncs on first open, again in the background when the last sync is over an hour old, and on **Sync inventory**.

Market value is CSFloat's float-adjusted price for each item plus attached charms. Click an item to set what it is actually worth:

- **Craft %**: the share of the stickers' reference value the craft adds (a default applies to crafted items without their own %).
- **Skin value**: market, a multiple of market (patterns, floats), or a fixed price.

**Save snapshot** freezes the portfolio (items, prices at that time, your valuations) into `data/snapshots/`. Pick one from the header dropdown to see the portfolio as it was then (read-only), compared with now.

Back up everything in `data/` with `pnpm backup` (copies it to `~/cs2-skins-portfolio-tracker-backups/<timestamp>/`, or `BACKUP_DIR`).

Valuations live in `data/portfolio.json`. They are keyed by name + seed + float, so they survive the asset id changing on trades and storage-unit moves.

## Project layout

```text
schema.graphql            GraphQL schema (source of truth)
codegen.ts                resolvers-types.ts (server) + graphql.ts (client operation types)
src/instrumentation.ts    boots store, queue and cron once when the server starts
src/core/                 pure logic: types, diff, pagination, query hashing, URL parsing
src/server/               CSFloat client + rate gate, FileStore, queue, scheduler, worker, Discord
src/graphql/              resolvers, Apollo Server, operations used by the UI
src/app/                  pages + /api/graphql + /api/events (SSE)
src/components/           UI primitives and views
scripts/                  spike + CLI runner
deploy/                   systemd unit, packaging, VPS setup + deploy scripts
```

## Deploy on the Raspberry Pi

Use 64-bit Raspberry Pi OS with Node 22 LTS.

1. On your PC: `bash deploy/package.sh` builds `dist/` (plain JavaScript, no native modules, so it runs on the Pi's arm64).
2. Copy it over: `rsync -av --delete --exclude data --exclude .env.local dist/ pi@raspberrypi.local:/opt/cs2-skins-portfolio-tracker/`
3. On the Pi, create `/opt/cs2-skins-portfolio-tracker/.env.local` (see `.env.example`). Point `DATA_DIR` at a USB SSD if you have one, since every run rewrites JSON files.
4. Install the service: `sudo cp /opt/cs2-skins-portfolio-tracker/cs2-skins-portfolio-tracker.service /etc/systemd/system/ && sudo systemctl daemon-reload && sudo systemctl enable --now cs2-skins-portfolio-tracker`
5. Logs: `journalctl -u cs2-skins-portfolio-tracker -f`. Open `http://raspberrypi.local:3000`.

Already running the old `csfloat-watcher` service? Stop and remove it first (`sudo systemctl disable --now csfloat-watcher && sudo rm /etc/systemd/system/csfloat-watcher.service`), then move `/opt/csfloat-watcher` to `/opt/cs2-skins-portfolio-tracker` (it holds `data/` and `.env.local`) before step 2.

The UI has no login: keep it on your LAN, and use Tailscale for access away from home instead of port-forwarding. Back up `DATA_DIR` now and then.

## Deploy on a VPS (Hetzner Cloud or similar)

Any Ubuntu 24.04 server works; 1 GB RAM is enough, since the app is built on your PC. Everything runs from your PC with `deploy/deploy.sh` (Git Bash on Windows is fine; it only needs `ssh` and `tar`).

1. Create the server with your SSH public key added, check that `ssh root@<ip>` works, and put `DEPLOY_HOST=root@<ip>` in `.env.local`.
2. `bash deploy/deploy.sh setup`: installs Node 22, swap, a firewall, automatic security updates, Tailscale (log in with the link it prints), the systemd service and a daily data backup. Safe to re-run.
3. Fill in the API key and webhook on the server: `ssh root@<ip> nano /etc/cs2-skins-portfolio-tracker.env`.
4. `bash deploy/deploy.sh app`: builds and ships the app, then restarts it. Run it again after every change.
5. Optional: `bash deploy/deploy.sh data` copies your local `data/` to the server (stop the app on your PC first, so the two don't diverge).
6. Install Tailscale on your PC and phone with the same account and open `http://<server-name>:3000`. The firewall only lets SSH in from the internet; the app isn't reachable without Tailscale.

### Public HTTPS with your own domain (optional)

Add an A record for a (sub)domain pointing at the server, put `DEPLOY_DOMAIN=cs2.example.com` in `.env.local`, and re-run `bash deploy/deploy.sh setup`. That installs Caddy (automatic Let's Encrypt certificate), opens ports 80/443, sets `APP_URL`, and generates `APP_PASSWORD` (printed once; it's in the server's env file). The browser asks for that password once (any username); `src/proxy.ts` enforces it whenever `APP_PASSWORD` is set, so local dev stays open. Port 3000 stays closed to the internet.

On the server: app in `/opt/cs2-skins-portfolio-tracker` (replaced on each deploy, previous one in `.old`), data in `/var/lib/cs2-skins-portfolio-tracker`, nightly backups (14 kept) in `/var/backups/cs2-skins-portfolio-tracker`. `bash deploy/deploy.sh backup` downloads a copy to your PC, and `bash deploy/deploy.sh logs` follows the logs.

## Notes

- One process only (`next start` or `node server.js`). Cron, the queue and the file store live inside it; don't deploy to serverless platforms.
- CSFloat rate limits are undocumented. Requests go through one shared gate (default one every 2 s, `CSFLOAT_MIN_INTERVAL_MS`), which also obeys `Retry-After` and quota headers. A rejected API key pauses cron until you resume it in the UI.
- `pnpm-lock.yaml` pins exact versions; keep it committed.
