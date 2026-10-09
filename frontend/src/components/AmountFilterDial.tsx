import React, { useState } from 'react';
import { Sliders, RotateCcw, Filter } from 'lucide-react';
import { CURRENCY_SYMBOLS } from '../utils/formatters';

interface AmountFilterDialProps {
  minAmount: number;
  maxAmount: number;
  onFilterChange: (min: number, max: number) => void;
  currency?: string;
}

const DIAL_STOPS = [
  { label: 'All', min: 0, max: Infinity },
  { label: '< $25', min: 0, max: 25 },
  { label: '$25 - $100', min: 25, max: 100 },
  { label: '$100 - $250', min: 100, max: 250 },
  { label: '$250 - $500', min: 250, max: 500 },
  { label: '> $500', min: 500, max: Infinity },
];

export const AmountFilterDial: React.FC<AmountFilterDialProps> = ({
  minAmount,
  maxAmount,
  onFilterChange,
  currency = 'USD',
}) => {
  const [activeStop, setActiveStop] = useState<number>(0);
  const currencySymbol = CURRENCY_SYMBOLS[currency.toUpperCase()] || '$';

  const handleSelectStop = (idx: number) => {
    setActiveStop(idx);
    const stop = DIAL_STOPS[idx];
    onFilterChange(stop.min, stop.max);
  };

  const handleReset = () => {
    setActiveStop(0);
    onFilterChange(0, Infinity);
  };

  // Rotation angle for the visual dial pointer (-75 deg to +75 deg)
  const dialRotation = -75 + (activeStop / (DIAL_STOPS.length - 1)) * 150;

  return (
    <div
      className="p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-center gap-4"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-main)',
      }}
    >
      {/* Physical Rotary Knob Graphic */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="relative w-14 h-14 flex items-center justify-center">
          {/* Circular Track */}
          <div
            className="w-14 h-14 rounded-full border-2 border-dashed flex items-center justify-center"
            style={{
              borderColor: 'var(--border-active)',
              backgroundColor: 'var(--bg-base)',
            }}
          >
            {/* Rotating Core Knob */}
            <div
              className="w-10 h-10 rounded-full border shadow-md flex items-center justify-center transition-transform duration-300 relative cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-hover)',
                borderColor: 'var(--accent-cyan)',
                transform: `rotate(${dialRotation}deg)`,
              }}
              onClick={() => handleSelectStop((activeStop + 1) % DIAL_STOPS.length)}
              title="Click to advance dial"
            >
              {/* Dial Notch Indicator */}
              <div
                className="absolute top-1 w-1.5 h-2 rounded-full"
                style={{ backgroundColor: 'var(--accent-magenta)' }}
              />
              <Sliders className="w-3.5 h-3.5 opacity-60" style={{ color: 'var(--text-muted)' }} />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" style={{ color: 'var(--accent-cyan)' }} />
            <span className="text-xs font-bold uppercase tracking-wider font-mono" style={{ color: 'var(--text-primary)' }}>
              Amount Range Dial
            </span>
          </div>
          <div className="text-[11px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Active: <span style={{ color: 'var(--accent-yellow)', fontWeight: 'bold' }}>{DIAL_STOPS[activeStop].label.replace('$', currencySymbol)}</span>
          </div>
        </div>
      </div>

      {/* Preset Dial Stop Chips */}
      <div className="flex items-center gap-1.5 flex-wrap flex-1 justify-start sm:justify-end">
        {DIAL_STOPS.map((stop, idx) => {
          const active = activeStop === idx;
          return (
            <button
              key={stop.label}
              type="button"
              onClick={() => handleSelectStop(idx)}
              className={`px-2.5 py-1 rounded-xl text-xs font-mono font-semibold transition-all border ${
                active ? 'scale-105 shadow-sm' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: active ? 'var(--bg-card-subtle)' : 'var(--bg-base)',
                borderColor: active ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                color: active ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              }}
            >
              {stop.label.replace('$', currencySymbol)}
            </button>
          );
        })}

        {activeStop !== 0 && (
          <button
            type="button"
            onClick={handleReset}
            title="Reset Dial"
            className="p-1 rounded-xl border transition-colors ml-1"
            style={{
              backgroundColor: 'var(--bg-hover)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-muted)',
            }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
