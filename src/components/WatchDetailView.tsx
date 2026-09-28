"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { describeSchedule, sortLabel, timeAgo } from "@/core/format";
import { MARK_WATCH_SEEN, RUN_WATCH, WATCH_DETAIL } from "@/graphql/operations";
import { DeleteWatchButton } from "./DeleteWatchButton";
import { ListingCard } from "./ListingCard";
import { RunStatusBadge, RunSummaryLine } from "./RunStatus";
import { Badge, Button, Card, EmptyState, ErrorNote, LinkButton, Skeleton } from "./ui";
import { WatchForm } from "./WatchForm";
import { ignore } from "@/lib/ignore";

type Tab = "listings" | "history" | "edit";

export function WatchDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data, loading, error } = useQuery(WATCH_DETAIL, { variables: { id }, fetchPolicy: "cache-and-network" });
  const [runWatch, runState] = useMutation(RUN_WATCH, { refetchQueries: "active" });
  const [markSeen] = useMutation(MARK_WATCH_SEEN);
  const [tab, setTab] = useState<Tab>("listings");
  const markedFor = useRef<string | null>(null);

  const watch = data?.watch;

  // Opening a watch clears its unread badge.
  useEffect(() => {
    if (watch && markedFor.current !== watch.id) {
      markedFor.current = watch.id;
      markSeen({ variables: { id: watch.id } }).catch(ignore);
    }
  }, [watch, markSeen]);

  const newIds = useMemo(() => new Set(watch?.lastRun?.status === "DONE" ? watch.lastRun.added.map((a) => a.id) : []), [watch]);

  if (loading && !data) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-40 rounded-[28px]" />
        <Skeleton className="h-96 rounded-[28px]" />
      </div>
    );
  }
  if (error) return <ErrorNote error={error} />;
  if (!watch) {
    return <EmptyState title="Watch not found" body="It may have been deleted." action={<LinkButton href="/watches">Back to watches</LinkButton>} />;
  }

  const running = watch.isRunning || runState.loading;
  const sort = sortLabel(watch.query.sort_by);

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{watch.name}</h1>
            <p className="mt-1 text-sm text-ink-muted">
              {describeSchedule(watch.schedule)}
              {watch.nextRunAt ? ` · next run ${timeAgo(watch.nextRunAt)}` : ""}
              {!watch.enabled ? " · disabled" : ""}
              {sort ? ` · sorted by ${sort.toLowerCase()}` : ""} · Discord {watch.notify ? "on" : "off"} · up to {watch.maxPages} page{watch.maxPages === 1 ? "" : "s"} per seed
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button tone="primary" busy={running} onClick={() => runWatch({ variables: { id } }).catch(ignore)}>
              {running ? "Running" : "Run now"}
            </Button>
            <LinkButton href={watch.csfloatSearchUrl} external>
              Open on CSFloat
            </LinkButton>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RunStatusBadge run={watch.lastRun} running={watch.isRunning} />
          <span className="text-sm">
            <RunSummaryLine run={watch.lastRun} />
          </span>
        </div>
        {watch.seeds.length ? (
          <div className="flex flex-wrap gap-1.5">
            {watch.seeds.map((s) => (
              <Badge key={s} tone="lilac">
                #{s}
              </Badge>
            ))}
          </div>
        ) : null}
        <ErrorNote error={runState.error} />
      </Card>

      <div className="clay flex w-fit gap-1 rounded-full p-1.5" role="tablist">
        {(
          [
            ["listings", `Listings (${watch.currentListings.length})`],
            ["history", `Run history (${watch.runs.length})`],
            ["edit", "Edit"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={clsx("rounded-full px-4 py-2 text-sm font-bold transition", tab === key ? "clay-sm bg-accent text-accent-ink" : "text-ink-muted hover:text-ink")}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "listings" ? (
        watch.currentListings.length === 0 ? (
          <EmptyState title="No listings yet" body="Run the watch to fetch the current results. The first run saves a baseline." />
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {watch.currentListings.map((l) => (
              <li key={l.id} className="grid">
                <ListingCard listing={l} kind={newIds.has(l.id) ? "NEW" : null} />
              </li>
            ))}
          </ul>
        )
      ) : null}

      {tab === "history" ? (
        watch.runs.length === 0 ? (
          <EmptyState title="No runs yet" />
        ) : (
          <Card className="overflow-x-auto p-3 sm:p-4">
            <table className="w-full min-w-[640px] border-separate border-spacing-y-1.5 text-sm">
              <thead>
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-ink-muted">
                  <th className="px-3 py-2">When</th>
                  <th className="px-3 py-2">Trigger</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">New</th>
                  <th className="px-3 py-2 text-right">Price chg.</th>
                  <th className="px-3 py-2 text-right">Gone</th>
                  <th className="px-3 py-2 text-right">Listings</th>
                  <th className="px-3 py-2 text-right">Requests</th>
                </tr>
              </thead>
              <tbody>
                {watch.runs.map((r, i) => (
                  <tr key={r.id} className={i % 2 ? "bg-surface-2/60" : ""} title={r.error ?? undefined}>
                    <td className="rounded-l-2xl px-3 py-2">{timeAgo(r.finishedAt ?? r.startedAt ?? r.queuedAt)}</td>
                    <td className="px-3 py-2 capitalize">{r.trigger.toLowerCase()}</td>
                    <td className="px-3 py-2">
                      <RunStatusBadge run={r} />
                    </td>
                    <td className="tabular px-3 py-2 text-right font-bold">{r.added.length}</td>
                    <td className="tabular px-3 py-2 text-right">{r.priceChanges.length}</td>
                    <td className="tabular px-3 py-2 text-right">{r.goneIds.length}</td>
                    <td className="tabular px-3 py-2 text-right">{r.total}</td>
                    <td className="tabular rounded-r-2xl px-3 py-2 text-right">{r.requests}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )
      ) : null}

      {tab === "edit" ? (
        <>
          <WatchForm
            mode="edit"
            initial={{
              id: watch.id,
              name: watch.name,
              query: watch.query,
              seeds: watch.seeds,
              schedule: watch.schedule,
              maxPages: watch.maxPages,
              enabled: watch.enabled,
              notify: watch.notify,
            }}
            onSaved={() => setTab("listings")}
          />
          <Card className="flex flex-wrap items-center justify-between gap-4 bg-peach text-peach-ink">
            <div>
              <h2 className="font-extrabold">Delete this watch</h2>
              <p className="text-sm">Removes the watch and its run history. Seen-sets for its queries stay on disk.</p>
            </div>
            <DeleteWatchButton watch={watch} onDeleted={() => router.push("/watches")} />
          </Card>
        </>
      ) : null}

    </div>
  );
}
