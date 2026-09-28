"use client";

import { useApolloClient } from "@apollo/client/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Reconnecting, Toast, ToastBody, ToastStack, ToastTitle } from "./LiveUpdates.styles";

type ServerEvent =
  | { type: "run.queued" | "run.started"; watchId: string; runId: string }
  | { type: "run.finished"; watchId: string; runId: string; watchName: string; added: number; priceChanged: number; gone: number; baseline: boolean }
  | { type: "run.failed"; watchId: string; runId: string; error: string }
  | { type: "watches.changed" }
  | { type: "scheduler.suspended"; reason: string };

interface ToastData {
  id: number;
  tone: "success" | "danger";
  title: string;
  body?: string;
  href?: string;
}

/** Listens to /api/events and refetches active queries; shows toasts for results. */
export function LiveUpdates() {
  const client = useApolloClient();
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [connected, setConnected] = useState(true);
  const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(1);

  useEffect(() => {
    const push = (t: Omit<ToastData, "id">) => {
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
      {!connected ? <Reconnecting>Live updates reconnecting…</Reconnecting> : null}
      <ToastStack aria-live="polite">
        {toasts.map((t) => {
          const inner = (
            <>
              <ToastTitle>{t.title}</ToastTitle>
              {t.body ? <ToastBody>{t.body}</ToastBody> : null}
            </>
          );
          return t.href ? (
            <Toast key={t.id} as={Link} href={t.href} $tone={t.tone}>
              {inner}
            </Toast>
          ) : (
            <Toast key={t.id} $tone={t.tone}>
              {inner}
            </Toast>
          );
        })}
      </ToastStack>
    </>
  );
}
