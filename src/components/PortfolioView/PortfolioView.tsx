"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ListingGrid } from "@/components/ListingGrid";
import { PortfolioCard, type PortfolioItemView } from "@/components/PortfolioCard";
import { SaveSnapshotButton } from "@/components/SaveSnapshotButton";
import { SnapshotBanner } from "@/components/SnapshotBanner";
import { SystemBanner } from "@/components/SystemBanner";
import { Button, EmptyState, ErrorNote, Input, PageHeader, Select, Skeleton, Tab, TabList } from "@/components/ui";
import { ValuationDialog } from "@/components/ValuationDialog";
import { formatPercent, formatPrice, formatSignedPrice, snapshotTitle, timeAgo } from "@/core/format";
import { portfolioTotals } from "@/core/portfolio";
import { PORTFOLIO, SET_PORTFOLIO_SETTINGS, SYNC_INVENTORY } from "@/graphql/operations";
import { ignore } from "@/lib/ignore";
import { DefaultCraft, Root, Search, SnapshotSelect, Stat, StatGrid, StatLabel, StatSub, StatValue, Toolbar } from "./PortfolioView.styles";

const TYPE_TABS = [
  { id: "all", label: "All" },
  { id: "skin", label: "Skins" },
  { id: "agent", label: "Agents" },
  { id: "container", label: "Cases" },
  { id: "other", label: "Other" },
] as const;
type TypeTab = (typeof TYPE_TABS)[number]["id"];
const NAMED_TYPES = new Set<string>(["skin", "agent", "container"]);

function inTab(item: PortfolioItemView, tab: TypeTab): boolean {
  if (tab === "all") return true;
  if (tab === "other") return !NAMED_TYPES.has(item.type);
  return item.type === tab;
}

const SORTS = {
  value: { label: "Your value", compare: (a, b) => b.value.total - a.value.total },
  premium: { label: "Premium over market", compare: (a, b) => b.value.total - b.value.marketTotal - (a.value.total - a.value.marketTotal) },
  market: { label: "Market value", compare: (a, b) => b.value.marketTotal - a.value.marketTotal },
  stickers: { label: "Sticker value", compare: (a, b) => b.value.stickers - a.value.stickers },
  name: { label: "Name", compare: (a, b) => a.name.localeCompare(b.name) },
} satisfies Record<string, { label: string; compare: (a: PortfolioItemView, b: PortfolioItemView) => number }>;
type SortKey = keyof typeof SORTS;

