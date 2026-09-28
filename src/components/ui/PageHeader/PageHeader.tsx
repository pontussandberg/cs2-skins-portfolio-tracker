"use client";

import type { ReactNode } from "react";
import { Actions, Description, Root, Title } from "./PageHeader.styles";

/** Page title with an optional description and actions on the right. */
export function PageHeader({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <Root>
      <div>
        <Title>{title}</Title>
        {description ? <Description>{description}</Description> : null}
      </div>
      {actions ? <Actions>{actions}</Actions> : null}
    </Root>
  );
}
