import styled from "styled-components";
import { alpha, theme } from "@/styles/theme";

export const StyledErrorNote = styled.p`
  border: 1px solid ${alpha(theme.color.dangerInk, 30)};
  border-radius: ${theme.radius.control};
  background: ${theme.color.danger};
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: ${theme.color.dangerInk};
`;
