import { diffQuery, mergeDiffs, type DiffOutput } from "@/core/diff";
import { paginate } from "@/core/paginate";
import { buildSubQueries, PAGE_LIMIT } from "@/core/queryHash";
import type { RunRecord } from "@/core/types";
import type { CsfloatClient } from "../csfloat/client";
import { CsfloatAuthError } from "../csfloat/errors";
import type { EventBus } from "../events";
import type { Logger } from "../logger";
import type { DiscordNotifier } from "../notify/discord";
import type { Store } from "../store/Store";

export interface WorkerDeps {
  store: Store;
  client: CsfloatClient;
  bus: EventBus;
  logger: Logger;
  notifier: DiscordNotifier;
  onAuthError: (message: string) => void;
}

/**
 * Execute one queued run: fan out seeds -> paginate -> diff each sub-query -> commit -> emit -> notify.
 * Never throws; failures are recorded on the run. Query state is only committed when every
 * sub-query succeeded, so a failed run leaves the previous baseline intact.
 */
export async function executeRun(deps: WorkerDeps, runId: string): Promise<RunRecord | null> {
  const { store, client, bus, logger, notifier } = deps;
  const queued = await store.getRun(runId);
  if (!queued) return null;
  const log = logger.child({ runId, watchId: queued.watchId });

  let run: RunRecord = { ...queued, status: "running", startedAt: new Date().toISOString() };
  await store.saveRun(run);
  bus.emit({ type: "run.started", watchId: run.watchId, runId });

  const requestsBefore = client.requestCount;
  try {
    const watch = await store.getWatch(run.watchId);
    if (!watch) throw new Error("Watch was deleted");

    const outputs: DiffOutput[] = [];
    for (const sub of buildSubQueries(watch)) {
      const prev = await store.getQueryState(sub.hash);
      const result = await paginate((cursor) => client.fetchListingsPage(sub.params, cursor), {
        maxPages: watch.maxPages,
        pageSize: PAGE_LIMIT,
        knownIds: prev ? new Set(Object.keys(prev.seen)) : null,
      });
      log.debug({ seed: sub.seed, pages: result.pages, items: result.items.length, stop: result.stoppedBecause }, "sub-query fetched");
      outputs.push(diffQuery({ hash: sub.hash, prev, current: result.items, coveredFully: result.coveredFully, now: new Date() }));
    }

    const merged = mergeDiffs(outputs.map((o) => o.diff));
    await store.saveQueryStates(outputs.map((o) => o.next));

    run = {
      ...run,
      status: "done",
      finishedAt: new Date().toISOString(),
      requests: client.requestCount - requestsBefore,
      baseline: merged.baseline,
      total: outputs.reduce((n, o) => n + o.next.lastSnapshot.length, 0),
      added: merged.added,
      priceChanged: merged.priceChanged,
      gone: merged.gone,
      error: null,
    };
    await store.saveRun(run);
    log.info(
      { added: run.added.length, priceChanged: run.priceChanged.length, gone: run.gone.length, baseline: run.baseline, requests: run.requests },
      "run finished",
    );
    bus.emit({
      type: "run.finished",
      watchId: run.watchId,
      runId,
      watchName: watch.name,
      added: run.added.length,
      priceChanged: run.priceChanged.length,
      gone: run.gone.length,
      baseline: run.baseline,
    });

    if (watch.notify && run.added.length > 0) {
      await notifier.notifyNewItems(watch, run.added);
    }
    return run;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    run = {
      ...run,
      status: "failed",
      finishedAt: new Date().toISOString(),
      requests: client.requestCount - requestsBefore,
      error: message,
    };
    await store.saveRun(run);
    log.error({ err }, "run failed");
    bus.emit({ type: "run.failed", watchId: run.watchId, runId, error: message });
    if (err instanceof CsfloatAuthError || (err instanceof Error && err.name === "CsfloatAuthError")) deps.onAuthError(message);
    return run;
  }
}
