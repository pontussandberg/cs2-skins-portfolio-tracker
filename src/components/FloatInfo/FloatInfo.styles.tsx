import styled from "styled-components";
import { tabular } from "@/styles/shared";
import { theme } from "@/styles/theme";

const { color } = theme;

export const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

export const Row = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.75rem;
`;

export const Value = styled.span`
  ${tabular}
  font-family: ${theme.font.mono};
  color: ${color.ink};
`;

export const WearLabel = styled.span`
  font-weight: 600;
  color: ${color.inkMuted};
`;

export const Seed = styled.span`
  font-weight: 400;
`;

export const BarRoot = styled.div`
  position: relative;
  pointer-events: none;
`;

export const Segments = styled.div`
  display: flex;
  height: 0.25rem;
  overflow: hidden;
  border-radius: 9999px;
  opacity: 0.8;
`;

export const Marker = styled.div`
  position: absolute;
  top: -0.25rem;
  width: 0.125rem;
  height: 0.75rem;
  transform: translateX(-50%);
  border-radius: 9999px;
  background: ${color.ink};
  box-shadow: 0 0 0 2px ${color.surface};
`;
