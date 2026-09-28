"use client";

import { useApolloClient } from "@apollo/client/react";
import clsx from "clsx";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type ServerEvent =
  | { type: "run.queued" | "run.started"; watchId: string; runId: string }
  | { type: "run.finished"; watchId: string; runId: string; watchName: string; added: number; priceChanged: number; gone: number; baseline: boolean }
  | { type: "run.failed"; watchId: string; runId: string; error: string }
  | { type: "watches.changed" }
  | { type: "scheduler.suspended"; reason: string };

interface Toast {
  id: number;
  tone: "success" | "danger";
  title: string;
  body?: string;
  href?: string;
}

/** Listens to /api/events and refetches active queries; shows toasts for results. */
export function LiveUpdates() {
  const client = useApolloClient();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [connected, setConnected] = useState(true);
  const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(1);

  useEffect(() => {
    const push = (t: Omit<Toast, "id">) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-3), { ...t, id }]);
      setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), 8000);
    };
    const refetchSoon = () => {
      if (refetchTimer.current) clearTimeout(refetchTimer.current);
      refetchTimer.current = setTimeout(() => {
        client.refetchQueries({ include: "active" }).catch(() => undefined);
      }, 250);
    };

    const source = new EventSource("/api/events");
    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);
    source.onmessage = (msg) => {
      let event: ServerEvent;
      try {
        event = JSON.parse(msg.data) as ServerEvent;
      } catch {
        return;
      }
      refetchSoon();
      if (event.type === "run.finished" && !event.baseline && event.added > 0) {
        push({ tone: "success", title: `${event.added} new · ${event.watchName}`, href: `/watches/${event.watchId}` });
      } else if (event.type === "run.finished" && event.baseline) {
        push({ tone: "success", title: `Baseline saved · ${event.watchName}`, body: "Future runs will flag anything new." });
      } else if (event.type === "run.failed") {
        push({ tone: "danger", title: "Run failed", body: event.error, href: `/watches/${event.watchId}` });
      } else if (event.type === "scheduler.suspended") {
        push({ tone: "danger", title: "Scheduler paused", body: event.reason });
      }
    };
    return () => {
      source.close();
      if (refetchTimer.current) clearTimeout(refetchTimer.current);
    };
  }, [client]);

  return (
    <>
      {!connected ? (
        <div className="fixed bottom-4 left-4 z-40">
          <span className="inline-flex rounded-md border border-warning-ink/30 bg-warning px-2.5 py-1 text-xs font-medium text-warning-ink">Live updates reconnecting…</span>
        </div>
      ) : null}
      <div aria-live="polite" className="fixed bottom-4 right-4 z-50 flex w-[min(92vw,360px)] flex-col gap-2">
        {toasts.map((t) => {
          const inner = (
            <>
              <p className="text-sm font-semibold">{t.title}</p>
              {t.body ? <p className="mt-0.5 line-clamp-3 text-sm opacity-90">{t.body}</p> : null}
            </>
          );
          const cls = clsx("dialog-panel block border-l-4 px-4 py-3", t.tone === "success" ? "border-l-success-ink" : "border-l-danger-ink");
          return t.href ? (
            <Link key={t.id} href={t.href} className={cls}>
              {inner}
            </Link>
          ) : (
            <div key={t.id} className={cls}>
              {inner}
            </div>
          );
        })}
      </div>
    </>
  );
}
