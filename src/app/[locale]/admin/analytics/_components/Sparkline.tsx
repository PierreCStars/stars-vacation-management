'use client';

type Props = {
  data: Array<{ month: string; days: number }>;
  width?: number;
  height?: number;
  color?: string;
};

/**
 * Tiny SVG sparkline — bars of monthly days.
 * Designed for table cells. No labels, just shape.
 */
export function Sparkline({ data, width = 120, height = 28, color = '#D8B11B' }: Props) {
  const max = Math.max(0.5, ...data.map(d => d.days));
  const barWidth = (width - (data.length - 1) * 2) / data.length;
  const baseline = height - 1;

  return (
    <svg width={width} height={height} aria-label="12-month days distribution" role="img">
      {data.map((d, i) => {
        const h = max > 0 ? (d.days / max) * (height - 2) : 0;
        const x = i * (barWidth + 2);
        const y = baseline - h;
        return (
          <rect
            key={d.month}
            x={x}
            y={y}
            width={barWidth}
            height={Math.max(h, d.days > 0 ? 1 : 0)}
            fill={color}
            opacity={d.days > 0 ? 0.85 : 0.15}
            rx={1}
          >
            <title>{`${d.month}: ${d.days.toFixed(1)} days`}</title>
          </rect>
        );
      })}
    </svg>
  );
}
