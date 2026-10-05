import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { FileText, Download, Sparkles, Loader2, CheckCircle } from 'lucide-react';
import { reportService } from '../services/reports';
import { ReportItem } from '../types';
import { formatCurrency } from '../utils/formatters';

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

  const handleGenerate = () => {
    generateMutation.mutate();
  };

  const summary = latestReport?.data?.summary;
  const currency = latestReport?.data?.currency || 'USD';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Financial Reports & Visual Cards</h2>
          <p className="text-xs text-slate-500">Generate and export infographic reports (PNG)</p>
        </div>
      </div>

      {/* Generator Control Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-600" />
          <span>Generate Periodic Report</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Period
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 font-medium"
            >
              <option value="this_month">This Month</option>
              <option value="previous_month">Previous Month</option>
              <option value="this_year">This Year</option>
              <option value="september">September</option>
              <option value="august">August</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 font-medium"
            >
              <option value="monthly">Monthly Infographic</option>
              <option value="yearly">Annual Summary</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating PNG...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Report</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Generated Report Display */}
      {latestReport && (
        <div className="space-y-6 animate-fadeIn">
          {/* Summary Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Spending</div>
              <div className="text-xl font-extrabold text-slate-900 mt-1">
                {formatCurrency(summary?.total_amount || 0, currency)}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-slate-400">Daily Average</div>
              <div className="text-xl font-extrabold text-emerald-700 mt-1">
                {formatCurrency(summary?.average_daily || 0, currency)}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Transactions</div>
              <div className="text-xl font-extrabold text-blue-600 mt-1">
                {summary?.transaction_count || 0}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-slate-400">Status</div>
              <div className="text-sm font-semibold text-emerald-700 mt-1 flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Rendered Ready
              </div>
            </div>
          </div>

          {/* Visual PNG Infographic Card Preview & Download */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Visual Infographic Preview</h4>
                <p className="text-xs text-slate-500">High-resolution card ready for sharing</p>
              </div>
              <a
                href={reportService.getDownloadUrl(latestReport.id)}
                download={`financial_report_${latestReport.period}.png`}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PNG</span>
              </a>
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center p-3">
              <img
                src={reportService.getDownloadUrl(latestReport.id)}
                alt="Rendered Report"
                className="max-w-full h-auto rounded-lg shadow-md border border-slate-200"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
