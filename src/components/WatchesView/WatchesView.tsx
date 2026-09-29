"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useMutation, useQuery } from "@apollo/client/react";
import { useState } from "react";
import { SystemBanner } from "@/components/SystemBanner";
import { Button, EmptyState, ErrorNote, LinkButton, PageHeader, Skeleton } from "@/components/ui";
import { WatchCard } from "@/components/WatchCard";
import { applyOrder } from "@/core/order";
import { REORDER_WATCHES, RUN_ALL, SEND_TEST_NOTIFICATION, WATCHES } from "@/graphql/operations";
import { ignore } from "@/lib/ignore";
import { Root, Tip, WatchGrid } from "./WatchesView.styles";

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
    <Root>
      <SystemBanner system={data?.system} />

      <PageHeader
        title="Watches"
        description="Saved CSFloat searches. Each one runs on its schedule or when you press Run."
        actions={
          <>
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
            <Button
              tone="primary"
              busy={runAllState.loading}
              onClick={() => runAll().catch(ignore)}
              disabled={!watches.some((w) => w.enabled)}
              title="Runs every enabled watch"
            >
              Run all
            </Button>
          </>
        }
      />

      <ErrorNote error={error ?? runAllState.error ?? sendTestState.error ?? reorderState.error} />

      {data && !data.system.discordConfigured ? <Tip>Tip: set DISCORD_WEBHOOK_URL in .env.local to get new items posted to a Discord channel.</Tip> : null}

      {loading && !data ? (
        <WatchGrid>
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i}>
              <Skeleton height="11rem" />
            </li>
          ))}
        </WatchGrid>
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
            <WatchGrid>
              {watches.map((w) => (
                <WatchCard key={w.id} watch={w} />
              ))}
            </WatchGrid>
          </SortableContext>
        </DndContext>
      )}
    </Root>
  );
}
