"use client";

import { useMutation } from "@apollo/client/react";
import { useId, useState } from "react";
import type { PortfolioItemView } from "@/components/PortfolioCard";
import { Button, ErrorNote, Field, Input, Modal, ModalActions, ModalTitle, Textarea } from "@/components/ui";
import { formatMultiple, formatPercent, formatPrice, formatScrape, stickerLabel } from "@/core/format";
import { valueItem, type ValuationInput } from "@/core/portfolio";
import { SET_VALUATION } from "@/graphql/operations";
import { ignore } from "@/lib/ignore";
import {
  Form,
  Header,
  HeaderImage,
  Mode,
  Modes,
  Presets,
  Section,
  SectionTitle,
  Spacer,
  StickerIcon,
  StickerList,
  StickerMeta,
  StickerName,
  StickerRow,
  Subtitle,
  Summary,
  SummaryRow,
  SummaryTotal,
} from "./ValuationDialog.styles";

type SkinMode = "market" | "multiplier" | "fixed";

const SKIN_MODES: { id: SkinMode; label: string }[] = [
  { id: "market", label: "Market" },
  { id: "multiplier", label: "× Market" },
  { id: "fixed", label: "Fixed price" },
];

const CRAFT_PRESETS = [0, 5, 10, 15, 25, 50];

/** "" -> null, otherwise the number (NaN when it isn't one). */
function parseNumber(text: string): number | null {
  return text.trim() === "" ? null : Number(text);
}

/**
 * Edit what an item is worth to you: the skin itself (market, a multiple of market, or a fixed
 * price, for patterns and floats) plus a share of the sticker value for crafts. Shows the result live.
 */
export function ValuationDialog({ item, defaultCraftPercent, onClose }: { item: PortfolioItemView | null; defaultCraftPercent: number; onClose: () => void }) {
  return (
    <Modal open={item !== null} onClose={onClose} width="520px">
      {/* Keyed so the form starts from each item's saved valuation. */}
      {item ? <ValuationForm key={item.id} item={item} defaultCraftPercent={defaultCraftPercent} onDone={onClose} /> : null}
    </Modal>
  );
}

