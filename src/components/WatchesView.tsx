"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import Link from "next/link";
import { useState } from "react";
import { describeSchedule, timeAgo } from "@/core/format";
import type { WatchesQuery } from "@/graphql/__generated__/graphql";
import { RUN_ALL, RUN_WATCH, SEND_TEST_NOTIFICATION, WATCHES } from "@/graphql/operations";
import { RunStatusBadge, RunSummaryLine } from "./RunStatus";
import { SystemBanner } from "./SystemBanner";
import { Badge, Button, Card, EmptyState, ErrorNote, LinkButton, Skeleton } from "./ui";
import { ignore } from "@/lib/ignore";

export function WatchesView() {
  const { data, loading, error } = useQuery(WATCHES, { fetchPolicy: "cache-and-network" });
  const [runAll, runAllState] = useMutation(RUN_ALL, { refetchQueries: "active" });
  const [sendTest, sendTestState] = useMutation(SEND_TEST_NOTIFICATION);
  const [testSent, setTestSent] = useState(false);

  const watches = data?.watches ?? [];

  return (
    <div>
      <SystemBanner system={data?.system} />

      <section className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Watches</h1>
          <p className="mt-1 text-ink-muted">Saved CSFloat searches. Each one runs on its schedule or when you press Run.</p>
        </div>
        <div className="flex flex-wrap gap-3">
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

      <ErrorNote error={error ?? runAllState.error ?? sendTestState.error} />

      {data && !data.system.discordConfigured ? (
        <p className="mb-6 text-sm text-ink-muted">Tip: set DISCORD_WEBHOOK_URL in .env.local to get new items posted to a Discord channel.</p>
      ) : null}

      {loading && !data ? (
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-48 rounded-[28px]" />
          ))}
        </div>
      ) : watches.length === 0 ? (
        <EmptyState
          title="No watches yet"
          body="A watch is a saved CSFloat search, optionally with a list of pattern seeds. Paste a CSFloat search URL to get started fast."
          action={
            <LinkButton href="/watches/new" tone="mint">
              Create your first watch
            </LinkButton>
          }
        />
      ) : (
        <ul className="grid gap-6 md:grid-cols-2">
          {watches.map((w) => (
            <WatchCard key={w.id} watch={w} />
          ))}
        </ul>
      )}
    </div>
  );
}

type WatchItem = WatchesQuery["watches"][number];

function WatchCard({ watch }: { watch: WatchItem }) {
  const [runWatch, { loading, error }] = useMutation(RUN_WATCH, { refetchQueries: "active" });
  const running = watch.isRunning || loading;
  const shownSeeds = watch.seeds.slice(0, 8);

  return (
    <Card as="li" lift className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/watches/${watch.id}`} className="block truncate text-lg font-extrabold hover:underline">
            {watch.name}
          </Link>
          <p className="text-sm text-ink-muted">
            {describeSchedule(watch.schedule)}
            {watch.nextRunAt ? ` · next ${timeAgo(watch.nextRunAt)}` : ""}
            {!watch.enabled ? " · disabled" : ""}
            {watch.notify ? "" : " · Discord off"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {watch.unreadCount > 0 ? (
            <Badge tone="mint" pulse>
              {watch.unreadCount} new
            </Badge>
          ) : null}
          <RunStatusBadge run={watch.lastRun} running={watch.isRunning} />
        </div>
      </div>

      {shownSeeds.length ? (
        <div className="flex flex-wrap gap-1.5">
          {shownSeeds.map((s) => (
            <Badge key={s} tone="lilac">
              #{s}
            </Badge>
          ))}
          {watch.seeds.length > shownSeeds.length ? <Badge>+{watch.seeds.length - shownSeeds.length} more</Badge> : null}
        </div>
      ) : (
        <p className="text-sm text-ink-muted">Any pattern</p>
      )}

      <p className="text-sm">
        <RunSummaryLine run={watch.lastRun} />
      </p>

      <ErrorNote error={error} />

      <div className="mt-auto flex gap-3">
        <Button tone="primary" size="sm" busy={running} onClick={() => runWatch({ variables: { id: watch.id } }).catch(ignore)}>
          {running ? "Running" : "Run now"}
        </Button>
        <LinkButton href={`/watches/${watch.id}`} size="sm">
          Open
        </LinkButton>
      </div>
    </Card>
  );
}
