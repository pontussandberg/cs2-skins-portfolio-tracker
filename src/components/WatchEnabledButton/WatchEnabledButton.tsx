"use client";

import { useMutation } from "@apollo/client/react";
import { Button, type ButtonSize } from "@/components/ui";
import { SET_WATCH_ENABLED } from "@/graphql/operations";
import { ignore } from "@/lib/ignore";

/** Enables or disables a watch in one click. Disabled watches skip cron and Run all; Run now still works. */
export function WatchEnabledButton({ watch, size }: { watch: { id: string; enabled: boolean }; size?: ButtonSize }) {
  const [setEnabled, { loading }] = useMutation(SET_WATCH_ENABLED);
  return (
    <Button
      size={size}
      busy={loading}
      title={watch.enabled ? "Skip this watch in scheduled runs and Run all" : "Include this watch in scheduled runs and Run all again"}
      onClick={() => setEnabled({ variables: { id: watch.id, enabled: !watch.enabled } }).catch(ignore)}
    >
      {watch.enabled ? "Disable" : "Enable"}
    </Button>
  );
}
