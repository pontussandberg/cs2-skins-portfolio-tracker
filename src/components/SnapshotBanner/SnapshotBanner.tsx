"use client";

import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ConfirmDialog, ErrorNote, LinkButton } from "@/components/ui";
import { formatPrice, formatSignedPercent, formatSignedPrice, snapshotTitle } from "@/core/format";
import type { PortfolioTotals } from "@/core/portfolio";
import { DELETE_PORTFOLIO_SNAPSHOT } from "@/graphql/operations";
import { ignore } from "@/lib/ignore";
import { Actions, Change, Compare, Root, Text, Title } from "./SnapshotBanner.styles";

/** Change from `then` to `now`: "+$120.00 (+4.2%)". */
function describeChange(then: number, now: number): string {
  const diff = now - then;
  return `${formatSignedPrice(diff)}${then > 0 ? ` (${formatSignedPercent((diff / then) * 100)})` : ""}`;
}

/**
 * Shown in history mode: which snapshot this is, how its value compares with the live portfolio,
 * which items came and went since, and a way back to now (or to delete the snapshot).
 */
export function SnapshotBanner({
  snapshot,
  now,
  gone,
  added,
}: {
  snapshot: { id: string; label: string | null; takenAt: string; totals: PortfolioTotals };
  /** Live portfolio totals; null while loading. */
  now: PortfolioTotals | null;
  /** Items in the snapshot you no longer have, and items you have that it doesn't. */
  gone: number;
  added: number;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [remove, { loading, error }] = useMutation(DELETE_PORTFOLIO_SNAPSHOT, { refetchQueries: ["Portfolio"] });
  const then = snapshot.totals;

  return (
    <Root>
      <Text>
        <Title>History · {snapshotTitle(snapshot)}</Title>
        <p>The portfolio exactly as it was then: items, prices and your valuations. Read-only.</p>
        {now ? (
          <Compare>
            <span>
              Your value then {formatPrice(then.value)}, now {formatPrice(now.value)}{" "}
              <Change $up={now.value >= then.value}>{describeChange(then.value, now.value)}</Change>
            </span>
            <span>
              Market then {formatPrice(then.market)}, now {formatPrice(now.market)}{" "}
              <Change $up={now.market >= then.market}>{describeChange(then.market, now.market)}</Change>
            </span>
            {gone || added ? (
              <span>
                Since then: {gone} item{gone === 1 ? "" : "s"} gone, {added} new
              </span>
            ) : null}
          </Compare>
        ) : null}
        <ErrorNote error={error} />
      </Text>
      <Actions>
        <LinkButton href="/portfolio" tone="primary">
          Back to now
        </LinkButton>
        <Button tone="danger" onClick={() => setConfirming(true)}>
          Delete
        </Button>
      </Actions>
      <ConfirmDialog
        open={confirming}
        title="Delete this snapshot?"
        body="It can't be recovered (unless it's in a backup)."
        confirmLabel="Delete snapshot"
        busy={loading}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          remove({ variables: { id: snapshot.id } })
            .then(() => {
              setConfirming(false);
              router.push("/portfolio");
            })
            .catch(ignore);
        }}
      />
    </Root>
  );
}
