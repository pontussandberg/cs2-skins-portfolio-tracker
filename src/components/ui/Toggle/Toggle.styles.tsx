import styled from "styled-components";
import { mutedText, visuallyHidden } from "@/styles/shared";
import { theme } from "@/styles/theme";

export const Root = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-block: 0.25rem;
  cursor: pointer;
`;

export const Text = styled.span`
  display: flex;
  flex-direction: column;
`;

export const Label = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
`;

export const Description = styled.span`
  ${mutedText}
`;

export const Switch = styled.span`
  position: relative;
  display: inline-flex;
`;

export const HiddenInput = styled.input`
  ${visuallyHidden}
`;

export const Track = styled.span`
  display: block;
  width: 2.75rem;
  height: 1.5rem;
  border: 1px solid ${theme.color.line};
  border-radius: 9999px;
  background: ${theme.color.surface2};
  transition:
    background-color ${theme.motion.fast},
    border-color ${theme.motion.fast};

  ${HiddenInput}:checked ~ & {
    border-color: ${theme.color.accent};
    background: ${theme.color.accent};
  }
  ${HiddenInput}:focus-visible ~ & {
    outline: 2px solid ${theme.color.accent};
    outline-offset: 2px;
  }
`;

export const Knob = styled.span`
  position: absolute;
  top: 0.25rem;
  left: 0.25rem;
  width: 1rem;
  height: 1rem;
  border-radius: 9999px;
  background: ${theme.color.ink};
  transition: transform ${theme.motion.fast};

  ${HiddenInput}:checked ~ & {
    transform: translateX(1.25rem);
  }
`;
