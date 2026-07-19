import type { Bar } from "../_lib/polygon";

export default function PriceChart({ bars, height = 160 }: { bars: Bar[]; height?: number }) {
  if (bars.length < 2) {
    return <div className="flex h-40 items-center justify-center text-sm text-zinc-500">Not enough data to chart yet.</div>;
  }

  const width = 600;
  const closes = bars.map((b) => b.c);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;

  const points = bars.map((b, i) => {
    const x = (i / (bars.length - 1)) * width;
    const y = height - ((b.c - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const up = closes.at(-1)! >= closes[0];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full" preserveAspectRatio="none">
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={up ? "#34d399" : "#f87171"}
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
