import type { Bar, OptionContract } from "./polygon";
import { ema, rsi, sma, supportResistance, volumeTrend } from "./indicators";

export type EntryBias = "bullish" | "bearish" | "neutral";

export type EntrySignal = {
  bias: EntryBias;
  score: number; // -100 (strongly bearish) .. 100 (strongly bullish)
  reasons: string[];
  volatilityRegime: "rich" | "cheap" | "unclear";
  suggestedApproach: string;
};

function annualizedRealizedVol(closes: number[]): number | null {
  if (closes.length < 15) return null;
  const returns: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    returns.push(Math.log(closes[i] / closes[i - 1]));
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / (returns.length - 1);
  return Math.sqrt(variance) * Math.sqrt(252) * 100;
}

function nearTheMoneyAvgIV(chain: OptionContract[], spot: number): number | null {
  const candidates = chain.filter(
    (c) => c.impliedVolatility != null && Math.abs(c.strike - spot) / spot <= 0.05
  );
  if (candidates.length === 0) return null;
  const sum = candidates.reduce((a, c) => a + (c.impliedVolatility as number), 0);
  return (sum / candidates.length) * 100;
}

/**
 * Rule-based, fully explainable technical + volatility read. This is not a
 * predictive model — it surfaces the same signals a self-directed trader
 * would eyeball (trend, momentum, level, volume, vol regime) and shows its
 * work via `reasons`, so it's useful for coaching without implying it
 * "knows" where price is going.
 */
export function computeEntrySignal(bars: Bar[], chain: OptionContract[]): EntrySignal {
  const reasons: string[] = [];
  let score = 0;

  if (bars.length < 20) {
    return {
      bias: "neutral",
      score: 0,
      reasons: ["Not enough price history yet to form a read."],
      volatilityRegime: "unclear",
      suggestedApproach: "Wait for more data before evaluating an entry.",
    };
  }

  const closes = bars.map((b) => b.c);
  const spot = closes[closes.length - 1];

  const sma20 = sma(closes, 20).at(-1);
  const sma50 = sma(closes, Math.min(50, closes.length)).at(-1);
  const ema12 = ema(closes, 12).at(-1);
  const ema26 = ema(closes, 26).at(-1);
  const latestRsi = rsi(closes, 14).at(-1);
  const { support, resistance } = supportResistance(bars);
  const volTrend = volumeTrend(bars);

  if (sma20 != null && sma50 != null) {
    if (sma20 > sma50) {
      score += 20;
      reasons.push(`20-period average ($${sma20.toFixed(2)}) is above the 50-period average ($${sma50.toFixed(2)}), an uptrend signal.`);
    } else {
      score -= 20;
      reasons.push(`20-period average ($${sma20.toFixed(2)}) is below the 50-period average ($${sma50.toFixed(2)}), a downtrend signal.`);
    }
  }

  if (ema12 != null && ema26 != null) {
    if (ema12 > ema26) {
      score += 15;
      reasons.push("Short-term momentum (12/26 EMA) is positive.");
    } else {
      score -= 15;
      reasons.push("Short-term momentum (12/26 EMA) is negative.");
    }
  }

  if (latestRsi != null) {
    if (latestRsi >= 70) {
      score -= 15;
      reasons.push(`RSI is ${latestRsi.toFixed(0)} — overbought territory, momentum may be stretched.`);
    } else if (latestRsi <= 30) {
      score += 15;
      reasons.push(`RSI is ${latestRsi.toFixed(0)} — oversold territory, could be due for a bounce.`);
    } else {
      reasons.push(`RSI is ${latestRsi.toFixed(0)} — neutral, no extreme.`);
    }
  }

  if (support != null && resistance != null) {
    const range = resistance - support || 1;
    const posInRange = (spot - support) / range;
    if (posInRange <= 0.15) {
      score += 10;
      reasons.push(`Price is near the recent support level ($${support.toFixed(2)}).`);
    } else if (posInRange >= 0.85) {
      score -= 10;
      reasons.push(`Price is near the recent resistance level ($${resistance.toFixed(2)}).`);
    }
  }

  if (volTrend != null) {
    if (volTrend >= 1.3) {
      reasons.push("Volume is running above its recent average, indicating rising interest.");
    } else if (volTrend <= 0.7) {
      reasons.push("Volume is running below its recent average, indicating fading interest.");
    }
  }

  const rv = annualizedRealizedVol(closes);
  const iv = nearTheMoneyAvgIV(chain, spot);
  let volatilityRegime: EntrySignal["volatilityRegime"] = "unclear";
  if (rv != null && iv != null) {
    const ratio = iv / rv;
    if (ratio >= 1.15) {
      volatilityRegime = "rich";
      reasons.push(`Implied volatility (${iv.toFixed(0)}%) is running well above realized volatility (${rv.toFixed(0)}%) — options premium looks relatively expensive.`);
    } else if (ratio <= 0.85) {
      volatilityRegime = "cheap";
      reasons.push(`Implied volatility (${iv.toFixed(0)}%) is running below realized volatility (${rv.toFixed(0)}%) — options premium looks relatively cheap.`);
    } else {
      volatilityRegime = "unclear";
      reasons.push(`Implied volatility (${iv.toFixed(0)}%) is roughly in line with realized volatility (${rv.toFixed(0)}%).`);
    }
  }

  score = Math.max(-100, Math.min(100, score));
  const bias: EntryBias = score >= 15 ? "bullish" : score <= -15 ? "bearish" : "neutral";

  const suggestedApproach = suggestApproach(bias, volatilityRegime);

  return { bias, score, reasons, volatilityRegime, suggestedApproach };
}

function suggestApproach(bias: EntryBias, vol: EntrySignal["volatilityRegime"]): string {
  const table: Record<EntryBias, Record<EntrySignal["volatilityRegime"], string>> = {
    bullish: {
      rich: "Bullish with rich premium: consider a defined-risk credit strategy that benefits from time decay, like a short put spread, rather than paying up for long calls.",
      cheap: "Bullish with cheap premium: a long call or call debit spread gets you upside exposure without overpaying for volatility.",
      unclear: "Bullish bias: a call debit spread balances cost and upside while capping risk.",
    },
    bearish: {
      rich: "Bearish with rich premium: consider a short call spread to collect elevated premium with defined risk instead of buying puts outright.",
      cheap: "Bearish with cheap premium: a long put or put debit spread gets you downside exposure at a reasonable cost.",
      unclear: "Bearish bias: a put debit spread balances cost and downside exposure while capping risk.",
    },
    neutral: {
      rich: "Neutral with rich premium: this favors premium-selling, range-bound strategies like an iron condor or covered call.",
      cheap: "Neutral with cheap premium: there's no strong edge for buying or selling volatility here — consider waiting for a clearer setup.",
      unclear: "No strong directional or volatility edge right now — this is a reasonable one to watch rather than act on.",
    },
  };
  return table[bias][vol];
}
