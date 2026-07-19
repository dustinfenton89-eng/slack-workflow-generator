const POLYGON_BASE = "https://api.polygon.io";

// Polygon's free tier returns data delayed ~15 minutes; a paid Options/Stocks
// Advanced plan unlocks real-time data on the same endpoints. We can't detect
// the caller's plan from the response, so this is an explicit opt-in flag the
// user sets once they've upgraded, and the UI labels data accordingly.
export const IS_REALTIME = process.env.POLYGON_REALTIME === "true";

export class PolygonError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function polygonFetch<T>(path: string, params: Record<string, string | number | undefined> = {}) {
  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) {
    throw new PolygonError(
      "POLYGON_API_KEY is not configured on the server. Add it to your environment to load market data.",
      503
    );
  }

  const url = new URL(`${POLYGON_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  url.searchParams.set("apiKey", apiKey);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new PolygonError(
      `Polygon request failed (${res.status}): ${body || res.statusText}`,
      res.status
    );
  }
  return (await res.json()) as T;
}

export type Quote = {
  ticker: string;
  price: number | null;
  prevClose: number | null;
  change: number | null;
  changePercent: number | null;
  dayOpen: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  volume: number | null;
  updated: string;
  realtime: boolean;
};

type PolygonSnapshotResponse = {
  ticker?: {
    lastTrade?: { p?: number };
    day?: { c?: number; o?: number; h?: number; l?: number; v?: number };
    prevDay?: { c?: number };
    todaysChange?: number;
    todaysChangePerc?: number;
  };
};

export async function getQuote(ticker: string): Promise<Quote> {
  const data = await polygonFetch<PolygonSnapshotResponse>(
    `/v2/snapshot/locale/us/markets/stocks/tickers/${encodeURIComponent(ticker)}`
  );
  const t = data?.ticker;
  const price = t?.lastTrade?.p ?? t?.day?.c ?? t?.prevDay?.c ?? null;
  const prevClose = t?.prevDay?.c ?? null;
  const change = price != null && prevClose != null ? price - prevClose : t?.todaysChange ?? null;
  const changePercent = t?.todaysChangePerc ?? (price != null && prevClose ? (change! / prevClose) * 100 : null);

  return {
    ticker: ticker.toUpperCase(),
    price,
    prevClose,
    change,
    changePercent,
    dayOpen: t?.day?.o ?? null,
    dayHigh: t?.day?.h ?? null,
    dayLow: t?.day?.l ?? null,
    volume: t?.day?.v ?? null,
    updated: new Date().toISOString(),
    realtime: IS_REALTIME,
  };
}

export type Bar = { t: number; o: number; h: number; l: number; c: number; v: number };

export async function getAggregates(
  ticker: string,
  opts: { multiplier?: number; timespan?: "minute" | "hour" | "day"; days?: number } = {}
): Promise<Bar[]> {
  const { multiplier = 1, timespan = "day", days = 180 } = opts;
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  type PolygonAggsResponse = {
    results?: { t: number; o: number; h: number; l: number; c: number; v: number }[];
  };

  const data = await polygonFetch<PolygonAggsResponse>(
    `/v2/aggs/ticker/${encodeURIComponent(ticker)}/range/${multiplier}/${timespan}/${fmt(from)}/${fmt(to)}`,
    { adjusted: "true", sort: "asc", limit: 5000 }
  );

  return (data?.results ?? []).map((r) => ({
    t: r.t,
    o: r.o,
    h: r.h,
    l: r.l,
    c: r.c,
    v: r.v,
  }));
}

export type OptionContract = {
  symbol: string;
  strike: number;
  expiration: string;
  contractType: "call" | "put";
  bid: number | null;
  ask: number | null;
  last: number | null;
  impliedVolatility: number | null;
  delta: number | null;
  gamma: number | null;
  theta: number | null;
  vega: number | null;
  openInterest: number | null;
  volume: number | null;
};

export async function getOptionsChain(
  ticker: string,
  opts: { expiration?: string; limit?: number } = {}
): Promise<OptionContract[]> {
  type PolygonOptionsChainResponse = {
    results?: {
      details?: { ticker?: string; strike_price?: number; expiration_date?: string; contract_type?: "call" | "put" };
      last_quote?: { bid?: number; ask?: number };
      last_trade?: { price?: number };
      day?: { close?: number; volume?: number };
      implied_volatility?: number;
      greeks?: { delta?: number; gamma?: number; theta?: number; vega?: number };
      open_interest?: number;
    }[];
  };

  const data = await polygonFetch<PolygonOptionsChainResponse>(`/v3/snapshot/options/${encodeURIComponent(ticker)}`, {
    "expiration_date": opts.expiration,
    limit: opts.limit ?? 250,
  });

  return (data?.results ?? []).map((r) => ({
    symbol: r.details?.ticker ?? "",
    strike: r.details?.strike_price ?? 0,
    expiration: r.details?.expiration_date ?? "",
    contractType: r.details?.contract_type ?? "call",
    bid: r.last_quote?.bid ?? null,
    ask: r.last_quote?.ask ?? null,
    last: r.day?.close ?? r.last_trade?.price ?? null,
    impliedVolatility: r.implied_volatility ?? null,
    delta: r.greeks?.delta ?? null,
    gamma: r.greeks?.gamma ?? null,
    theta: r.greeks?.theta ?? null,
    vega: r.greeks?.vega ?? null,
    openInterest: r.open_interest ?? null,
    volume: r.day?.volume ?? null,
  }));
}
