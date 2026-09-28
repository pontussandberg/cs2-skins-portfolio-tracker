import styled from "styled-components";
import { stack } from "@/styles/shared";
import { alpha, theme } from "@/styles/theme";

export const Stack = styled.div`
  ${stack("0.75rem")}
`;

export const Note = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border: 1px solid ${alpha(theme.color.warningInk, 30)};
  border-radius: ${theme.radius.card};
  background: ${theme.color.warning};
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: ${theme.color.warningInk};
`;
