import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { CategoryBreakdown } from '../types';
import { formatCurrency } from '../utils/formatters';

interface CategoryBreakdownChartProps {
  categories: CategoryBreakdown[];
  currency?: string;
}

const CATEGORY_COLORS = [
  '#059669', // Emerald
  '#2563eb', // Blue
  '#0891b2', // Cyan
  '#d97706', // Amber
  '#db2777', // Pink
  '#7c3aed', // Purple
  '#dc2626', // Red
  '#0d9488', // Teal
  '#475569', // Slate
];

export const CategoryBreakdownChart: React.FC<CategoryBreakdownChartProps> = ({
  categories,
  currency = 'USD',
}) => {
  if (!categories || categories.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
        No category breakdown available.
      </div>
    );
  }

  const chartData = categories.map((c) => ({
    ...c,
    amountNum: Number(c.amount),
  }));

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 h-72">
      <div className="w-full sm:w-1/2 h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as typeof chartData[0];
                  return (
                    <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-lg text-xs">
                      <div className="font-bold text-slate-900 mb-0.5">{data.category}</div>
                      <div className="text-emerald-700 font-extrabold">
                        {formatCurrency(data.amountNum, currency)}
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        {data.percentage.toFixed(1)}% of total • {data.count} txns
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Pie
              data={chartData}
              dataKey="amountNum"
              nameKey="category"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              stroke="none"
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Category legend list */}
      <div className="w-full sm:w-1/2 max-h-56 overflow-y-auto space-y-2 pr-1">
        {chartData.map((cat, idx) => (
          <div key={cat.category} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
            <div className="flex items-center gap-2 truncate">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
              />
              <span className="text-slate-700 font-semibold truncate">{cat.category}</span>
            </div>
            <div className="text-right shrink-0">
              <span className="text-slate-900 font-bold">{formatCurrency(cat.amountNum, currency)}</span>
              <span className="text-slate-500 ml-1.5 text-[11px]">({cat.percentage.toFixed(0)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
