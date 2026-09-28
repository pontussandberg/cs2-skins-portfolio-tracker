"use client";

import type { ReactNode } from "react";
import { Body, Icon, Root, Title } from "./EmptyState.styles";

export function EmptyState({ title, body, action }: { title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <Root>
      <Icon aria-hidden>◎</Icon>
      <Title>{title}</Title>
      {body ? <Body>{body}</Body> : null}
      {action}
    </Root>
  );
}
