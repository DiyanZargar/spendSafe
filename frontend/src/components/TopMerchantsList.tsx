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
      <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
        No merchant data recorded.
      </div>
    );
  }

  const maxAmount = Math.max(...merchants.map((m) => Number(m.amount)), 1);

  return (
    <div className="space-y-3.5">
      {merchants.map((m, index) => {
        const amt = Number(m.amount);
        const percent = Math.min(100, Math.round((amt / maxAmount) * 100));

        return (
          <div key={`${m.merchant}-${index}`} className="group">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-2 truncate">
                <div className="w-5 h-5 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 group-hover:text-emerald-600 transition-colors shrink-0">
                  <Store className="w-3 h-3" />
                </div>
                <span className="font-semibold text-slate-800 truncate">{m.merchant}</span>
                <span className="text-slate-400 text-[11px] shrink-0">({m.count} txns)</span>
              </div>
              <span className="font-bold text-slate-900 shrink-0">
                {formatCurrency(amt, currency)}
              </span>
            </div>
            {/* Progress meter */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
