"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { FEED, MARK_ALL_SEEN, RUN_ALL } from "@/graphql/operations";
import { LISTING_GRID, ListingCard } from "./ListingCard";
import { SystemBanner } from "./SystemBanner";
import { Button, EmptyState, ErrorNote, LinkButton, Skeleton } from "./ui";
import { ignore } from "@/lib/ignore";

export function FeedView() {
  const { data, loading, error } = useQuery(FEED, { variables: { limit: 150 }, fetchPolicy: "cache-and-network" });
  const [runAll, runAllState] = useMutation(RUN_ALL);
  const [markAll, markAllState] = useMutation(MARK_ALL_SEEN, { refetchQueries: "active" });

  const feed = data?.feed ?? [];
  const newCount = feed.filter((f) => f.kind === "NEW").length;
  const dropCount = feed.length - newCount;

  return (
    <div>
      <SystemBanner system={data?.system} />

      <section className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">What&apos;s new</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {feed.length ? `${newCount} new listing${newCount === 1 ? "" : "s"} and ${dropCount} price drop${dropCount === 1 ? "" : "s"} across your watches.` : "New listings from every watch land here."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => markAll().catch(ignore)} busy={markAllState.loading}>
            Mark all read
          </Button>
          <Button tone="primary" onClick={() => runAll().catch(ignore)} busy={runAllState.loading}>
            Run all watches
          </Button>
        </div>
      </section>

      <ErrorNote error={error ?? runAllState.error} />

      {loading && !data ? (
        <div className={LISTING_GRID}>
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="aspect-[3/4]" />
          ))}
        </div>
      ) : feed.length === 0 ? (
        <EmptyState
          title="Nothing new yet"
          body="Create a watch, run it once to save a baseline, and anything listed after that shows up here (and in Discord)."
          action={
            <LinkButton href="/watches/new" tone="primary">
              Create a watch
            </LinkButton>
          }
        />
      ) : (
        <div className={LISTING_GRID}>
          {feed.map((item) => (
            <ListingCard key={item.id} listing={item.listing} kind={item.kind === "PRICE_DROP" ? "PRICE_DROP" : "NEW"} priceBefore={item.priceBefore} watch={item.watch} />
          ))}
        </div>
      )}
    </div>
  );
}
