"use client";

import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import { parseCsfloatSearchUrl, parseSeedList } from "@/core/csfloatUrl";
import { SCHEDULE_PRESETS } from "@/core/format";
import type { CsfloatQuery } from "@/core/types";
import type { CreateWatchMutationVariables } from "@/graphql/__generated__/graphql";
import { CREATE_WATCH, UPDATE_WATCH } from "@/graphql/operations";
import { Button, Card, ErrorNote, Field, Input, Select, Textarea, Toggle } from "./ui";

export interface WatchFormInitial {
  id: string;
  name: string;
  query: Partial<Record<keyof CsfloatQuery, string | number | null>>;
  seeds: number[];
  schedule?: string | null;
  maxPages?: number | null;
  enabled: boolean;
  notify: boolean;
}

type WatchInputVars = CreateWatchMutationVariables["input"];

const CUSTOM = "__custom__";
const MANUAL = "__manual__";

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const centsToUsd = (v: unknown) => (v === null || v === undefined || v === "" ? "" : (Number(v) / 100).toFixed(2));

function initialState(initial?: WatchFormInitial) {
  const q = initial?.query ?? {};
  const preset = SCHEDULE_PRESETS.find((p) => p.value === (initial?.schedule ?? null));
  return {
    name: initial?.name ?? "",
    def_index: str(q.def_index),
    paint_index: str(q.paint_index),
    market_hash_name: str(q.market_hash_name),
    min_float: str(q.min_float),
    max_float: str(q.max_float),
    category: str(q.category ?? 0),
    min_price: centsToUsd(q.min_price),
    max_price: centsToUsd(q.max_price),
    type: str(q.type),
    stickers: str(q.stickers),
    collection: str(q.collection),
    rarity: str(q.rarity),
    seeds: (initial?.seeds ?? []).join(", "),
    schedule: preset ? (preset.value ?? MANUAL) : CUSTOM,
    customCron: preset ? "" : (initial?.schedule ?? ""),
    maxPages: str(initial?.maxPages ?? 3),
    enabled: initial?.enabled ?? true,
    notify: initial?.notify ?? true,
  };
}

type FormState = ReturnType<typeof initialState>;