function ValuationForm({ item, defaultCraftPercent, onDone }: { item: PortfolioItemView; defaultCraftPercent: number; onDone: () => void }) {
  const id = useId();
  const saved = item.valuation;
  const [mode, setMode] = useState<SkinMode>(saved?.skinPrice != null ? "fixed" : saved?.multiplier != null ? "multiplier" : "market");
  const [multiplier, setMultiplier] = useState(saved?.multiplier?.toString() ?? "");
  const [fixed, setFixed] = useState(saved?.skinPrice != null ? (saved.skinPrice / 100).toFixed(2) : "");
  const [craft, setCraft] = useState(saved?.craftPercent?.toString() ?? "");
  const [note, setNote] = useState(saved?.note ?? "");
  const [save, { loading, error }] = useMutation(SET_VALUATION);

  const fixedDollars = mode === "fixed" ? parseNumber(fixed) : null;
  const input: ValuationInput = {
    multiplier: mode === "multiplier" ? parseNumber(multiplier) : null,
    skinPrice: fixedDollars == null ? null : Math.round(fixedDollars * 100),
    craftPercent: item.stickers.length ? parseNumber(craft) : null,
    note: note.trim() || null,
  };
  const invalid =
    [input.multiplier, input.skinPrice, input.craftPercent].some((n) => n != null && (!Number.isFinite(n) || n < 0)) || input.multiplier === 0;

  const preview = valueItem({ marketPrice: item.value.market, stickers: item.stickers, charms: item.charms }, invalid ? null : { ...input, updatedAt: "" }, {
    defaultCraftPercent,
  });

  const submit = (next: ValuationInput) =>
    save({ variables: { key: item.key, input: next } })
      .then(onDone)
      .catch(ignore);

  return (
    <Form
      onSubmit={(e) => {
        e.preventDefault();
        if (!invalid) void submit(input);
      }}
    >
      <Header>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {item.iconUrl ? <HeaderImage src={item.iconUrl} alt="" /> : null}
        <div>
          <ModalTitle>{item.name}</ModalTitle>
          <Subtitle>Market price {formatPrice(item.value.market)}</Subtitle>
        </div>
      </Header>

      <Section>
        <SectionTitle>Skin value</SectionTitle>
        <Modes role="radiogroup" aria-label="Skin value">
          {SKIN_MODES.map((m) => (
            <Mode key={m.id} type="button" role="radio" aria-checked={mode === m.id} onClick={() => setMode(m.id)}>
              {m.label}
            </Mode>
          ))}
        </Modes>
        {mode === "multiplier" ? (
          <Field label="Multiplier" htmlFor={`${id}-mult`} hint={`Pattern or float premium: 3 = 3× market = ${formatPrice(preview.skin)}`}>
            <Input id={`${id}-mult`} type="number" inputMode="decimal" min={0} step="any" placeholder="e.g. 2.5" value={multiplier} onChange={(e) => setMultiplier(e.target.value)} autoFocus />
          </Field>
        ) : null}
        {mode === "fixed" ? (
          <Field label="Skin price (USD)" htmlFor={`${id}-fixed`} hint="What the skin itself is worth to you, stickers not included.">
            <Input id={`${id}-fixed`} type="number" inputMode="decimal" min={0} step="0.01" placeholder="e.g. 1500" value={fixed} onChange={(e) => setFixed(e.target.value)} autoFocus />
          </Field>
        ) : null}
      </Section>

      {item.stickers.length ? (
        <Section>
          <SectionTitle>Craft · stickers worth {formatPrice(preview.stickers)}</SectionTitle>
          <StickerList>
            {item.stickers.map((s, i) => (
              <StickerRow key={i}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {s.iconUrl ? <StickerIcon src={s.iconUrl} alt="" $scraped={Boolean(s.wear)} /> : <span />}
                <StickerName title={s.name}>{stickerLabel(s.name)}</StickerName>
                <StickerMeta>
                  {[formatScrape(s.wear), s.price != null ? formatPrice(s.price) : "no price"].filter(Boolean).join(" · ")}
                </StickerMeta>
              </StickerRow>
            ))}
          </StickerList>
          <Field
            label="Craft % of sticker value (SP)"
            htmlFor={`${id}-craft`}
            hint={craft.trim() === "" ? `Empty uses the default (${formatPercent(defaultCraftPercent)}).` : `Adds ${formatPrice(preview.craft)}.`}
          >
            <Input
              id={`${id}-craft`}
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              placeholder={`Default ${formatPercent(defaultCraftPercent)}`}
              value={craft}
              onChange={(e) => setCraft(e.target.value)}
            />
          </Field>
          <Presets>
            {CRAFT_PRESETS.map((p) => (
              <Mode key={p} type="button" aria-pressed={parseNumber(craft) === p} onClick={() => setCraft(String(p))}>
                {p}%
              </Mode>
            ))}
          </Presets>
        </Section>
      ) : null}

      <Section>
        <Field label="Note" htmlFor={`${id}-note`}>
          <Textarea id={`${id}-note`} rows={2} placeholder="e.g. tier 2 blue gem, 4x Titan Holo craft" value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </Section>

      <Summary>
        <SummaryRow>
          <span>Skin</span>
          <span>{formatPrice(preview.skin)}</span>
        </SummaryRow>
        {preview.stickers > 0 ? (
          <SummaryRow>
            <span>Craft ({formatPercent(preview.craftPercent)} SP)</span>
            <span>+{formatPrice(preview.craft)}</span>
          </SummaryRow>
        ) : null}
        {preview.charms > 0 ? (
          <SummaryRow>
            <span>Charms</span>
            <span>+{formatPrice(preview.charms)}</span>
          </SummaryRow>
        ) : null}
        <SummaryTotal>
          <span>Your value{preview.marketTotal > 0 && preview.total !== preview.marketTotal ? ` · ${formatMultiple(preview.total / preview.marketTotal)} market` : ""}</span>
          <span>{formatPrice(preview.total)}</span>
        </SummaryTotal>
      </Summary>

      <ErrorNote error={error ?? (invalid ? { message: "Numbers must be positive." } : null)} />

      <ModalActions>
        {saved ? (
          <Button tone="danger" onClick={() => void submit({ multiplier: null, skinPrice: null, craftPercent: null, note: null })} disabled={loading}>
            Reset to market
          </Button>
        ) : null}
        <Spacer />
        <Button onClick={onDone}>Cancel</Button>
        <Button type="submit" tone="primary" busy={loading} disabled={invalid}>
          Save
        </Button>
      </ModalActions>
    </Form>
  );
}
