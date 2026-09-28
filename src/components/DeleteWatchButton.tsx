"use client";

import { useMutation } from "@apollo/client/react";
import { useState } from "react";
import { DELETE_WATCH } from "@/graphql/operations";
import { Button, ConfirmDialog, ErrorNote, type ButtonProps } from "./ui";
import { ignore } from "@/lib/ignore";

/**
 * Delete button with a confirmation dialog. Without `onDeleted`, active queries are refetched so
 * the watch disappears in place; with it (e.g. navigating away), the caller takes over.
 */
export function DeleteWatchButton({
  watch,
  onDeleted,
  size,
  className,
}: {
  watch: { id: string; name: string };
  onDeleted?: () => void;
  size?: ButtonProps["size"];
  className?: string;
}) {
  const [deleteWatch, { loading, error }] = useMutation(DELETE_WATCH, { refetchQueries: onDeleted ? [] : "active" });
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button tone="danger" size={size} className={className} onClick={() => setOpen(true)}>
        Delete
      </Button>
      <ConfirmDialog
        open={open}
        title={`Delete "${watch.name}"?`}
        body={
          <>
            Removes the watch and its run history. This can&apos;t be undone.
            <ErrorNote error={error} />
          </>
        }
        confirmLabel="Delete watch"
        busy={loading}
        onCancel={() => setOpen(false)}
        onConfirm={() =>
          deleteWatch({ variables: { id: watch.id } }).then(() => {
            setOpen(false);
            onDeleted?.();
          }, ignore)
        }
      />
    </>
  );
}
