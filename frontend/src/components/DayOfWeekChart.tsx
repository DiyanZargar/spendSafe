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

interface DayOfWeekChartProps {
  data: DayOfWeekPoint[];
  currency?: string;
}

export const DayOfWeekChart: React.FC<DayOfWeekChartProps> = ({
  data,
  currency = 'USD',
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-60 flex items-center justify-center text-slate-400 text-sm">
        No day-of-week data available.
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    shortDay: d.day.slice(0, 3),
    amountNum: Number(d.amount),
  }));

  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="shortDay" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as typeof chartData[0];
                return (
                  <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-lg text-xs">
                    <div className="text-slate-500 font-medium">{item.day}</div>
                    <div className="text-emerald-700 font-extrabold text-sm">
                      {formatCurrency(item.amountNum, currency)}
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      {item.count} transaction{item.count !== 1 ? 's' : ''}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="amountNum" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
