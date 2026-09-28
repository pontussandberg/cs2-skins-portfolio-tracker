import styled from "styled-components";
import { dialogPanel, lineClamp, stack } from "@/styles/shared";
import { alpha, theme } from "@/styles/theme";

export const Reconnecting = styled.span`
  position: fixed;
  bottom: 1rem;
  left: 1rem;
  z-index: ${theme.z.status};
  border: 1px solid ${alpha(theme.color.warningInk, 30)};
  border-radius: 0.375rem;
  background: ${theme.color.warning};
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${theme.color.warningInk};
`;

export const ToastStack = styled.div`
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: ${theme.z.toast};
  ${stack("0.5rem")}
  width: min(92vw, 360px);
`;

export const Toast = styled.div<{ $tone: "success" | "danger" }>`
  ${dialogPanel}
  display: block;
  border-left: 4px solid ${({ $tone }) => ($tone === "success" ? theme.color.successInk : theme.color.dangerInk)};
  padding: 0.75rem 1rem;
`;

export const ToastTitle = styled.p`
  font-size: 0.875rem;
  font-weight: 600;
`;

export const ToastBody = styled.p`
  ${lineClamp(3)}
  margin-top: 0.125rem;
  font-size: 0.875rem;
  opacity: 0.9;
`;
