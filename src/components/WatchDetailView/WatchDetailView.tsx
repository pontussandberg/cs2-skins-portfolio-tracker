"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { DeleteWatchButton } from "@/components/DeleteWatchButton";
import { ListingCard } from "@/components/ListingCard";
import { ListingGrid } from "@/components/ListingGrid";
import { RunStatusBadge, RunSummaryLine } from "@/components/RunStatus";
import { Badge, Button, EmptyState, ErrorNote, LinkButton, PageHeader, Skeleton, Tab, TabList } from "@/components/ui";
import { WatchForm } from "@/components/WatchForm";
import { describeSchedule, sortLabel, timeAgo } from "@/core/format";
import { MARK_WATCH_SEEN, RUN_WATCH, WATCH_DETAIL } from "@/graphql/operations";
import { ignore } from "@/lib/ignore";
import {
  ChipRow,
  DangerCard,
  DangerText,
  DangerTitle,
  HeaderCard,
  Root,
  StatusRow,
  Summary,
  Table,
  TableCard,
  Td,
  Th,
  Tr,
} from "./WatchDetailView.styles";

type TabKey = "listings" | "history" | "edit";

export function WatchDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data, loading, error } = useQuery(WATCH_DETAIL, { variables: { id }, fetchPolicy: "cache-and-network" });
  const [runWatch, runState] = useMutation(RUN_WATCH, { refetchQueries: "active" });
  const [markSeen] = useMutation(MARK_WATCH_SEEN);
  const [tab, setTab] = useState<TabKey>("listings");
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
      <Root>
        <Skeleton height="9rem" />
        <Skeleton height="24rem" />
      </Root>
    );
  }
  if (error) return <ErrorNote error={error} />;
  if (!watch) {
    return <EmptyState title="Watch not found" body="It may have been deleted." action={<LinkButton href="/watches">Back to watches</LinkButton>} />;
  }

  const running = watch.isRunning || runState.loading;
  const sort = sortLabel(watch.query.sort_by);
  const tabs = [
    ["listings", `Listings (${watch.currentListings.length})`],
    ["history", `Run history (${watch.runs.length})`],
    ["edit", "Edit"],
  ] as const;

  return (
    <Root>
      <HeaderCard>
        <PageHeader
          title={watch.name}
          description={
            <>
              {describeSchedule(watch.schedule)}
              {watch.nextRunAt ? ` · next run ${timeAgo(watch.nextRunAt)}` : ""}
              {!watch.enabled ? " · disabled" : ""}
              {sort ? ` · sorted by ${sort.toLowerCase()}` : ""} · Discord {watch.notify ? "on" : "off"} · up to {watch.maxPages} page
              {watch.maxPages === 1 ? "" : "s"} per seed
            </>
          }
          actions={
            <>
              <Button tone="primary" busy={running} onClick={() => runWatch({ variables: { id } }).catch(ignore)}>
                {running ? "Running" : "Run now"}
              </Button>
              <LinkButton href={watch.csfloatSearchUrl} external>
                Open on CSFloat
              </LinkButton>
            </>
          }
        />
        <StatusRow>
          <RunStatusBadge run={watch.lastRun} running={watch.isRunning} />
          <Summary>
            <RunSummaryLine run={watch.lastRun} />
          </Summary>
        </StatusRow>
        {watch.seeds.length ? (
          <ChipRow>
            {watch.seeds.map((s) => (
              <Badge key={s} tone="info">
                #{s}
              </Badge>
            ))}
          </ChipRow>
        ) : null}
        <ErrorNote error={runState.error} />
      </HeaderCard>

      <TabList>
        {tabs.map(([key, label]) => (
          <Tab key={key} aria-selected={tab === key} onClick={() => setTab(key)}>
            {label}
          </Tab>
        ))}
      </TabList>

      {tab === "listings" ? (
        watch.currentListings.length === 0 ? (
          <EmptyState title="No listings yet" body="Run the watch to fetch the current results. The first run saves a baseline." />
        ) : (
          <ListingGrid>
            {watch.currentListings.map((l) => (
              <li key={l.id}>
                <ListingCard listing={l} kind={newIds.has(l.id) ? "NEW" : null} />
              </li>
            ))}
          </ListingGrid>
        )
      ) : null}

      {tab === "history" ? (
        watch.runs.length === 0 ? (
          <EmptyState title="No runs yet" />
        ) : (
          <TableCard>
            <Table>
              <thead>
                <Tr>
                  <Th>When</Th>
                  <Th>Trigger</Th>
                  <Th>Status</Th>
                  <Th $num>New</Th>
                  <Th $num>Price chg.</Th>
                  <Th $num>Gone</Th>
                  <Th $num>Listings</Th>
                  <Th $num>Requests</Th>
                </Tr>
              </thead>
              <tbody>
                {watch.runs.map((r) => (
                  <Tr key={r.id} title={r.error ?? undefined} $hover>
                    <Td>{timeAgo(r.finishedAt ?? r.startedAt ?? r.queuedAt)}</Td>
                    <Td $capitalize>{r.trigger.toLowerCase()}</Td>
                    <Td>
                      <RunStatusBadge run={r} />
                    </Td>
                    <Td $num $strong>
                      {r.added.length}
                    </Td>
                    <Td $num>{r.priceChanges.length}</Td>
                    <Td $num>{r.goneIds.length}</Td>
                    <Td $num>{r.total}</Td>
                    <Td $num>{r.requests}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableCard>
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
          <DangerCard>
            <div>
              <DangerTitle>Delete this watch</DangerTitle>
              <DangerText>Removes the watch and its run history. Seen-sets for its queries stay on disk.</DangerText>
            </div>
            <DeleteWatchButton watch={watch} onDeleted={() => router.push("/watches")} />
          </DangerCard>
        </>
      ) : null}
    </Root>
  );
}
