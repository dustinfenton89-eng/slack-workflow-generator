import type { Condition } from "./types";

export const CONDITIONS: Condition[] = ["New", "Like New", "Good", "Fair"];

export type CatalogModel = {
  key: string;
  brand: string;
  model: string;
  /** Payout in cents, by condition. This is the site's fixed buy price — not the resale price. */
  payoutCents: Record<Condition, number>;
};

// Placeholder buy prices — adjust to whatever the site actually pays before going live.
export const CATALOG: CatalogModel[] = [
  {
    key: "ti-84-plus-ce",
    brand: "Texas Instruments",
    model: "TI-84 Plus CE",
    payoutCents: { New: 7000, "Like New": 5500, Good: 4000, Fair: 2000 },
  },
  {
    key: "ti-84-plus",
    brand: "Texas Instruments",
    model: "TI-84 Plus",
    payoutCents: { New: 4500, "Like New": 3500, Good: 2500, Fair: 1200 },
  },
  {
    key: "ti-83-plus",
    brand: "Texas Instruments",
    model: "TI-83 Plus",
    payoutCents: { New: 3000, "Like New": 2200, Good: 1500, Fair: 800 },
  },
  {
    key: "ti-nspire-cx-ii-cas",
    brand: "Texas Instruments",
    model: "TI-Nspire CX II CAS",
    payoutCents: { New: 9000, "Like New": 7000, Good: 5000, Fair: 2500 },
  },
  {
    key: "ti-nspire-cx-ii",
    brand: "Texas Instruments",
    model: "TI-Nspire CX II",
    payoutCents: { New: 7500, "Like New": 5800, Good: 4200, Fair: 2000 },
  },
  {
    key: "ti-89-titanium",
    brand: "Texas Instruments",
    model: "TI-89 Titanium",
    payoutCents: { New: 5000, "Like New": 3800, Good: 2800, Fair: 1500 },
  },
  {
    key: "casio-fx-9750giii",
    brand: "Casio",
    model: "fx-9750GIII",
    payoutCents: { New: 3500, "Like New": 2700, Good: 1800, Fair: 900 },
  },
  {
    key: "casio-fx-cg50",
    brand: "Casio",
    model: "fx-CG50",
    payoutCents: { New: 5500, "Like New": 4200, Good: 3000, Fair: 1500 },
  },
  {
    key: "hp-prime",
    brand: "HP",
    model: "Prime",
    payoutCents: { New: 6000, "Like New": 4600, Good: 3300, Fair: 1700 },
  },
];

export function findModel(key: string): CatalogModel | undefined {
  return CATALOG.find((m) => m.key === key);
}

export function getPayoutCents(key: string, condition: Condition): number | null {
  const model = findModel(key);
  if (!model) return null;
  return model.payoutCents[condition] ?? null;
}
