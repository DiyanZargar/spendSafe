import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { SpendingTrendPoint } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

interface SpendingTrendChartProps {
  data: SpendingTrendPoint[];
  currency?: string;
}

export const SpendingTrendChart: React.FC<SpendingTrendChartProps> = ({
  data,
  currency = 'USD',
}) => {
  const { isMonokai } = useTheme();

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
        No spending trajectory detected for selected window.
      </div>
    );
  }

  const chartData = data.map((d) => {
    let label = d.date;
    try {
      const parts = d.date.split('-');
      if (parts.length === 3) {
        label = `${parts[1]}/${parts[2]}`;
      }
    } catch {}
    return {
      ...d,
      displayDate: label,
      amountNum: Number(d.amount),
    };
  });

  const strokeColor = isMonokai ? '#a6e22e' : '#059669';
  const gridColor = isMonokai ? '#3e3d32' : '#f1f5f9';
  const axisColor = isMonokai ? '#75715e' : '#94a3b8';

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="spendingTrendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.35} />
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis
            dataKey="displayDate"
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
            tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
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
                      Date: {item.date}
                    </div>
                    <div className="text-base font-black" style={{ color: 'var(--accent-yellow)' }}>
                      {formatCurrency(item.amountNum, currency)}
                    </div>
                    <div className="text-[10px] mt-1" style={{ color: 'var(--accent-cyan)' }}>
                      {item.count} transaction{item.count !== 1 ? 's' : ''} logged
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="amountNum"
            stroke={strokeColor}
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#spendingTrendGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
