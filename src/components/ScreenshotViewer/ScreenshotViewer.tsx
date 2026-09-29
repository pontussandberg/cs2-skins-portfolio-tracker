"use client";

import { useState } from "react";
import { Button, LinkButton, Modal, ModalActions, ModalTitle, Spinner, Tab, TabList } from "@/components/ui";
import { Frame, Image, Loading } from "./ScreenshotViewer.styles";

type Side = "playside" | "backside";

const SIDES: { id: Side; label: string }[] = [
  { id: "playside", label: "Play side" },
  { id: "backside", label: "Back side" },
];

/**
 * "Screenshots" button that opens CSFloat's in-game screenshots of an item, play side and back side.
 * The dialog only exists while open (cards stay light), and the images are large: the side you're
 * looking at loads first, the other one right after, so switching is instant without paying for
 * both up front.
 */
export function ScreenshotViewer({ name, screenshots, csfloatUrl }: { name: string; screenshots: Record<Side, string>; csfloatUrl?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        Screenshots
      </Button>
      {open ? <ViewerDialog name={name} screenshots={screenshots} csfloatUrl={csfloatUrl} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function ViewerDialog({ name, screenshots, csfloatUrl, onClose }: { name: string; screenshots: Record<Side, string>; csfloatUrl?: string; onClose: () => void }) {
  const [side, setSide] = useState<Side>("playside");
  const [loaded, setLoaded] = useState<Partial<Record<Side, boolean>>>({});
  // The selected side, any side already loaded, and (once the selected side is in) the other one too.
  const mounted = SIDES.filter((s) => s.id === side || loaded[s.id] || loaded[side]);

  return (
    <Modal open onClose={onClose} width="960px">
      <ModalTitle>{name}</ModalTitle>
      <TabList>
        {SIDES.map((s) => (
          <Tab key={s.id} aria-selected={side === s.id} onClick={() => setSide(s.id)}>
            {s.label}
          </Tab>
        ))}
      </TabList>
      <Frame>
        {!loaded[side] ? (
          <Loading>
            <Spinner /> Loading screenshot…
          </Loading>
        ) : null}
        {mounted.map((s) => (
          // eslint-disable-next-line @next/next/no-img-element
          <Image
            key={s.id}
            src={screenshots[s.id]}
            alt={`${name}, ${s.label.toLowerCase()}`}
            $hidden={side !== s.id || !loaded[s.id]}
            onLoad={() => setLoaded((prev) => ({ ...prev, [s.id]: true }))}
          />
        ))}
      </Frame>
      <ModalActions>
        {csfloatUrl ? (
          <LinkButton href={csfloatUrl} external>
            Open on CSFloat
          </LinkButton>
        ) : null}
        <Button tone="primary" onClick={onClose}>
          Close
        </Button>
      </ModalActions>
    </Modal>
  );
}
