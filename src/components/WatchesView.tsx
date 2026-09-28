"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQuery } from "@apollo/client/react";
import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";
import { describeQuery, describeSchedule, timeAgo } from "@/core/format";
import { applyOrder } from "@/core/order";
import type { WatchesQuery } from "@/graphql/__generated__/graphql";
import { REORDER_WATCHES, RUN_ALL, RUN_WATCH, SEND_TEST_NOTIFICATION, WATCHES } from "@/graphql/operations";
import { DeleteWatchButton } from "./DeleteWatchButton";
import { RunStatusBadge, RunSummaryLine } from "./RunStatus";
import { SystemBanner } from "./SystemBanner";
import { Badge, Button, Card, EmptyState, ErrorNote, LinkButton, Skeleton } from "./ui";
import { ignore } from "@/lib/ignore";

export function WatchesView() {
  const { data, loading, error } = useQuery(WATCHES, { fetchPolicy: "cache-and-network" });
  const [runAll, runAllState] = useMutation(RUN_ALL, { refetchQueries: "active" });
  const [sendTest, sendTestState] = useMutation(SEND_TEST_NOTIFICATION);
  const [testSent, setTestSent] = useState(false);
  // The server returns the saved order; write it into the cached list instead of refetching
  // everything (the watches.changed event still refreshes other open tabs).
  const [reorder, reorderState] = useMutation(REORDER_WATCHES, {
    update(cache, { data }) {
      if (!data) return;
      cache.modify({ fields: { watches: (_list, { toReference }) => data.reorderWatches.map((w) => toReference({ __typename: "Watch", id: w.id })) } });
    },
  });
  /** Order from the last drop, shown until the save finishes (or fails). */
  const [pendingOrder, setPendingOrder] = useState<string[] | null>(null);
  const sensors = useSensors(
    // A few px of movement before a drag starts, so a plain click on the handle does nothing.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const fetched = data?.watches ?? [];
  const watches = pendingOrder ? applyOrder(fetched, pendingOrder) : fetched;

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const ids = watches.map((w) => w.id);
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    setPendingOrder(next);
    reorder({ variables: { ids: next } })
      .catch(ignore)
      .finally(() => setPendingOrder(null));
  }

  return (
    <div>
      <SystemBanner system={data?.system} />

      <section className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Watches</h1>
          <p className="mt-1 text-sm text-ink-muted">Saved CSFloat searches. Each one runs on its schedule or when you press Run.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {data?.system.discordConfigured ? (
            <Button
              busy={sendTestState.loading}
              onClick={() => {
                setTestSent(false);
                sendTest().then(() => setTestSent(true), ignore);
              }}
            >
              {testSent ? "Sent to Discord" : "Send test message"}
            </Button>
          ) : null}
          <Button tone="primary" busy={runAllState.loading} onClick={() => runAll().catch(ignore)} disabled={watches.length === 0}>
            Run all
          </Button>
        </div>
      </section>

      <ErrorNote error={error ?? runAllState.error ?? sendTestState.error ?? reorderState.error} />

      {data && !data.system.discordConfigured ? (
        <p className="mb-6 text-sm text-ink-muted">Tip: set DISCORD_WEBHOOK_URL in .env.local to get new items posted to a Discord channel.</p>
      ) : null}

      {loading && !data ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : watches.length === 0 ? (
        <EmptyState
          title="No watches yet"
          body="A watch is a saved CSFloat search, optionally with a list of pattern seeds. Paste a CSFloat search URL to get started fast."
          action={
            <LinkButton href="/watches/new" tone="primary">
              Create your first watch
            </LinkButton>
          }
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={watches.map((w) => w.id)} strategy={rectSortingStrategy}>
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {watches.map((w) => (
                <WatchCard key={w.id} watch={w} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

type WatchItem = WatchesQuery["watches"][number];

function WatchCard({ watch }: { watch: WatchItem }) {
  const [runWatch, { loading, error }] = useMutation(RUN_WATCH, { refetchQueries: "active" });
  const running = watch.isRunning || loading;
  const shownSeeds = watch.seeds.slice(0, 8);
  const filters = describeQuery(watch.query);
  const showItem = watch.itemName && !watch.name.includes(watch.itemName);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: watch.id });

  // The whole card opens the watch: the title link is stretched over it, buttons sit above it.
  // Only the grip handle starts a drag, so clicks, text selection and touch scrolling stay normal.
  return (
    <Card
      as="li"
      lift
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={clsx("relative flex flex-col gap-3", isDragging && "z-20 border-accent shadow-[0_12px_32px_rgb(0_0_0/0.35)]")}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          ref={setActivatorNodeRef}
          type="button"
          className="relative z-10 -ml-2 -mt-0.5 cursor-grab touch-none rounded px-1 text-lg leading-none text-ink-muted hover:bg-surface-2 hover:text-ink active:cursor-grabbing"
          aria-label={`Reorder ${watch.name}`}
          title="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>
        <div className="min-w-0 flex-1">
          <Link href={`/watches/${watch.id}`} className="block truncate text-base font-semibold after:absolute after:inset-0 after:content-[''] hover:underline">
            {watch.name}
          </Link>
          {showItem ? <p className="truncate text-sm text-ink">{watch.itemName}</p> : null}
          <p className="text-xs text-ink-muted">
            {describeSchedule(watch.schedule)}
            {watch.nextRunAt ? ` · next ${timeAgo(watch.nextRunAt)}` : ""}
            {!watch.enabled ? " · disabled" : ""}
            {watch.notify ? "" : " · Discord off"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {watch.unreadCount > 0 ? (
            <Badge tone="success" pulse>
              {watch.unreadCount} new
            </Badge>
          ) : null}
          <RunStatusBadge run={watch.lastRun} running={watch.isRunning} />
        </div>
      </div>

      {filters.length ? (
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <Badge key={f}>{f}</Badge>
          ))}
        </div>
      ) : null}

      {shownSeeds.length ? (
        <div className="flex flex-wrap gap-1.5">
          {shownSeeds.map((s) => (
            <Badge key={s} tone="info">
              #{s}
            </Badge>
          ))}
          {watch.seeds.length > shownSeeds.length ? <Badge>+{watch.seeds.length - shownSeeds.length} more</Badge> : null}
        </div>
      ) : (
        <p className="text-xs text-ink-muted">Any pattern</p>
      )}

      <p className="text-xs">
        <RunSummaryLine run={watch.lastRun} />
      </p>

      <ErrorNote error={error} />

      <div className="mt-auto flex gap-2 border-t border-line pt-3">
        <Button tone="primary" size="sm" className="relative z-10" busy={running} onClick={() => runWatch({ variables: { id: watch.id } }).catch(ignore)}>
          {running ? "Running" : "Run now"}
        </Button>
        <LinkButton href={`/watches/${watch.id}`} size="sm" className="relative z-10">
          Open
        </LinkButton>
        <DeleteWatchButton watch={watch} size="sm" className="relative z-10 ml-auto" />
      </div>
    </Card>
  );
}
