import type { DiffResult, ListingSnap, PriceChange, QueryState, RunRecord, FeedItem } from "./types";

export const SEEN_RETENTION_DAYS = 60;

export interface DiffInput {
  hash: string;
  prev: QueryState | null;
  current: ListingSnap[];
  /** True when pagination reached the end of the result set. */
  coveredFully: boolean;
  now: Date;
}

export interface DiffOutput {
  diff: DiffResult;
  next: QueryState;
}

/**
 * Pure diff for one sub-query.
 * - new:           listing id never seen for this query hash
 * - price changed: in last snapshot, price differs (buy-now only; auction prices move with bids)
 * - gone:          in last snapshot, missing now, and this run covered the full result set
 * First run (no prev) is a baseline: everything is recorded, nothing is flagged.
 */
export function diffQuery({ hash, prev, current, coveredFully, now }: DiffInput): DiffOutput {
  const nowIso = now.toISOString();
  const unique = dedupeById(current);

  const seen: Record<string, string> = {};
  const cutoff = now.getTime() - SEEN_RETENTION_DAYS * 86_400_000;
  for (const [id, at] of Object.entries(prev?.seen ?? {})) {
    if (new Date(at).getTime() >= cutoff) seen[id] = at;
  }
  for (const l of unique) seen[l.id] = nowIso;

  const next: QueryState = {
    hash,
    lastSnapshot: unique,
    coveredFully,
    seen,
    lastRunAt: nowIso,
  };

  if (!prev) {
    return { diff: { baseline: true, added: [], priceChanged: [], gone: [] }, next };
  }

  const prevSeen = prev.seen;
  const prevById = new Map(prev.lastSnapshot.map((l) => [l.id, l]));
  const currentIds = new Set(unique.map((l) => l.id));

  const added = unique.filter((l) => !(l.id in prevSeen));

  const priceChanged: PriceChange[] = [];
  for (const l of unique) {
    const before = prevById.get(l.id);
    if (before && before.price !== l.price && l.type === "buy_now") {
      priceChanged.push({ id: l.id, before: before.price, after: l.price, listing: l });
    }
  }

  const gone = coveredFully ? prev.lastSnapshot.filter((l) => !currentIds.has(l.id)).map((l) => l.id) : [];

  return { diff: { baseline: false, added, priceChanged, gone }, next };
}

/** Merge per-seed diffs into one watch-level diff. */
export function mergeDiffs(diffs: DiffResult[]): DiffResult {
  const added = dedupeById(diffs.flatMap((d) => d.added));
  const seenPc = new Set<string>();
  const priceChanged = diffs
    .flatMap((d) => d.priceChanged)
    .filter((p) => (seenPc.has(p.id) ? false : (seenPc.add(p.id), true)));
  const gone = [...new Set(diffs.flatMap((d) => d.gone))];
  const baseline = diffs.length > 0 && diffs.every((d) => d.baseline);
  return { baseline, added, priceChanged, gone };
}

export function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

/** Flatten finished runs into feed items: every new listing and every price drop. Newest first. */
export function buildFeed(runs: RunRecord[], limit: number): FeedItem[] {
  const items: FeedItem[] = [];
  const done = runs
    .filter((r) => r.status === "done" && r.finishedAt)
    .sort((a, b) => (b.finishedAt! < a.finishedAt! ? -1 : b.finishedAt! > a.finishedAt! ? 1 : 0));
  for (const run of done) {
    const at = run.finishedAt!;
    const added = [...run.added].sort((a, b) => (b.createdAt < a.createdAt ? -1 : 1));
    for (const l of added) {
      items.push({ id: `${run.id}:new:${l.id}`, kind: "NEW", at, listing: l, priceBefore: null, runId: run.id, watchId: run.watchId });
    }
    for (const p of run.priceChanged) {
      if (p.after < p.before) {
        items.push({ id: `${run.id}:drop:${p.id}`, kind: "PRICE_DROP", at, listing: p.listing, priceBefore: p.before, runId: run.id, watchId: run.watchId });
      }
    }
    if (items.length >= limit) break;
  }
  return items.slice(0, limit);
}

/** New items in finished runs since the watch was last opened. */
export function countUnread(runs: RunRecord[], lastSeenAt: string | null): number {
  return runs
    .filter((r) => r.status === "done" && r.finishedAt && (!lastSeenAt || r.finishedAt > lastSeenAt))
    .reduce((n, r) => n + r.added.length, 0);
}
