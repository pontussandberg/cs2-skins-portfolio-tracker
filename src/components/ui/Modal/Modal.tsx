"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { StyledModal } from "./Modal.styles";

export { ModalActions, ModalTitle } from "./Modal.styles";

/**
 * Native modal <dialog> driven by `open`. `onClose` fires however it closes (Escape included),
 * so keep `open` in the parent's state and set it false there.
 */
export function Modal({ open, onClose, width = "440px", children }: { open: boolean; onClose: () => void; width?: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <StyledModal ref={ref} onClose={onClose} style={{ width: `min(92vw, ${width})` }}>
      {children}
    </StyledModal>
  );
}
