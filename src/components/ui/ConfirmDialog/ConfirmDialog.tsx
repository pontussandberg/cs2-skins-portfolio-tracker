"use client";

import type { ReactNode } from "react";
import { Button } from "../Button";
import { Modal, ModalActions, ModalTitle } from "../Modal";
import { Body } from "./ConfirmDialog.styles";

/** Modal confirmation for a destructive action. */
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
  return (
    <Modal open={open} onClose={onCancel}>
      <ModalTitle>{title}</ModalTitle>
      <Body>{body}</Body>
      <ModalActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button tone="danger" busy={busy} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </ModalActions>
    </Modal>
  );
}