function int(v: string): number | null {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}
function float(v: string): number | null {
  const n = Number.parseFloat(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
function usdToCents(v: string): number | null {
  const n = float(v);
  return n === null ? null : Math.round(n * 100);
}

function toInput(s: FormState): WatchInputVars {
  const schedule = s.schedule === MANUAL ? null : s.schedule === CUSTOM ? s.customCron.trim() || null : s.schedule;
  return {
    name: s.name.trim(),
    query: {
      def_index: int(s.def_index),
      paint_index: int(s.paint_index),
      market_hash_name: s.market_hash_name.trim() || null,
      min_float: float(s.min_float),
      max_float: float(s.max_float),
      category: int(s.category),
      min_price: usdToCents(s.min_price),
      max_price: usdToCents(s.max_price),
      type: s.type || null,
      stickers: s.stickers.trim() || null,
      collection: s.collection.trim() || null,
      rarity: int(s.rarity),
    },
    seeds: parseSeedList(s.seeds),
    schedule,
    maxPages: int(s.maxPages),
    enabled: s.enabled,
    notify: s.notify,
  };
}

export function WatchForm({ mode, initial, onSaved }: { mode: "create" | "edit"; initial?: WatchFormInitial; onSaved?: () => void }) {
  const router = useRouter();
  const uid = useId();
  const [s, setS] = useState<FormState>(() => initialState(initial));
  const [pasteUrl, setPasteUrl] = useState("");
  const [importNote, setImportNote] = useState<string | null>(null);
  const [createWatch, createState] = useMutation(CREATE_WATCH, { refetchQueries: "active" });
  const [updateWatch, updateState] = useMutation(UPDATE_WATCH, { refetchQueries: "active" });
  const busy = createState.loading || updateState.loading;
  const error = createState.error ?? updateState.error;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setS((prev) => ({ ...prev, [key]: value }));
  const id = (name: string) => `${uid}-${name}`;
  const seedCount = parseSeedList(s.seeds).length;

  function importUrl() {
    if (!pasteUrl.trim()) return;
    const parsed = parseCsfloatSearchUrl(pasteUrl);
    const q = parsed.query;
    setS((prev) => ({
      ...prev,
      def_index: str(q.def_index),
      paint_index: str(q.paint_index),
      market_hash_name: str(q.market_hash_name),
      min_float: str(q.min_float),
      max_float: str(q.max_float),
      category: str(q.category ?? 0),
      min_price: centsToUsd(q.min_price),
      max_price: centsToUsd(q.max_price),
      type: str(q.type),
      stickers: str(q.stickers),
      collection: str(q.collection),
      rarity: str(q.rarity),
      seeds: parsed.seeds.length ? parsed.seeds.join(", ") : prev.seeds,
      name: prev.name || q.market_hash_name || `Search ${q.def_index ?? ""}/${q.paint_index ?? ""}`.trim(),
    }));
    const fields = Object.keys(q).length;
    setImportNote(
      `Imported ${fields} filter${fields === 1 ? "" : "s"}${parsed.seeds.length ? ` and ${parsed.seeds.length} seed${parsed.seeds.length === 1 ? "" : "s"}` : ""}.` +
        (parsed.ignored.length ? ` Ignored: ${parsed.ignored.join(", ")}.` : ""),
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const input = toInput(s);
    if (mode === "create") {
      const res = await createWatch({ variables: { input } }).catch(() => null);
      const newId = res?.data?.createWatch.id;
      if (newId) router.push(`/watches/${newId}`);
    } else if (initial) {
      const res = await updateWatch({ variables: { id: initial.id, input } }).catch(() => null);
      if (res?.data) onSaved?.();
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <Card className="flex flex-col gap-3">
        <SectionTitle title="Import from CSFloat" hint="Build the search on csfloat.com, then paste its URL here to fill the form." />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input value={pasteUrl} onChange={(e) => setPasteUrl(e.target.value)} placeholder="https://csfloat.com/search?def_index=7&paint_index=44&paint_seed=661" aria-label="CSFloat search URL" />
          <Button onClick={importUrl} tone="neutral" className="shrink-0">
            Import
          </Button>
        </div>
        {importNote ? <p className="text-sm font-semibold text-mint-ink">{importNote}</p> : null}
      </Card>

      <Card className="grid gap-5 sm:grid-cols-2">
        <SectionTitle title="Item" className="sm:col-span-2" />
        <Field label="Watch name" htmlFor={id("name")} className="sm:col-span-2">
          <Input id={id("name")} value={s.name} onChange={(e) => set("name", e.target.value)} placeholder="AK CH blue gems, tier 1" required />
        </Field>
        <Field label="def_index (weapon)" htmlFor={id("def")} hint="e.g. 7 = AK-47">
          <Input id={id("def")} inputMode="numeric" value={s.def_index} onChange={(e) => set("def_index", e.target.value)} />
        </Field>
        <Field label="paint_index (skin)" htmlFor={id("paint")} hint="e.g. 44 = Case Hardened">
          <Input id={id("paint")} inputMode="numeric" value={s.paint_index} onChange={(e) => set("paint_index", e.target.value)} />
        </Field>
        <Field label="market_hash_name (exact name, optional)" htmlFor={id("mhn")} className="sm:col-span-2">
          <Input id={id("mhn")} value={s.market_hash_name} onChange={(e) => set("market_hash_name", e.target.value)} placeholder="AK-47 | Case Hardened (Field-Tested)" />
        </Field>
      </Card>

      <Card className="grid gap-5 sm:grid-cols-2">
        <SectionTitle title="Filters" className="sm:col-span-2" />
        <Field label="Min float" htmlFor={id("minf")}>
          <Input id={id("minf")} inputMode="decimal" value={s.min_float} onChange={(e) => set("min_float", e.target.value)} placeholder="0.00" />
        </Field>
        <Field label="Max float" htmlFor={id("maxf")}>
          <Input id={id("maxf")} inputMode="decimal" value={s.max_float} onChange={(e) => set("max_float", e.target.value)} placeholder="1.00" />
        </Field>
        <Field label="Min price (USD)" htmlFor={id("minp")}>
          <Input id={id("minp")} inputMode="decimal" value={s.min_price} onChange={(e) => set("min_price", e.target.value)} />
        </Field>
        <Field label="Max price (USD)" htmlFor={id("maxp")}>
          <Input id={id("maxp")} inputMode="decimal" value={s.max_price} onChange={(e) => set("max_price", e.target.value)} />
        </Field>
        <Field label="Category" htmlFor={id("cat")}>
          <Select id={id("cat")} value={s.category} onChange={(e) => set("category", e.target.value)}>
            <option value="0">Any</option>
            <option value="1">Normal</option>
            <option value="2">StatTrak</option>
            <option value="3">Souvenir</option>
          </Select>
        </Field>
        <Field label="Listing type" htmlFor={id("type")}>
          <Select id={id("type")} value={s.type} onChange={(e) => set("type", e.target.value)}>
            <option value="">Buy now + auctions</option>
            <option value="buy_now">Buy now only</option>
            <option value="auction">Auctions only</option>
          </Select>
        </Field>
        <Field label="Stickers (optional)" htmlFor={id("stk")} hint="CSFloat format: ID|POSITION, comma separated">
          <Input id={id("stk")} value={s.stickers} onChange={(e) => set("stickers", e.target.value)} />
        </Field>
        <Field label="Collection (optional)" htmlFor={id("col")} hint="e.g. set_bravo_ii">
          <Input id={id("col")} value={s.collection} onChange={(e) => set("collection", e.target.value)} />
        </Field>
      </Card>

      <Card className="flex flex-col gap-3">
        <SectionTitle title="Patterns" hint="One CSFloat query runs per seed. Leave empty to watch every pattern." />
        <Textarea id={id("seeds")} value={s.seeds} onChange={(e) => set("seeds", e.target.value)} placeholder="661, 670, 321, 955" aria-label="Pattern seeds" />
        <p className="px-1 text-xs text-ink-muted">{seedCount ? `${seedCount} seed${seedCount === 1 ? "" : "s"} = ${seedCount} request${seedCount === 1 ? "" : "s"} per run (more if results span pages).` : "No seeds: one request per run."}</p>
      </Card>

      <Card className="grid gap-5 sm:grid-cols-2">
        <SectionTitle title="Schedule & alerts" className="sm:col-span-2" />
        <Field label="Schedule" htmlFor={id("sched")}>
          <Select id={id("sched")} value={s.schedule} onChange={(e) => set("schedule", e.target.value)}>
            {SCHEDULE_PRESETS.map((p) => (
              <option key={p.label} value={p.value ?? MANUAL}>
                {p.label}
              </option>
            ))}
            <option value={CUSTOM}>Custom cron…</option>
          </Select>
        </Field>
        {s.schedule === CUSTOM ? (
          <Field label="Cron expression" htmlFor={id("cron")} hint="Europe/Stockholm time, e.g. 0 8-23 * * *">
            <Input id={id("cron")} value={s.customCron} onChange={(e) => set("customCron", e.target.value)} placeholder="*/10 * * * *" className="font-mono" />
          </Field>
        ) : (
          <Field label="Max pages per seed" htmlFor={id("pages")} hint="50 listings per page. Runs stop early when nothing is new.">
            <Input id={id("pages")} inputMode="numeric" value={s.maxPages} onChange={(e) => set("maxPages", e.target.value)} />
          </Field>
        )}
        {s.schedule === CUSTOM ? (
          <Field label="Max pages per seed" htmlFor={id("pages")} hint="50 listings per page.">
            <Input id={id("pages")} inputMode="numeric" value={s.maxPages} onChange={(e) => set("maxPages", e.target.value)} />
          </Field>
        ) : null}
        <div className="clay-well flex flex-col gap-2 p-4 sm:col-span-2">
          <Toggle id={id("enabled")} checked={s.enabled} onChange={(v) => set("enabled", v)} label="Enabled" description="Disabled watches skip cron and Run all." />
          <Toggle id={id("notify")} checked={s.notify} onChange={(v) => set("notify", v)} label="Post new items to Discord" description="Uses DISCORD_WEBHOOK_URL from the server config." />
        </div>
      </Card>

      <ErrorNote error={error} />

      <div className="flex justify-end gap-3">
        {mode === "edit" && onSaved ? (
          <Button onClick={onSaved} tone="ghost">
            Cancel
          </Button>
        ) : null}
        <Button type="submit" tone="primary" size="lg" busy={busy}>
          {mode === "create" ? "Create watch" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

function SectionTitle({ title, hint, className }: { title: string; hint?: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <h2 className="text-lg font-extrabold">{title}</h2>
      {hint ? <p className="text-sm text-ink-muted">{hint}</p> : null}
    </div>
  );
}
