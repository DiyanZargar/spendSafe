import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { DayOfWeekPoint } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

interface DayOfWeekChartProps {
  data: DayOfWeekPoint[];
  currency?: string;
}

export const DayOfWeekChart: React.FC<DayOfWeekChartProps> = ({
  data,
  currency = 'USD',
}) => {
  const { isMonokai } = useTheme();

  if (!data || data.length === 0) {
    return (
      <div className="h-60 flex items-center justify-center font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
        No weekly cyclical telemetry found.
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    shortDay: d.day.slice(0, 3).toUpperCase(),
    amountNum: Number(d.amount),
  }));

  const barColor = isMonokai ? '#f92672' : '#10b981';
  const gridColor = isMonokai ? '#3e3d32' : '#f1f5f9';
  const axisColor = isMonokai ? '#75715e' : '#94a3b8';

  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis
            dataKey="shortDay"
            stroke={axisColor}
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: isMonokai ? '#3e3d32' : '#e2e8f0' }}
            fontFamily="'JetBrains Mono', monospace"
          />
          <YAxis
            stroke={axisColor}
            fontSize={11}
            tickLine={false}
            axisLine={false}
            fontFamily="'JetBrains Mono', monospace"
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as typeof chartData[0];
                return (
                  <div
                    className="p-3 rounded-2xl border shadow-xl font-mono text-xs"
                    style={{
                      backgroundColor: 'var(--bg-card-elevated)',
                      borderColor: 'var(--border-active)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <div className="text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>
                      Day: {item.day}
                    </div>
                    <div className="text-sm font-black" style={{ color: 'var(--accent-magenta)' }}>
                      {formatCurrency(item.amountNum, currency)}
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color: 'var(--accent-cyan)' }}>
                      {item.count} transaction{item.count !== 1 ? 's' : ''}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="amountNum" fill={barColor} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
