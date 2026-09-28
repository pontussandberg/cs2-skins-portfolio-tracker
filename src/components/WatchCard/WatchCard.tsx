"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation } from "@apollo/client/react";
import { RunStatusBadge, RunSummaryLine } from "@/components/RunStatus";
import { Badge, Button, ErrorNote, LinkButton } from "@/components/ui";
import { describeQuery, describeSchedule, timeAgo } from "@/core/format";
import type { WatchesQuery } from "@/graphql/__generated__/graphql";
import { RUN_WATCH } from "@/graphql/operations";
import { ignore } from "@/lib/ignore";
import {
  Actions,
  ChipRow,
  DeleteButton,
  Grip,
  Header,
  ItemName,
  Main,
  Meta,
  Root,
  Status,
  Summary,
  Title,
} from "./WatchCard.styles";

type WatchItem = WatchesQuery["watches"][number];

/**
 * Dashboard card for one watch. The whole card opens the watch (the title link is stretched over
 * it); only the grip handle starts a drag, so clicks, text selection and touch scrolling stay normal.
 */
export function WatchCard({ watch }: { watch: WatchItem }) {
  const [runWatch, { loading, error }] = useMutation(RUN_WATCH, { refetchQueries: "active" });
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: watch.id });
  const running = watch.isRunning || loading;
  const shownSeeds = watch.seeds.slice(0, 8);
  const filters = describeQuery(watch.query);
  const showItem = watch.itemName && !watch.name.includes(watch.itemName);

  return (
    <Root as="li" $lift ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }} $dragging={isDragging}>
      <Header>
        <Grip ref={setActivatorNodeRef} type="button" aria-label={`Reorder ${watch.name}`} title="Drag to reorder" {...attributes} {...listeners}>
          ⠿
        </Grip>
        <Main>
          <Title href={`/watches/${watch.id}`}>{watch.name}</Title>
          {showItem ? <ItemName>{watch.itemName}</ItemName> : null}
          <Meta>
            {describeSchedule(watch.schedule)}
            {watch.nextRunAt ? ` · next ${timeAgo(watch.nextRunAt)}` : ""}
            {!watch.enabled ? " · disabled" : ""}
            {watch.notify ? "" : " · Discord off"}
          </Meta>
        </Main>
        <Status>
          {watch.unreadCount > 0 ? (
            <Badge tone="success" pulse>
              {watch.unreadCount} new
            </Badge>
          ) : null}
          <RunStatusBadge run={watch.lastRun} running={watch.isRunning} />
        </Status>
      </Header>

      {filters.length ? (
        <ChipRow>
          {filters.map((f) => (
            <Badge key={f}>{f}</Badge>
          ))}
        </ChipRow>
      ) : null}

      {shownSeeds.length ? (
        <ChipRow>
          {shownSeeds.map((s) => (
            <Badge key={s} tone="info">
              #{s}
            </Badge>
          ))}
          {watch.seeds.length > shownSeeds.length ? <Badge>+{watch.seeds.length - shownSeeds.length} more</Badge> : null}
        </ChipRow>
      ) : (
        <Meta>Any pattern</Meta>
      )}

      <Summary>
        <RunSummaryLine run={watch.lastRun} />
      </Summary>

      <ErrorNote error={error} />

      <Actions>
        <Button tone="primary" size="sm" busy={running} onClick={() => runWatch({ variables: { id: watch.id } }).catch(ignore)}>
          {running ? "Running" : "Run now"}
        </Button>
        <LinkButton href={`/watches/${watch.id}`} size="sm">
          Open
        </LinkButton>
        <DeleteButton watch={watch} size="sm" />
      </Actions>
    </Root>
  );
}
