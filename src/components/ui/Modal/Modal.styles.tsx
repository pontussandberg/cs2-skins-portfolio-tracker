import styled from "styled-components";
import { dialogPanel } from "@/styles/shared";

export const StyledModal = styled.dialog`
  ${dialogPanel}
  margin: auto;
  max-height: 90dvh;
  overflow-y: auto;
  padding: 1.5rem;

  &::backdrop {
    background: rgb(0 0 0 / 0.6);
    backdrop-filter: blur(4px);
  }
`;

export const ModalTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.3;
`;

/** Buttons at the bottom of a modal, right-aligned. */
export const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
`;
