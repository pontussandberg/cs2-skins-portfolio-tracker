"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "../Button";
import { Actions, Body, Dialog, Title } from "./ConfirmDialog.styles";

/** Native <dialog> confirmation. */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
  busy,
}: {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <Dialog ref={ref} onCancel={onCancel}>
      <Title>{title}</Title>
      <Body>{body}</Body>
      <Actions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button tone="danger" busy={busy} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </Actions>
    </Dialog>
  );
}
