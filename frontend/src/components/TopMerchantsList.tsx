import React from 'react';
import { Store } from 'lucide-react';
import { TopMerchantPoint } from '../types';
import { formatCurrency } from '../utils/formatters';

interface TopMerchantsListProps {
  merchants: TopMerchantPoint[];
  currency?: string;
}

export const TopMerchantsList: React.FC<TopMerchantsListProps> = ({
  merchants,
  currency = 'USD',
}) => {
  if (!merchants || merchants.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
        No merchant allocation recorded.
      </div>
    );
  }

  const maxAmount = Math.max(...merchants.map((m) => Number(m.amount)), 1);

  return (
    <div className="space-y-3 font-mono">
      {merchants.map((m, index) => {
        const amt = Number(m.amount);
        const percent = Math.min(100, Math.round((amt / maxAmount) * 100));

        return (
          <div
            key={`${m.merchant}-${index}`}
            className="p-3 rounded-2xl border transition-all duration-200 hover:scale-101"
            style={{
              backgroundColor: 'var(--bg-base)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-center justify-between text-xs mb-2">
              <div className="flex items-center gap-2 truncate">
                <div
                  className="w-6 h-6 rounded-lg border flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: 'var(--bg-hover)',
                    borderColor: 'var(--border-active)',
                    color: 'var(--accent-cyan)',
                  }}
                >
                  <Store className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                  {m.merchant}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  ({m.count} txns)
                </span>
              </div>
              <span className="font-black text-xs shrink-0" style={{ color: 'var(--accent-yellow)' }}>
                {formatCurrency(amt, currency)}
              </span>
            </div>

            {/* Neon Intensity Bar */}
            <div
              className="w-full h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--bg-card-subtle)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${percent}%`,
                  background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-green))',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
