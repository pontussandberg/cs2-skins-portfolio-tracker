"use client";

import { useMutation } from "@apollo/client/react";
import { useId, useState } from "react";
import { Button, ErrorNote, Field, Input, Modal, ModalActions, ModalTitle } from "@/components/ui";
import { formatDateTime } from "@/core/format";
import { TAKE_PORTFOLIO_SNAPSHOT } from "@/graphql/operations";
import { ignore } from "@/lib/ignore";
import { Form, Hint } from "./SaveSnapshotButton.styles";

/** Saves the portfolio as it is now (items, prices, your valuations). The name starts as the current date. */
export function SaveSnapshotButton({ disabled }: { disabled?: boolean }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  /** The prefilled date; saving it unchanged stores no name, so the snapshot shows its real time. */
  const [defaultLabel, setDefaultLabel] = useState("");
  const [take, { loading, error, reset }] = useMutation(TAKE_PORTFOLIO_SNAPSHOT, { refetchQueries: ["Portfolio"] });

  const close = () => {
    setOpen(false);
    setLabel("");
    reset();
  };

  return (
    <>
      <Button
        onClick={() => {
          const now = formatDateTime(new Date().toISOString());
          setDefaultLabel(now);
          setLabel(now);
          setOpen(true);
        }}
        disabled={disabled}
      >
        Save snapshot
      </Button>
      <Modal open={open} onClose={close}>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            const name = label.trim();
            take({ variables: { label: name && name !== defaultLabel ? name : null } })
              .then(close)
              .catch(ignore);
          }}
        >
          <ModalTitle>Save snapshot</ModalTitle>
          <Hint>Freezes your items, today&apos;s prices and your valuations, so you can look back at the portfolio as it is right now.</Hint>
          <Field label="Name" htmlFor={id}>
            <Input
              id={id}
              placeholder="e.g. Before selling the gloves"
              maxLength={80}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onFocus={(e) => e.target.select()}
              autoFocus
            />
          </Field>
          <ErrorNote error={error} />
          <ModalActions>
            <Button onClick={close}>Cancel</Button>
            <Button type="submit" tone="primary" busy={loading}>
              Save
            </Button>
          </ModalActions>
        </Form>
      </Modal>
    </>
  );
}
