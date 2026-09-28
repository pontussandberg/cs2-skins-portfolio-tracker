import styled from "styled-components";
import { mutedBody } from "@/styles/shared";
import { theme } from "@/styles/theme";
import { Card } from "../Card";

export const Root = styled(Card)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding-block: 3.5rem;
  text-align: center;
`;

export const Icon = styled.div`
  display: grid;
  place-items: center;
  width: 3rem;
  height: 3rem;
  border: 1px solid ${theme.color.line};
  border-radius: 9999px;
  background: ${theme.color.surface2};
  font-size: 1.25rem;
  color: ${theme.color.inkMuted};
`;

export const Title = styled.h2`
  font-size: 1rem;
  font-weight: 600;
`;

export const Body = styled.p`
  ${mutedBody}
  max-width: 28rem;
`;
