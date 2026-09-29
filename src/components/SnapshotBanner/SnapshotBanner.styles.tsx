import styled from "styled-components";
import { Card } from "@/components/ui";
import { mutedBody, stack, tabular } from "@/styles/shared";
import { alpha, theme } from "@/styles/theme";

const { color } = theme;

export const Root = styled(Card)`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  border-color: ${alpha(color.infoInk, 45)};
  background: ${color.info};
`;

export const Text = styled.div`
  ${stack("0.375rem")}
  ${mutedBody}
  flex: 1 1 22rem;
`;

export const Title = styled.h2`
  font-size: 1rem;
  font-weight: 600;
  color: ${color.ink};
`;

export const Compare = styled.div`
  ${stack("0.125rem")}
  ${tabular}
  color: ${color.ink};
`;

export const Change = styled.span<{ $up: boolean }>`
  font-weight: 600;
  color: ${({ $up }) => ($up ? color.successInk : color.dangerInk)};
`;

export const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
`;
