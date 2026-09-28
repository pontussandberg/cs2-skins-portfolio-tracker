"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { Spinner } from "../Spinner";
import { StyledAnchor, StyledButton, type ButtonSize, type ButtonTone } from "./Button.styles";

export type { ButtonSize, ButtonTone };

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: ButtonTone;
  size?: ButtonSize;
  busy?: boolean;
  icon?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

export function Button({ tone = "neutral", size = "md", busy, icon, disabled, type = "button", children, ...rest }: ButtonProps) {
  return (
    <StyledButton type={type} disabled={disabled || busy} $tone={tone} $size={size} {...rest}>
      {busy ? <Spinner /> : icon}
      {children}
    </StyledButton>
  );
}

/** A link that looks like a Button. `external` opens in a new tab. */
export function LinkButton({
  href,
  tone = "neutral",
  size = "md",
  external,
  className,
  children,
}: {
  href: string;
  tone?: ButtonTone;
  size?: ButtonSize;
  external?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return external ? (
    <StyledAnchor href={href} target="_blank" rel="noreferrer" $tone={tone} $size={size} className={className}>
      {children}
    </StyledAnchor>
  ) : (
    <StyledAnchor as={Link} href={href} $tone={tone} $size={size} className={className}>
      {children}
    </StyledAnchor>
  );
}
