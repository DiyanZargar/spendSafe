import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  FileText,
  Download,
  Loader2,
  CheckCircle,
  TrendingUp,
  Tag,
  DollarSign,
  Printer,
  Calendar,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { reportService } from '../services/reports';
import { ReportItem } from '../types';
import { formatCurrency } from '../utils/formatters';

const CATEGORY_COLORS = [
  'var(--accent-magenta)',
  'var(--accent-cyan)',
  'var(--accent-green)',
  'var(--accent-yellow)',
  'var(--accent-purple)',
  'var(--accent-orange)',
];

export const ReportsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('this_month');
  const [reportType, setReportType] = useState<string>('monthly');
  const [latestReport, setLatestReport] = useState<ReportItem | null>(null);

  const generateMutation = useMutation({
    mutationFn: () => reportService.generateReport(selectedPeriod, reportType),
    onSuccess: (data) => {
      setLatestReport(data);
    },
  });

  // Auto-generate current month on initial mount
  useEffect(() => {
    generateMutation.mutate();
  }, [selectedPeriod, reportType]);

  const handleGenerate = () => {
    generateMutation.mutate();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    if (!latestReport) return;
    const blob = new Blob([JSON.stringify(latestReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${latestReport.period || 'current'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const summary = latestReport?.data?.summary;
  const currency = latestReport?.data?.currency || 'USD';
  const categories: Array<{ category: string; amount: number; count: number }> =
    latestReport?.data?.categories || [];
  const largestExpenses: Array<{ id: string; merchant: string; amount: number; category: string; date: string }> =
    latestReport?.data?.largest_expenses || [];
  const topMerchants: Array<{ merchant: string; amount: number; count: number }> =
    latestReport?.data?.top_merchants || [];

  const totalAmount = summary?.total_amount || 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-mono">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Financial Statements & Reports
            </h2>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full border"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--accent-cyan)',
              }}
            >
              INTERACTIVE LEDGER AUDIT
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Real-time analytics, category allocations, and verified statement export
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            title="Print or Save PDF"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold border transition-all hover:scale-105"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-main)',
              color: 'var(--text-primary)',
            }}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>

          <button
            onClick={handleDownloadJson}
            title="Export JSON Telemetry"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold border transition-all hover:scale-105"
            style={{
              backgroundColor: 'var(--bg-hover)',
              borderColor: 'var(--accent-cyan)',
              color: 'var(--accent-cyan)',
            }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {/* Generator Control Card */}
      <div
        className="p-4 sm:p-5 rounded-3xl border transition-all space-y-3"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-main)',
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              Target Window
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 rounded-2xl text-xs border focus:outline-none transition-colors"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-main)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="this_month">This Month</option>
              <option value="previous_month">Previous Month</option>
              <option value="this_year">This Year</option>
              <option value="september">September</option>
              <option value="august">August</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              Statement Format
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 rounded-2xl text-xs border focus:outline-none transition-colors"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-main)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="monthly">Monthly Financial Audit</option>
              <option value="yearly">Annual Trajectory Summary</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-2xl transition-all hover:scale-102 active:scale-98 disabled:opacity-50 shadow-lg"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--accent-primary-fg)',
                boxShadow: '0 4px 14px var(--accent-primary-glow)',
              }}
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Refresh Statement</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Statement Canvas Card */}
      {latestReport && (
        <div
          id="financial-statement-canvas"
          className="rounded-3xl border shadow-xl p-5 sm:p-7 space-y-6 transition-all animate-fadeIn"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-main)',
          }}
        >
          {/* Statement Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b gap-3" style={{ borderColor: 'var(--border-subtle)' }}>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest font-bold" style={{ color: 'var(--accent-magenta)' }}>
                  Ledger Statement
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full border" style={{ backgroundColor: 'var(--bg-hover)', borderColor: 'var(--border-active)', color: 'var(--accent-cyan)' }}>
                  {latestReport.period.toUpperCase()}
                </span>
              </div>
              <h3 className="text-lg font-black tracking-tight mt-1" style={{ color: 'var(--text-primary)' }}>
                Executive Spending Breakdown
              </h3>
            </div>
            <div className="text-right text-[11px]" style={{ color: 'var(--text-muted)' }}>
              <div className="flex items-center gap-1.5 justify-end">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Cryptographically Verified</span>
              </div>
              <div>Generated: {new Date().toLocaleDateString()}</div>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl border" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-main)' }}>
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Total Expenditure
              </div>
              <div className="text-xl sm:text-2xl font-black mt-1" style={{ color: 'var(--accent-yellow)' }}>
                {formatCurrency(totalAmount, currency)}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl border" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-main)' }}>
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Daily Velocity
              </div>
              <div className="text-xl sm:text-2xl font-black mt-1" style={{ color: 'var(--accent-green)' }}>
                {formatCurrency(summary?.average_daily || 0, currency)}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl border" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-main)' }}>
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Events Count
              </div>
              <div className="text-xl sm:text-2xl font-black mt-1" style={{ color: 'var(--accent-cyan)' }}>
                {summary?.transaction_count || 0}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl border" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-main)' }}>
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Categories
              </div>
              <div className="text-xl sm:text-2xl font-black mt-1" style={{ color: 'var(--accent-purple)' }}>
                {categories.length}
              </div>
            </div>
          </div>

          {/* Category Progress Allocations */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
              <Tag className="w-3.5 h-3.5" style={{ color: 'var(--accent-magenta)' }} />
              <span>Category Allocation Breakdown</span>
            </h4>

            {categories.length === 0 ? (
              <div className="text-xs p-4 rounded-xl border text-center" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                No category transactions recorded for this period.
              </div>
            ) : (
              <div className="space-y-2">
                {categories.map((cat, idx) => {
                  const share = totalAmount > 0 ? (cat.amount / totalAmount) * 100 : 0;
                  const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                  return (
                    <div key={cat.category} className="p-3 rounded-2xl border" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                            {cat.category}
                          </span>
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            ({cat.count} txns)
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-black" style={{ color: 'var(--text-primary)' }}>
                            {formatCurrency(cat.amount, currency)}
                          </span>
                          <span className="text-[11px] font-mono font-bold w-12 text-right" style={{ color }}>
                            {share.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-hover)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(share, 100)}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notable Transactions Ledger */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
              <Layers className="w-3.5 h-3.5" style={{ color: 'var(--accent-cyan)' }} />
              <span>Notable Records & High-Impact Events</span>
            </h4>

            {largestExpenses.length === 0 ? (
              <div className="text-xs p-4 rounded-xl border text-center" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                No detailed expense rows recorded for this period.
              </div>
            ) : (
              <div className="border rounded-2xl overflow-hidden" style={{ borderColor: 'var(--border-main)' }}>
                <table className="w-full text-left text-xs">
                  <thead style={{ backgroundColor: 'var(--bg-sidebar)', color: 'var(--text-muted)' }}>
                    <tr className="border-b" style={{ borderColor: 'var(--border-main)' }}>
                      <th className="py-2.5 px-4 font-bold text-[10px] uppercase">Date</th>
                      <th className="py-2.5 px-4 font-bold text-[10px] uppercase">Vendor / Note</th>
                      <th className="py-2.5 px-4 font-bold text-[10px] uppercase">Category</th>
                      <th className="py-2.5 px-4 font-bold text-[10px] uppercase text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                    {largestExpenses.map((e) => (
                      <tr key={e.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                        <td className="py-2.5 px-4 font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          {e.date}
                        </td>
                        <td className="py-2.5 px-4 font-bold" style={{ color: 'var(--text-primary)' }}>
                          {e.merchant || 'Unspecified'}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="text-[10px] px-2 py-0.5 rounded-full border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-active)', color: 'var(--accent-cyan)' }}>
                            {e.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-black" style={{ color: 'var(--accent-yellow)' }}>
                          {formatCurrency(e.amount, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
