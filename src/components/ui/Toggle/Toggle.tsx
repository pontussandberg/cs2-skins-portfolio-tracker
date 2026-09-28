"use client";

import { Description, HiddenInput, Knob, Label, Root, Switch, Text, Track } from "./Toggle.styles";

/** On/off switch backed by a real checkbox. */
export function Toggle({ id, checked, onChange, label, description }: { id: string; checked: boolean; onChange: (checked: boolean) => void; label: string; description?: string }) {
  return (
    <Root htmlFor={id}>
      <Text>
        <Label>{label}</Label>
        {description ? <Description>{description}</Description> : null}
      </Text>
      <Switch>
        <HiddenInput id={id} type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <Track />
        <Knob />
      </Switch>
    </Root>
  );
}
