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

interface SpendingTrendChartProps {
  data: SpendingTrendPoint[];
  currency?: string;
}

export const SpendingTrendChart: React.FC<SpendingTrendChartProps> = ({
  data,
  currency = 'USD',
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
        No spending trend data available for this period.
      </div>
    );
  }

  // Format short date for X-axis (e.g. "Oct 01")
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

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="spendingTrendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="displayDate"
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as typeof chartData[0];
                return (
                  <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-lg text-xs">
                    <div className="text-slate-500 font-medium mb-1">{item.date}</div>
                    <div className="text-slate-900 font-extrabold text-sm">
                      {formatCurrency(item.amountNum, currency)}
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      {item.count} transaction{item.count !== 1 ? 's' : ''}
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
            stroke="#059669"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#spendingTrendGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
