import type { PermitCategory } from "@/sources/types";

export const TRADES = [
  { id: "fence", label: "Fence" },
  { id: "landscaping", label: "Landscaping" },
  { id: "pool", label: "Pool" },
  { id: "gutters", label: "Gutters" },
  { id: "blinds", label: "Blinds & shades" },
] as const;

export type TradeId = (typeof TRADES)[number]["id"];

export const isTrade = (v: string): v is TradeId => TRADES.some((t) => t.id === v);
export const tradeLabel = (id: string) => TRADES.find((t) => t.id === id)?.label ?? id;

interface TagInput {
  category: PermitCategory;
  description: string;
}

interface Rule {
  when: (p: TagInput, text: string) => boolean;
  trades: TradeId[];
  reason: string;
}

const has = (re: RegExp) => (_: TagInput, text: string) => re.test(text);
// Cities file plenty of interior-only work as "additions", so require the description to say so.
const isRealAddition = (p: TagInput, text: string) =>
  p.category === "addition" && /\b(addition|adding|add(ed)? (a |an )?(new )?(room|bedroom|bath\w*|story|garage|sq\.? ?ft))\b/.test(text);
const isPoolWork = (p: TagInput, text: string) =>
  p.category !== "teardown" && /\b(swimming pool|pool|spa)\b/.test(text) && !/\bdemo(lition|lish)?\b.*\bpool\b/.test(text);

// Order matters: the first rule that tags a trade supplies the "why" shown to the contractor.
// These are "who wants this job next" guesses, not certainties.
const RULES: Rule[] = [
  { when: (p) => p.category === "new_home", trades: ["fence", "landscaping", "gutters", "blinds"], reason: "New home being built — the buyer will need it" },
  { when: isPoolWork, trades: ["pool"], reason: "New pool going in — needs service and maintenance" },
  { when: isPoolWork, trades: ["fence"], reason: "Pools require a barrier fence by code" },
  { when: isPoolWork, trades: ["landscaping"], reason: "Yard needs restoring after the pool build" },
  { when: (p, t) => p.category === "new_home" && /\b(lot|acre|backyard|outdoor living)\b/.test(t), trades: ["pool"], reason: "New home with yard space — a pool prospect" },
  { when: (p) => p.category === "teardown", trades: ["fence", "landscaping"], reason: "Teardown — a new home usually follows" },
  { when: has(/\bfenc(e|es|ing)\b/), trades: ["fence"], reason: "Fence work is part of this permit" },
  { when: has(/\b(deck|patio|pergola|outdoor (living|kitchen)|retaining wall|landscap\w*|irrigation|hardscape)\b/), trades: ["landscaping"], reason: "Outdoor living or yard work" },
  { when: isRealAddition, trades: ["gutters"], reason: "Addition changes the roofline" },
  { when: isRealAddition, trades: ["blinds"], reason: "New rooms need window coverings" },
  { when: has(/\b(re-?roof\w*|roof replacement|new roof)\b/), trades: ["gutters"], reason: "Roof work — gutters are often replaced too" },
  { when: has(/\bgutters?\b/), trades: ["gutters"], reason: "Gutters mentioned in the permit" },
  { when: has(/\bdrainage\b/), trades: ["gutters", "landscaping"], reason: "Drainage work on the property" },
  { when: has(/\b(windows?|sliding doors?|glass doors?)\b/), trades: ["blinds"], reason: "New or replaced windows" },
];

export function tagPermit(p: TagInput): { trades: TradeId[]; reasons: Partial<Record<TradeId, string>> } {
  const text = p.description.toLowerCase();
  const reasons: Partial<Record<TradeId, string>> = {};
  for (const rule of RULES) {
    if (!rule.when(p, text)) continue;
    for (const t of rule.trades) reasons[t] ??= rule.reason;
  }
  const trades = TRADES.map((t) => t.id).filter((id) => reasons[id]);
  return { trades, reasons };
}
