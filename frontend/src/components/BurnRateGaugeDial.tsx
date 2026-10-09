import React from 'react';
import { Gauge, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { SpendingSummary, MonthlyComparison } from '../types';
import { formatCurrency } from '../utils/formatters';

interface BurnRateGaugeDialProps {
  summary?: SpendingSummary;
  comparison?: MonthlyComparison | null;
  periodLabel?: string;
}

export const BurnRateGaugeDial: React.FC<BurnRateGaugeDialProps> = ({
  summary,
  comparison,
  periodLabel = 'This Month',
}) => {
  const currency = summary?.currency || 'USD';
  const total = summary?.total_amount || 0;
  const count = summary?.transaction_count || 0;
  const avg = summary?.average_amount || 0;

  // Compute burn rate velocity index (0 to 100)
  // If comparison exists, compare current to last month; otherwise normalize by average
  let burnVelocity = 50; // Neutral default
  let changePct = 0;
  let isFaster = false;

  if (comparison && comparison.previous_month_total > 0) {
    changePct = comparison.percentage_change;
    isFaster = changePct > 0;
    // Map -50% to +50% change to a 10 to 90 scale
    burnVelocity = Math.max(10, Math.min(95, 50 + changePct));
  } else if (total > 0) {
    burnVelocity = Math.min(85, Math.max(20, Math.round((total / (avg * 30 || 1)) * 50)));
  }

  // Calculate SVG arc and needle rotation angle
  // Gauge range: -110 deg to +110 deg (total 220 deg)
  const angle = -110 + (burnVelocity / 100) * 220;

  // Arc color based on velocity
  let needleColor = 'var(--accent-green)';
  if (burnVelocity > 70) needleColor = 'var(--accent-magenta)';
  else if (burnVelocity > 45) needleColor = 'var(--accent-yellow)';
  else needleColor = 'var(--accent-cyan)';

  return (
    <div
      className="p-5 sm:p-6 rounded-3xl border transition-all relative overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-main)',
      }}
    >
      {/* Top Label */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center font-mono"
            style={{
              backgroundColor: 'var(--bg-hover)',
              color: 'var(--accent-cyan)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <Gauge className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Spend Velocity Dial
            </h4>
            <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
              Burn rate telemetry • {periodLabel}
            </p>
          </div>
        </div>

        <span
          className="text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1"
          style={{
            backgroundColor: 'var(--bg-base)',
            borderColor: 'var(--border-subtle)',
            color: needleColor,
          }}
        >
          <Activity className="w-2.5 h-2.5 animate-pulse" />
          {burnVelocity > 65 ? 'High Pace' : burnVelocity < 35 ? 'Conservative' : 'Nominal Pace'}
        </span>
      </div>

      {/* Speedometer Radial Gauge */}
      <div className="relative flex flex-col items-center justify-center pt-2 pb-1">
        <svg viewBox="0 0 200 120" className="w-48 sm:w-56 h-auto overflow-visible">
          <defs>
            <linearGradient id="gaugeArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--accent-green)" />
              <stop offset="50%" stopColor="var(--accent-yellow)" />
              <stop offset="85%" stopColor="var(--accent-magenta)" />
            </linearGradient>
            <filter id="needleGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Track Background Arc */}
          <path
            d="M 25 105 A 75 75 0 1 1 175 105"
            fill="none"
            stroke="var(--gauge-track)"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Value Arc (Graduated) */}
          <path
            d="M 25 105 A 75 75 0 1 1 175 105"
            fill="none"
            stroke="url(#gaugeArcGrad)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray="235"
            strokeDashoffset={235 - (235 * burnVelocity) / 100}
            className="transition-all duration-700 ease-out"
          />

          {/* Dial Tick Marks */}
          {[0, 25, 50, 75, 100].map((t) => {
            const tickAngle = -110 + (t / 100) * 220;
            const rad = (tickAngle * Math.PI) / 180;
            const x1 = 100 + Math.cos(rad) * 62;
            const y1 = 105 + Math.sin(rad) * 62;
            const x2 = 100 + Math.cos(rad) * 69;
            const y2 = 105 + Math.sin(rad) * 69;
            return (
              <line
                key={t}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--border-active)"
                strokeWidth="2"
              />
            );
          })}

          {/* Rotating Needle */}
          <g
            transform={`rotate(${angle}, 100, 105)`}
            className="transition-transform duration-700 ease-out"
            filter="url(#needleGlow)"
          >
            <line
              x1="100"
              y1="105"
              x2="100"
              y2="34"
              stroke={needleColor}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <circle cx="100" cy="105" r="7" fill={needleColor} />
            <circle cx="100" cy="105" r="3" fill="var(--bg-card)" />
          </g>
        </svg>

        {/* Center Telemetry Readout */}
        <div className="text-center -mt-6">
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono" style={{ color: 'var(--text-primary)' }}>
            {formatCurrency(total, currency)}
          </div>
          <div className="text-[11px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {count} events • Avg {formatCurrency(avg, currency)}
          </div>
        </div>
      </div>

      {/* Comparison Velocity Footer */}
      <div
        className="mt-4 pt-3 flex items-center justify-between border-t text-xs"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <span style={{ color: 'var(--text-muted)' }}>Trajectory Delta</span>
        {comparison ? (
          <span
            className="font-mono font-bold flex items-center gap-1 text-xs"
            style={{ color: isFaster ? 'var(--accent-magenta)' : 'var(--accent-green)' }}
          >
            {isFaster ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            {changePct >= 0 ? `+${changePct.toFixed(1)}%` : `${changePct.toFixed(1)}%`} vs prior
          </span>
        ) : (
          <span className="font-mono text-[11px]" style={{ color: 'var(--accent-cyan)' }}>
            Calibrated baseline
          </span>
        )}
      </div>
    </div>
  );
};
