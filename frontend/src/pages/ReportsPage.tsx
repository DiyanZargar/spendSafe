import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { FileText, Download, Sparkles, Loader2, CheckCircle, Activity, Image } from 'lucide-react';
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
    <div className="space-y-6 max-w-5xl mx-auto font-mono">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Infographic Telemetry & Reports
            </h2>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full border"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--accent-cyan)',
              }}
            >
              PNG CARD ENGINE
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            High-fidelity visual card generator powered by serverless canvas
          </p>
        </div>
      </div>

      {/* Generator Control Card */}
      <div
        className="p-5 sm:p-6 rounded-3xl border transition-all space-y-4"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-main)',
        }}
      >
        <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <FileText className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />
          <span>Report Synthesis Controls</span>
        </h3>

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
              Template Schema
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
              <option value="monthly">Monthly High-Res Infographic</option>
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
                  <span>Rendering Infographic...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Synthesize Report</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Generated Report Output */}
      {latestReport && (
        <div className="space-y-6 animate-fadeIn">
          {/* Summary Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div
              className="p-4 rounded-3xl border"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-main)' }}
            >
              <div className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>Total Spend</div>
              <div className="text-xl font-black mt-1" style={{ color: 'var(--accent-yellow)' }}>
                {formatCurrency(summary?.total_amount || 0, currency)}
              </div>
            </div>

            <div
              className="p-4 rounded-3xl border"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-main)' }}
            >
              <div className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>Daily Pace</div>
              <div className="text-xl font-black mt-1" style={{ color: 'var(--accent-green)' }}>
                {formatCurrency(summary?.average_daily || 0, currency)}
              </div>
            </div>

            <div
              className="p-4 rounded-3xl border"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-main)' }}
            >
              <div className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>Event Count</div>
              <div className="text-xl font-black mt-1" style={{ color: 'var(--accent-cyan)' }}>
                {summary?.transaction_count || 0}
              </div>
            </div>

            <div
              className="p-4 rounded-3xl border"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-main)' }}
            >
              <div className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>Render State</div>
              <div className="text-xs font-bold mt-1.5 flex items-center gap-1.5" style={{ color: 'var(--accent-green)' }}>
                <CheckCircle className="w-4 h-4" />
                <span>Pixel Perfect Ready</span>
              </div>
            </div>
          </div>

          {/* Visual PNG Infographic Card Preview & Download */}
          <div
            className="p-5 sm:p-6 rounded-3xl border shadow-sm space-y-4"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-main)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                  Rendered Graphic Output
                </h4>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Server-side composited visual snapshot ({latestReport.period})
                </p>
              </div>
              <a
                href={reportService.getDownloadUrl(latestReport.id)}
                download={`financial_report_${latestReport.period}.png`}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all hover:scale-105 border"
                style={{
                  backgroundColor: 'var(--bg-hover)',
                  borderColor: 'var(--accent-cyan)',
                  color: 'var(--accent-cyan)',
                }}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PNG</span>
              </a>
            </div>

            <div
              className="rounded-2xl overflow-hidden border p-3 flex items-center justify-center"
              style={{
                backgroundColor: 'var(--bg-base)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <img
                src={reportService.getDownloadUrl(latestReport.id)}
                alt="Rendered Report"
                className="max-w-full h-auto rounded-xl shadow-md border"
                style={{ borderColor: 'var(--border-main)' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
