import styled from "styled-components";
import { theme } from "@/styles/theme";

export const SummaryText = styled.span<{ $failed?: boolean }>`
  color: ${({ $failed }) => ($failed ? theme.color.dangerInk : theme.color.inkMuted)};
`;
