export type Leg = {
  type: "call" | "put";
  side: "long" | "short";
  strike: number;
  premium: number;
  quantity: number;
};

const MULTIPLIER = 100;

export function payoffAt(legs: Leg[], price: number): number {
  return legs.reduce((total, leg) => {
    const intrinsic = leg.type === "call" ? Math.max(price - leg.strike, 0) : Math.max(leg.strike - price, 0);
    const perContract = leg.side === "long" ? intrinsic - leg.premium : leg.premium - intrinsic;
    return total + perContract * leg.quantity * MULTIPLIER;
  }, 0);
}

/** Net cash flow at trade open: positive = credit received, negative = debit paid. */
export function netCredit(legs: Leg[]): number {
  return legs.reduce((total, leg) => {
    const sign = leg.side === "long" ? -1 : 1;
    return total + sign * leg.premium * leg.quantity * MULTIPLIER;
  }, 0);
}

export type StrategyAnalysis = {
  maxProfit: number | "unlimited";
  maxLoss: number | "unlimited";
  breakevens: number[];
  netCredit: number;
};

export function analyzeStrategy(legs: Leg[]): StrategyAnalysis {
  if (legs.length === 0) {
    return { maxProfit: 0, maxLoss: 0, breakevens: [], netCredit: 0 };
  }

  const maxStrike = Math.max(...legs.map((l) => l.strike));
  const upper = Math.max(maxStrike * 3, maxStrike + 100);
  const step = Math.max(upper / 2000, 0.1);

  let sampledMax = -Infinity;
  let sampledMin = Infinity;
  const breakevens: number[] = [];
  let prevPrice = 0;
  let prevPayoff = payoffAt(legs, 0);
  sampledMax = Math.max(sampledMax, prevPayoff);
  sampledMin = Math.min(sampledMin, prevPayoff);

  for (let price = step; price <= upper; price += step) {
    const payoff = payoffAt(legs, price);
    sampledMax = Math.max(sampledMax, payoff);
    sampledMin = Math.min(sampledMin, payoff);

    if ((prevPayoff < 0 && payoff >= 0) || (prevPayoff > 0 && payoff <= 0)) {
      const ratio = prevPayoff === payoff ? 0 : -prevPayoff / (payoff - prevPayoff);
      breakevens.push(round2(prevPrice + ratio * (price - prevPrice)));
    }

    prevPrice = price;
    prevPayoff = payoff;
  }

  // Detect unbounded profit/loss from net long/short calls whose payoff keeps
  // moving linearly as price rises without bound (puts are naturally capped
  // at price = 0, so only the upside needs this check).
  const farPayoff = payoffAt(legs, upper);
  const fartherPayoff = payoffAt(legs, upper * 2);
  const risingWithoutBound = Math.abs(fartherPayoff - farPayoff) > 0.01;

  const maxProfit = risingWithoutBound && fartherPayoff > farPayoff ? "unlimited" : round2(sampledMax);
  const maxLoss = risingWithoutBound && fartherPayoff < farPayoff ? "unlimited" : round2(sampledMin);

  return { maxProfit, maxLoss, breakevens, netCredit: round2(netCredit(legs)) };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export const STRATEGY_TEMPLATES: Record<string, { label: string; legs: Omit<Leg, "strike" | "premium">[] }> = {
  long_call: { label: "Long Call", legs: [{ type: "call", side: "long", quantity: 1 }] },
  long_put: { label: "Long Put", legs: [{ type: "put", side: "long", quantity: 1 }] },
  bull_call_spread: {
    label: "Bull Call Spread",
    legs: [
      { type: "call", side: "long", quantity: 1 },
      { type: "call", side: "short", quantity: 1 },
    ],
  },
  bear_put_spread: {
    label: "Bear Put Spread",
    legs: [
      { type: "put", side: "long", quantity: 1 },
      { type: "put", side: "short", quantity: 1 },
    ],
  },
  covered_call: {
    label: "Covered Call (short call leg only; assumes 100 shares owned)",
    legs: [{ type: "call", side: "short", quantity: 1 }],
  },
  iron_condor: {
    label: "Iron Condor",
    legs: [
      { type: "put", side: "long", quantity: 1 },
      { type: "put", side: "short", quantity: 1 },
      { type: "call", side: "short", quantity: 1 },
      { type: "call", side: "long", quantity: 1 },
    ],
  },
  straddle: {
    label: "Long Straddle",
    legs: [
      { type: "call", side: "long", quantity: 1 },
      { type: "put", side: "long", quantity: 1 },
    ],
  },
};
