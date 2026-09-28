"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { ListingCard } from "@/components/ListingCard";
import { ListingGrid } from "@/components/ListingGrid";
import { SystemBanner } from "@/components/SystemBanner";
import { Button, EmptyState, ErrorNote, LinkButton, PageHeader, Skeleton } from "@/components/ui";
import { FEED, MARK_ALL_SEEN, RUN_ALL } from "@/graphql/operations";
import { ignore } from "@/lib/ignore";
import { Root } from "./FeedView.styles";

export function FeedView() {
  const { data, loading, error } = useQuery(FEED, { variables: { limit: 150 }, fetchPolicy: "cache-and-network" });
  const [runAll, runAllState] = useMutation(RUN_ALL);
  const [markAll, markAllState] = useMutation(MARK_ALL_SEEN, { refetchQueries: "active" });

  const feed = data?.feed ?? [];
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

      {loading && !data ? (
        <ListingGrid>
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i}>
              <Skeleton aspectRatio="3 / 4" />
            </li>
          ))}
        </ListingGrid>
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
        <ListingGrid>
          {feed.map((item) => (
            <li key={item.id}>
              <ListingCard listing={item.listing} kind={item.kind === "PRICE_DROP" ? "PRICE_DROP" : "NEW"} priceBefore={item.priceBefore} watch={item.watch} />
            </li>
          ))}
        </ListingGrid>
      )}
    </Root>
  );
}
