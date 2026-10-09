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
import { useTheme } from '../context/ThemeContext';

interface CategoryBreakdownChartProps {
  categories: CategoryBreakdown[];
  currency?: string;
}

const MONOKAI_CATEGORY_COLORS = [
  '#a6e22e', // Green
  '#66d9ef', // Cyan
  '#f92672', // Magenta
  '#e6db74', // Yellow
  '#ae81ff', // Purple
  '#fd971f', // Orange
  '#38d9a9', // Teal
  '#f8f8f2', // Soft white
  '#75715e', // Olive
];

const LIGHT_CATEGORY_COLORS = [
  '#059669', // Emerald
  '#2563eb', // Blue
  '#e11d48', // Rose
  '#d97706', // Amber
  '#7c3aed', // Purple
  '#ea580c', // Orange
  '#0891b2', // Cyan
  '#475569', // Slate
];

export const CategoryBreakdownChart: React.FC<CategoryBreakdownChartProps> = ({
  categories,
  currency = 'USD',
}) => {
  const { isMonokai } = useTheme();
  const colors = isMonokai ? MONOKAI_CATEGORY_COLORS : LIGHT_CATEGORY_COLORS;

  if (!categories || categories.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
        No category allocations mapped.
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
                    <div
                      className="p-3 rounded-2xl border shadow-xl font-mono text-xs"
                      style={{
                        backgroundColor: 'var(--bg-card-elevated)',
                        borderColor: 'var(--border-active)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <div className="font-bold mb-1" style={{ color: 'var(--accent-cyan)' }}>
                        {data.category}
                      </div>
                      <div className="text-sm font-black" style={{ color: 'var(--accent-yellow)' }}>
                        {formatCurrency(data.amountNum, currency)}
                      </div>
                      <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {data.percentage.toFixed(1)}% share • {data.count} txns
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
              paddingAngle={4}
              stroke="none"
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Category List */}
      <div className="w-full sm:w-1/2 max-h-56 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
        {chartData.map((cat, idx) => (
          <div
            key={cat.category}
            className="flex items-center justify-between py-1.5 px-2 rounded-xl border transition-colors"
            style={{
              backgroundColor: 'var(--bg-base)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-center gap-2 truncate">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: colors[idx % colors.length] }}
              />
              <span className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {cat.category}
              </span>
            </div>
            <div className="text-right shrink-0">
              <span className="font-bold" style={{ color: 'var(--accent-yellow)' }}>
                {formatCurrency(cat.amountNum, currency)}
              </span>
              <span className="ml-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                ({cat.percentage.toFixed(0)}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
