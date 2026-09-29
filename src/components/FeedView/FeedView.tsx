"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { ListingCard } from "@/components/ListingCard";
import { ListingGrid } from "@/components/ListingGrid";
import { SystemBanner } from "@/components/SystemBanner";
import { WatchFilter, type WatchOption } from "@/components/WatchFilter";
import { Button, ChipGroup, EmptyState, ErrorNote, LinkButton, PageHeader, Skeleton, ToggleChip } from "@/components/ui";
import { formatPercent } from "@/core/format";
import { FEED, MARK_ALL_SEEN, RUN_ALL } from "@/graphql/operations";
import { ignore } from "@/lib/ignore";
import { useStoredState } from "@/lib/useStoredState";
import { ClearFilters, Divider, FilterBar, Root, Summary } from "./FeedView.styles";

/** Default cap on the sticker percentage: the feed is for deals, not overpriced crafts. */
const DEFAULT_MAX_SP = 30;
const SP_OPTIONS: { value: number | null; label: string }[] = [...[10, 20, 30, 50, 100].map((v) => ({ value: v, label: formatPercent(v) })), { value: null, label: "Any" }];

export function FeedView() {
  const { data, loading, error } = useQuery(FEED, { variables: { limit: 150 }, fetchPolicy: "cache-and-network" });
  const [runAll, runAllState] = useMutation(RUN_ALL);
  const [markAll, markAllState] = useMutation(MARK_ALL_SEEN, { refetchQueries: "active" });

  // Highest sticker percentage shown; null = no cap.
  const [maxSp, setMaxSp] = useStoredState<number | null>("feed.maxStickerPercent", DEFAULT_MAX_SP);
  const [stickersOnly, setStickersOnly] = useStoredState("feed.stickersOnly", true);
  /** Ids of watches whose listings are hidden. */
  const [ignoredWatches, setIgnoredWatches] = useStoredState<string[]>("feed.ignoredWatches", []);

  const all = data?.feed ?? [];
  const watches = feedWatches(all);
  const feed = all.filter(({ listing: l, watch }) => {
    if (watch && ignoredWatches.includes(watch.id)) return false;
    if (stickersOnly && l.stickerDetails.length === 0) return false;
    // A listing without a known SP passes the cap: there is nothing to judge it by.
    return maxSp === null || l.stickerPercent == null || l.stickerPercent <= maxSp;
  });
  const hidden = all.length - feed.length;
  const newCount = feed.filter((f) => f.kind === "NEW").length;
  const dropCount = feed.length - newCount;

  return (
    <Root>
      <SystemBanner system={data?.system} />

      <PageHeader
        title="What's new"
        description={
          feed.length
            ? `${newCount} new listing${newCount === 1 ? "" : "s"} and ${dropCount} price drop${dropCount === 1 ? "" : "s"} across your watches.`
            : "New listings from every watch land here."
        }
        actions={
          <>
            <Button onClick={() => markAll().catch(ignore)} busy={markAllState.loading}>
              Mark all read
            </Button>
            <Button tone="primary" onClick={() => runAll().catch(ignore)} busy={runAllState.loading}>
              Run all watches
            </Button>
          </>
        }
      />

      <ErrorNote error={error ?? runAllState.error} />

      <FilterBar aria-label="Filters">
        {watches.length > 1 ? (
          <>
            <WatchFilter watches={watches} ignored={ignoredWatches} onChange={setIgnoredWatches} />
            <Divider aria-hidden />
          </>
        ) : null}
        <ToggleChip pressed={stickersOnly} onChange={setStickersOnly} title="Hide listings without stickers">
          With stickers
        </ToggleChip>
        <Divider aria-hidden />
        <ChipGroup
          label="Max SP"
          title="Hide listings asking more than this share of the stickers' value on top of the skin price"
          options={SP_OPTIONS}
          value={maxSp}
          onChange={setMaxSp}
        />
        <Summary>
          {hidden > 0 ? (
            <>
              Showing {feed.length} of {all.length} ·{" "}
              <ClearFilters
                type="button"
                onClick={() => {
                  setIgnoredWatches([]);
                  setStickersOnly(false);
                  setMaxSp(null);
                }}
              >
                Clear filters
              </ClearFilters>
            </>
          ) : (
            `${all.length} listing${all.length === 1 ? "" : "s"}`
          )}
        </Summary>
      </FilterBar>

      {loading && !data ? (
        <ListingGrid>
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i}>
              <Skeleton aspectRatio="3 / 4" />
            </li>
          ))}
        </ListingGrid>
      ) : all.length === 0 ? (
        <EmptyState
          title="Nothing new yet"
          body="Create a watch, run it once to save a baseline, and anything listed after that shows up here (and in Discord)."
          action={
            <LinkButton href="/watches/new" tone="primary">
              Create a watch
            </LinkButton>
          }
        />
      ) : feed.length === 0 ? (
        <EmptyState title="Nothing matches your filters" body={`All ${all.length} recent listings are hidden by the sticker filters above.`} />
      ) : (
        <ListingGrid>
          {feed.map((item) => (
            <li key={item.id}>
              <ListingCard listing={item.listing} kind={item.kind === "PRICE_DROP" ? "PRICE_DROP" : item.unread ? "NEW" : null} priceBefore={item.priceBefore} watch={item.watch} />
            </li>
          ))}
        </ListingGrid>
      )}
    </Root>
  );
}

/** The watches in the feed with their listing counts, most listings first. */
function feedWatches(items: { watch: { id: string; name: string } | null }[]): WatchOption[] {
  const byId = new Map<string, WatchOption>();
  for (const { watch } of items) {
    if (!watch) continue;
    const entry = byId.get(watch.id) ?? { id: watch.id, name: watch.name, count: 0 };
    entry.count += 1;
    byId.set(watch.id, entry);
  }
  return [...byId.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
