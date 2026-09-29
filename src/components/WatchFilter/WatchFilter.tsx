"use client";

import { useEffect, useRef, useState } from "react";
import { Chip } from "@/components/ui";
import { Count, HeaderRow, List, Name, Panel, Root, Row, TextButton } from "./WatchFilter.styles";

export interface WatchOption {
  id: string;
  name: string;
  /** Listings from this watch in the feed. */
  count: number;
}

/**
 * "Watches" pill that opens a checklist of the feed's watches; unticked ones are ignored (their
 * listings hidden). Closes on Escape or a click outside.
 */
export function WatchFilter({ watches, ignored, onChange }: { watches: WatchOption[]; ignored: string[]; onChange: (ignored: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const ignoredSet = new Set(ignored);
  const hiddenCount = watches.filter((w) => ignoredSet.has(w.id)).length;

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (id: string, show: boolean) => onChange(show ? ignored.filter((x) => x !== id) : [...ignored, id]);

  return (
    <Root ref={root}>
      <Chip type="button" aria-expanded={open} aria-haspopup="true" data-active={hiddenCount > 0} onClick={() => setOpen(!open)}>
        Watches{hiddenCount > 0 ? ` · ${hiddenCount} ignored` : ""} ▾
      </Chip>
      {open ? (
        <Panel>
          <HeaderRow>
            <span>Show listings from</span>
            <span>
              <TextButton type="button" onClick={() => onChange([])}>
                All
              </TextButton>
              {" · "}
              <TextButton type="button" onClick={() => onChange(watches.map((w) => w.id))}>
                None
              </TextButton>
            </span>
          </HeaderRow>
          <List>
            {watches.map((w) => (
              <li key={w.id}>
                <Row>
                  <input type="checkbox" checked={!ignoredSet.has(w.id)} onChange={(e) => toggle(w.id, e.target.checked)} />
                  <Name title={w.name}>{w.name}</Name>
                  <Count>{w.count}</Count>
                </Row>
              </li>
            ))}
          </List>
        </Panel>
      ) : null}
    </Root>
  );
}
