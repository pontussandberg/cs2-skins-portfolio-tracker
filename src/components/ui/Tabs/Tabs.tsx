"use client";

import type { ButtonHTMLAttributes, ComponentProps } from "react";
import { StyledTab, StyledTabList } from "./Tabs.styles";

/** Navigation tab; mark the active one with `aria-current="page"`. */
export { StyledTabLink as TabLink } from "./Tabs.styles";

/** Row of underline tabs. */
export function TabList(props: ComponentProps<"div">) {
  return <StyledTabList role="tablist" {...props} />;
}

/** In-page tab; mark the active one with `aria-selected`. */
export function Tab(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <StyledTab type="button" role="tab" {...props} />;
}
