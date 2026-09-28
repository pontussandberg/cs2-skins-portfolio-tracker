import styled from "styled-components";
import { dialogPanel, mutedBody } from "@/styles/shared";

export const Dialog = styled.dialog`
  ${dialogPanel}
  margin: auto;
  width: min(92vw, 440px);
  padding: 1.5rem;

  &::backdrop {
    background: rgb(0 0 0 / 0.6);
    backdrop-filter: blur(4px);
  }
`;

export const Title = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
`;

export const Body = styled.div`
  ${mutedBody}
  margin-top: 0.5rem;
`;

export const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;
