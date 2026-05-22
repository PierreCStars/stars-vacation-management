'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { SeasonalityPoint } from './types';

type Props = {
  currentYear: { year: number; series: SeasonalityPoint[] };
  previousYear: { year: number; series: SeasonalityPoint[] };
};

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function SeasonalityChart({ currentYear, previousYear }: Props) {
  const data = MONTH_SHORT.map((label, i) => {
    const monthIdx = i + 1;
    const curKey = `${currentYear.year}-${String(monthIdx).padStart(2, '0')}`;
    const prevKey = `${previousYear.year}-${String(monthIdx).padStart(2, '0')}`;
    return {
      month: label,
      current: currentYear.series.find(p => p.month === curKey)?.days || 0,
      previous: previousYear.series.find(p => p.month === prevKey)?.days || 0,
    };
  });

  const hasPreviousData = data.some(d => d.previous > 0);

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D8B11B" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#D8B11B" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 4" stroke="rgba(10,10,10,0.06)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: '#273341' }}
            axisLine={{ stroke: 'rgba(10,10,10,0.1)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#273341' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: '#ffffff',
              border: '1px solid rgba(10,10,10,0.08)',
              borderRadius: 8,
              fontSize: 12,
              padding: '8px 12px',
            }}
            labelStyle={{ color: '#0A0A0A', fontWeight: 600 }}
            formatter={(value: number, name: string) => [
              `${value.toFixed(1)} days`,
              name === 'current' ? `${currentYear.year}` : `${previousYear.year}`,
            ]}
          />
          {hasPreviousData && (
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: 11, color: '#273341', paddingTop: 8 }}
              formatter={(v) => (v === 'current' ? `${currentYear.year}` : `${previousYear.year}`)}
            />
          )}
          {hasPreviousData && (
            <Area
              type="monotone"
              dataKey="previous"
              stroke="#7F94A9"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              fill="none"
              dot={false}
              activeDot={{ r: 4, fill: '#7F94A9' }}
            />
          )}
          <Area
            type="monotone"
            dataKey="current"
            stroke="#D8B11B"
            strokeWidth={2}
            fill="url(#goldFill)"
            dot={{ r: 3, fill: '#D8B11B' }}
            activeDot={{ r: 5, fill: '#D8B11B' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