/** The live portfolio, or with `snapshotId` a saved snapshot of it (history mode, read-only). */
export function PortfolioView({ snapshotId }: { snapshotId: string | null }) {
  const router = useRouter();
  const history = snapshotId !== null;
  const { data, loading, error } = useQuery(PORTFOLIO, { variables: { snapshotId: snapshotId ?? "", history }, fetchPolicy: "cache-and-network" });
  const [sync, syncState] = useMutation(SYNC_INVENTORY);
  const [tab, setTab] = useState<TypeTab>("all");
  const [sort, setSort] = useState<SortKey>("value");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const live = data?.portfolio;
  const portfolio = history ? data?.portfolioSnapshot : live;
  const items = useMemo(() => portfolio?.items ?? [], [portfolio]);
  const snapshots = data?.portfolioSnapshots ?? [];
  const shown = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((i) => inTab(i, tab) && (!needle || i.name.toLowerCase().includes(needle))).sort(SORTS[sort].compare);
  }, [items, tab, search, sort]);
  const totals = portfolioTotals(shown.map((i) => i.value));
  const premium = totals.value - totals.market;
  const editing = items.find((i) => i.id === editingId) ?? null;
  const syncing = Boolean(live?.syncing) || syncState.loading;
  const defaultCraftPercent = portfolio?.settings.defaultCraftPercent ?? 0;

  return (
    <Root>
      <SystemBanner system={data?.system} />

      <PageHeader
        title="Portfolio"
        description={
          history
            ? "Viewing a saved snapshot."
            : live?.syncedAt
              ? `${items.length} items from your Steam inventory, synced ${timeAgo(live.syncedAt)} via CSFloat. Click an item to set what it's really worth.`
              : "Your Steam inventory, synced via CSFloat, valued with your own craft and pattern premiums."
        }
        actions={
          <>
            {snapshots.length ? (
              <SnapshotSelect
                aria-label="View portfolio at"
                value={snapshotId ?? ""}
                onChange={(e) => router.push(e.target.value ? `/portfolio?snapshot=${encodeURIComponent(e.target.value)}` : "/portfolio")}
              >
                <option value="">Now (live)</option>
                {snapshots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {`${snapshotTitle(s)} · ${formatPrice(s.totals.value)}`}
                  </option>
                ))}
              </SnapshotSelect>
            ) : null}
            {history ? null : (
              <>
                <SaveSnapshotButton disabled={!live?.syncedAt} />
                <Button tone="primary" busy={syncing} onClick={() => sync().catch(ignore)}>
                  {syncing ? "Syncing" : "Sync inventory"}
                </Button>
              </>
            )}
          </>
        }
      />

      <ErrorNote error={error ?? syncState.error ?? (!history && live?.syncError ? { message: `Inventory sync failed: ${live.syncError}` } : null)} />

      {history && portfolio?.snapshot ? <SnapshotBanner snapshot={portfolio.snapshot} {...compareWithLive(items, live?.items)} /> : null}

      <StatGrid>
        <Stat $accent>
          <StatLabel>Your value</StatLabel>
          <StatValue>{formatPrice(totals.value)}</StatValue>
          <StatSub>
            {totals.items} item{totals.items === 1 ? "" : "s"}
            {tab !== "all" || search ? " (filtered)" : ""}
          </StatSub>
        </Stat>
        <Stat>
          <StatLabel>Market value</StatLabel>
          <StatValue>{formatPrice(totals.market)}</StatValue>
          <StatSub>CSFloat prices, charms included</StatSub>
        </Stat>
        <Stat>
          <StatLabel>Your premium</StatLabel>
          <StatValue $positive={premium > 0}>
            {formatSignedPrice(premium)}
          </StatValue>
          <StatSub>{totals.market > 0 ? `${formatPercent((premium / totals.market) * 100)} over market` : "Crafts and patterns"}</StatSub>
        </Stat>
        <Stat>
          <StatLabel>Stickers applied</StatLabel>
          <StatValue>{formatPrice(totals.stickers)}</StatValue>
          <StatSub>Reference value of all stickers</StatSub>
        </Stat>
      </StatGrid>

      <TabList>
        {TYPE_TABS.map((t) => (
          <Tab key={t.id} aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label} ({items.filter((i) => inTab(i, t.id)).length})
          </Tab>
        ))}
      </TabList>

      <Toolbar>
        <Search type="search" placeholder="Search items" aria-label="Search items" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
          {Object.entries(SORTS).map(([key, s]) => (
            <option key={key} value={key}>
              Sort: {s.label}
            </option>
          ))}
        </Select>
        {/* Keyed on the saved value so the field resets when it changes elsewhere. */}
        {history ? null : <DefaultCraftInput key={defaultCraftPercent} value={defaultCraftPercent} />}
      </Toolbar>

      {loading && !data ? (
        <ListingGrid>
          {Array.from({ length: 10 }, (_, i) => (
            <li key={i}>
              <Skeleton aspectRatio="3 / 4" />
            </li>
          ))}
        </ListingGrid>
      ) : history && !portfolio ? (
        <EmptyState title="Snapshot not found" body="It may have been deleted." />
      ) : items.length === 0 ? (
        <EmptyState
          title={syncing ? "Syncing your inventory" : "No items yet"}
          body="The portfolio reads your Steam inventory through CSFloat (the account that owns CSFLOAT_API_KEY). Items in storage units are not included."
        />
      ) : shown.length === 0 ? (
        <EmptyState title="No matching items" body="Try another tab or search." />
      ) : (
        <ListingGrid>
          {shown.map((item) => (
            <li key={item.id}>
              <PortfolioCard item={item} onEdit={history ? undefined : () => setEditingId(item.id)} />
            </li>
          ))}
        </ListingGrid>
      )}

      <ValuationDialog item={editing} defaultCraftPercent={defaultCraftPercent} onClose={() => setEditingId(null)} />
    </Root>
  );
}

/** Live totals and which items came and went between a snapshot and now (matched by item key). */
function compareWithLive(then: PortfolioItemView[], now: PortfolioItemView[] | undefined) {
  if (!now) return { now: null, gone: 0, added: 0 };
  const thenKeys = new Set(then.map((i) => i.key));
  const nowKeys = new Set(now.map((i) => i.key));
  return {
    now: portfolioTotals(now.map((i) => i.value)),
    gone: then.filter((i) => !nowKeys.has(i.key)).length,
    added: now.filter((i) => !thenKeys.has(i.key)).length,
  };
}

/** Portfolio-wide craft % for crafted items without their own; saved on blur or Enter. */
function DefaultCraftInput({ value }: { value: number }) {
  const [text, setText] = useState(String(value));
  const [save, { error }] = useMutation(SET_PORTFOLIO_SETTINGS);
  const commit = () => {
    const n = Number(text);
    if (text.trim() === "" || !Number.isFinite(n) || n < 0) return setText(String(value));
    if (n !== value) save({ variables: { input: { defaultCraftPercent: n } } }).catch(ignore);
  };
  return (
    <DefaultCraft title={error?.message ?? "Craft % used for items with stickers that have no craft % of their own"}>
      Default craft
      <Input
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        aria-label="Default craft percent"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
      />
      %
    </DefaultCraft>
  );
}
