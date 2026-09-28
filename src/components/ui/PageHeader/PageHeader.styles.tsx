import styled from "styled-components";
import { mutedBody } from "@/styles/shared";

export const Root = styled.section`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
`;

export const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.025em;
`;

export const Description = styled.p`
  ${mutedBody}
  margin-top: 0.25rem;
`;

export const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;
