import type { Bar } from "./polygon";

export function sma(values: number[], period: number): (number | null)[] {
  return values.map((_, i) => {
    if (i < period - 1) return null;
    const window = values.slice(i - period + 1, i + 1);
    return window.reduce((a, b) => a + b, 0) / period;
  });
}

export function ema(values: number[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  const result: (number | null)[] = [];
  let prev: number | null = null;

  values.forEach((v, i) => {
    if (i < period - 1) {
      result.push(null);
      return;
    }
    if (prev === null) {
      const seed = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
      prev = seed;
      result.push(seed);
      return;
    }
    prev = v * k + prev * (1 - k);
    result.push(prev);
  });

  return result;
}

/** Classic Wilder RSI. Returns null until enough data has accumulated. */
export function rsi(values: number[], period = 14): (number | null)[] {
  const result: (number | null)[] = new Array(values.length).fill(null);
  if (values.length <= period) return result;

  let gainSum = 0;
  let lossSum = 0;
  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gainSum += diff;
    else lossSum -= diff;
  }
  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;
  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }

  return result;
}

/** Naive swing-based support/resistance from recent bar extremes. */
export function supportResistance(bars: Bar[], lookback = 30) {
  const recent = bars.slice(-lookback);
  if (recent.length === 0) return { support: null, resistance: null };
  return {
    support: Math.min(...recent.map((b) => b.l)),
    resistance: Math.max(...recent.map((b) => b.h)),
  };
}

/** Compares recent average volume to a longer baseline; >1 means rising interest. */
export function volumeTrend(bars: Bar[], recentWindow = 5, baselineWindow = 30) {
  if (bars.length < baselineWindow) return null;
  const recent = bars.slice(-recentWindow);
  const baseline = bars.slice(-baselineWindow);
  const avg = (arr: Bar[]) => arr.reduce((a, b) => a + b.v, 0) / arr.length;
  const baselineAvg = avg(baseline);
  if (baselineAvg === 0) return null;
  return avg(recent) / baselineAvg;
}
