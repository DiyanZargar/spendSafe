import React from 'react';
import { RefreshCw, CheckCircle, Clock } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

interface RecurringItem {
  id: string;
  merchant: string;
  amount: number;
  currency: string;
  frequency: string;
  next_occurrence: string;
  status: string;
}

interface RecurringExpensesCardProps {
  items?: RecurringItem[];
  currency?: string;
}

export const RecurringExpensesCard: React.FC<RecurringExpensesCardProps> = ({
  items = [],
  currency = 'USD',
}) => {
  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-xs">
          No recurring subscriptions currently tracked.
          <div className="mt-1 text-slate-500">
            Ask the AI: <span className="text-emerald-600 font-semibold">"Is my Netflix subscription active?"</span>
          </div>
        </div>
      ) : (
        items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">{item.merchant}</div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span className="capitalize">{item.frequency}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Next: {formatDate(item.next_occurrence)}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-extrabold text-slate-900">
                {formatCurrency(item.amount, item.currency || currency)}
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">
                <CheckCircle className="w-3 h-3" />
                Active
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
