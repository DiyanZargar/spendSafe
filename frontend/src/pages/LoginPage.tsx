import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  Zap,
  Bot,
  Radio,
  Activity,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { authService } from '../services/auth';
import { ThemeToggle } from '../components/ThemeToggle';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onNavigateToRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onNavigateToRegister,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoLoaded, setDemoLoaded] = useState(false);

  // Simulated live event feed for telemetry display
  const [liveIndex, setLiveIndex] = useState(0);
  const telemetryLogs = [
    { time: '12:44:02', msg: 'Agent recorded $45.00 via Telegram', tag: 'BOT_SYNC' },
    { time: '12:43:18', msg: 'Monthly spend curve: -47.8% velocity', tag: 'ANALYTICS' },
    { time: '12:41:50', msg: 'Fernet AES key rotated for isolated tenant', tag: 'SECURITY' },
    { time: '12:39:12', msg: 'Decimal-precision ledger checksum: OK', tag: 'AUDIT' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveIndex((prev) => (prev + 1) % telemetryLogs.length);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide both tenant email and passphrase key.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await authService.login({ email: email.trim(), password });
      onLoginSuccess();
    } catch (err: any) {
      const msg = typeof err?.message === 'object' ? JSON.stringify(err.message) : err?.message;
      setError(msg || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLaunchDemo = async () => {
    setEmail('demo@example.com');
    setPassword('DemoPassword123!');
    setDemoLoaded(true);
    setIsLoading(true);
    setError('');

    try {
      await authService.login({
        email: 'demo@example.com',
        password: 'DemoPassword123!',
      });
      onLoginSuccess();
    } catch (err: any) {
      setError('Failed to auto-authenticate demo. Please click submit below.');
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden flex flex-col justify-between relative transition-colors duration-200 font-mono"
      style={{
        backgroundColor: 'var(--bg-base)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
          style={{
            backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
        <div
          className="absolute -top-32 -left-32 w-80 h-80 rounded-full blur-[130px] opacity-20"
          style={{ backgroundColor: 'var(--accent-magenta)' }}
        />
        <div
          className="absolute top-1/4 -right-32 w-96 h-96 rounded-full blur-[140px] opacity-15"
          style={{ backgroundColor: 'var(--accent-cyan)' }}
        />
      </div>

      {/* Top Header */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-5 sm:px-8 py-3 sm:py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shadow-md"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--accent-primary-fg)',
              boxShadow: '0 4px 14px var(--accent-primary-glow)',
            }}
          >
            <Terminal className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight">
                EXPENSE<span style={{ color: 'var(--accent-magenta)' }}>//</span>COCKPIT
              </span>
            </div>
            <p className="text-[10px] hidden sm:block" style={{ color: 'var(--text-muted)' }}>
              Autonomous Financial Telemetry & Agentic Mesh
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full border text-[10px]"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-muted)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Telemetry Engine Active</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content Area: Fits Viewport Without Vertical Scrolling */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 py-2 sm:py-4 flex-1 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          {/* Left Column: Visual Telemetry Overview */}
          <div className="lg:col-span-7 space-y-4">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
                Financial telemetry, <br />
                <span
                  className="bg-clip-text text-transparent bg-gradient-to-r"
                  style={{
                    backgroundImage:
                      'linear-gradient(135deg, var(--accent-cyan), var(--accent-magenta), var(--accent-yellow))',
                  }}
                >
                  zero friction.
                </span>
              </h1>
              <p className="text-xs sm:text-sm leading-relaxed max-w-lg" style={{ color: 'var(--text-muted)' }}>
                Track and audit your capital across WhatsApp, Telegram, or desktop dialpad—orchestrated by an embedded autonomous financial agent.
              </p>
            </div>

            {/* Live Telemetry Node Card */}
            <div
              className="p-4 rounded-2xl border shadow-lg relative overflow-hidden backdrop-blur-md"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--bg-card-elevated) 88%, transparent)',
                borderColor: 'var(--border-main)',
              }}
            >
              <div className="flex items-center justify-between pb-2.5 border-b text-xs font-bold" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="tracking-wider uppercase text-[11px]">Live Telemetry Node</span>
                </div>
                <div className="flex items-center gap-1.5 text-[9px]" style={{ color: 'var(--text-muted)' }}>
                  <Radio className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
                  <span>STREAMING (12ms)</span>
                </div>
              </div>

              {/* Metrics Ribbon */}
              <div className="grid grid-cols-3 gap-2.5 my-3">
                <div
                  className="p-2.5 rounded-xl border text-center sm:text-left"
                  style={{
                    backgroundColor: 'var(--bg-base)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <span className="text-[9px] block uppercase font-bold" style={{ color: 'var(--text-muted)' }}>
                    Current Velocity
                  </span>
                  <span className="text-sm sm:text-base font-extrabold" style={{ color: 'var(--accent-green)' }}>
                    $160.50
                  </span>
                </div>

                <div
                  className="p-2.5 rounded-xl border text-center sm:text-left"
                  style={{
                    backgroundColor: 'var(--bg-base)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <span className="text-[9px] block uppercase font-bold" style={{ color: 'var(--text-muted)' }}>
                    Agent Accuracy
                  </span>
                  <span className="text-sm sm:text-base font-extrabold" style={{ color: 'var(--accent-cyan)' }}>
                    99.8%
                  </span>
                </div>

                <div
                  className="p-2.5 rounded-xl border text-center sm:text-left"
                  style={{
                    backgroundColor: 'var(--bg-base)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <span className="text-[9px] block uppercase font-bold" style={{ color: 'var(--text-muted)' }}>
                    Precision
                  </span>
                  <span className="text-sm sm:text-base font-extrabold" style={{ color: 'var(--accent-yellow)' }}>
                    12, 2 Dec
                  </span>
                </div>
              </div>

              {/* Live Ticker */}
              <div
                className="px-3 py-1.5 rounded-xl border flex items-center justify-between text-xs"
                style={{
                  backgroundColor: 'var(--bg-hover)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="flex items-center gap-2 overflow-hidden truncate">
                  <span
                    className="text-[9px] px-1.5 py-0.2 rounded font-bold"
                    style={{
                      backgroundColor: 'var(--bg-base)',
                      color: 'var(--accent-magenta)',
                    }}
                  >
                    {telemetryLogs[liveIndex].tag}
                  </span>
                  <span className="truncate text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                    {telemetryLogs[liveIndex].msg}
                  </span>
                </div>
                <span className="text-[9px] shrink-0 font-mono" style={{ color: 'var(--text-muted)' }}>
                  {telemetryLogs[liveIndex].time}
                </span>
              </div>
            </div>

            {/* Feature Pills */}
            <div className="grid grid-cols-2 gap-2.5">
              <div
                className="p-2.5 rounded-xl border flex items-center gap-2.5"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div
                  className="p-1.5 rounded-lg shrink-0"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--accent-yellow) 15%, transparent)',
                    color: 'var(--accent-yellow)',
                  }}
                >
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>
                    Tactile Dial (⌘D)
                  </h4>
                  <p className="text-[10px] leading-tight" style={{ color: 'var(--text-muted)' }}>
                    Corner keypad entry
                  </p>
                </div>
              </div>

              <div
                className="p-2.5 rounded-xl border flex items-center gap-2.5"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div
                  className="p-1.5 rounded-lg shrink-0"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--accent-purple) 15%, transparent)',
                    color: 'var(--accent-purple)',
                  }}
                >
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>
                    Autonomous Co-Pilot
                  </h4>
                  <p className="text-[10px] leading-tight" style={{ color: 'var(--text-muted)' }}>
                    Contextual agent tools
                  </p>
                </div>
              </div>

              <div
                className="p-2.5 rounded-xl border flex items-center gap-2.5"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div
                  className="p-1.5 rounded-lg shrink-0"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--accent-green) 15%, transparent)',
                    color: 'var(--accent-green)',
                  }}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>
                    AES-Fernet Security
                  </h4>
                  <p className="text-[10px] leading-tight" style={{ color: 'var(--text-muted)' }}>
                    Tokens encrypted at rest
                  </p>
                </div>
              </div>

              <div
                className="p-2.5 rounded-xl border flex items-center gap-2.5"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div
                  className="p-1.5 rounded-lg shrink-0"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--accent-cyan) 15%, transparent)',
                    color: 'var(--accent-cyan)',
                  }}
                >
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>
                    Omnichannel Mesh
                  </h4>
                  <p className="text-[10px] leading-tight" style={{ color: 'var(--text-muted)' }}>
                    Telegram, WhatsApp, Slack
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Authentication Terminal */}
          <div className="lg:col-span-5">
            <div
              className="p-5 sm:p-6 rounded-3xl border shadow-xl relative backdrop-blur-xl"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--bg-card-elevated) 95%, transparent)',
                borderColor: 'var(--border-main)',
                boxShadow:
                  '0 20px 45px -12px rgba(0, 0, 0, 0.4), 0 0 25px var(--accent-primary-glow)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                    AUTHENTICATION GATEWAY
                  </span>
                </div>
                <span className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>
                  PORT :8000
                </span>
              </div>

              <div className="mb-4">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Initialize Session
                </h2>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Sign in to your isolated workstation or launch the live sandbox.
                </p>
              </div>

              {/* 1-Click Interactive Demo Button */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={handleLaunchDemo}
                  disabled={isLoading}
                  className="w-full text-left p-3 rounded-2xl border transition-all duration-200 group relative overflow-hidden hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--accent-cyan) 8%, var(--bg-card))',
                    borderColor: 'var(--accent-cyan)',
                    boxShadow: '0 2px 12px rgba(102, 217, 239, 0.1)',
                  }}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 font-bold text-xs" style={{ color: 'var(--accent-cyan)' }}>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>1-Click Launch Demo Workstation</span>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" style={{ color: 'var(--accent-cyan)' }} />
                  </div>
                  <p className="text-[10px] leading-tight" style={{ color: 'var(--text-muted)' }}>
                    Instant login as <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>demo@example.com</span> with pre-seeded data.
                  </p>
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-subtle)' }} />
                <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>
                  Or Tenant Sign-In
                </span>
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-subtle)' }} />
              </div>

              {/* Error Alert */}
              {error && (
                <div
                  className="mb-3 p-2.5 rounded-xl border text-xs font-semibold animate-fadeIn"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--accent-magenta) 12%, transparent)',
                    borderColor: 'var(--accent-magenta)',
                    color: 'var(--accent-magenta)',
                  }}
                >
                  {error}
                </div>
              )}

              {/* Auth Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Tenant Email
                    </label>
                    {demoLoaded && (
                      <span className="text-[9px] text-emerald-400 font-bold">✓ Preloaded</span>
                    )}
                  </div>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-3" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="email"
                      required
                      placeholder="tenant@domain.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setDemoLoaded(false);
                      }}
                      className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border focus:outline-none transition-all font-mono"
                      style={{
                        backgroundColor: 'var(--bg-input)',
                        borderColor: 'var(--border-main)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                    Passphrase Key
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-3 top-3" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-9 py-2 rounded-xl text-xs border focus:outline-none transition-all font-mono"
                      style={{
                        backgroundColor: 'var(--bg-input)',
                        borderColor: 'var(--border-main)',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 p-0.5 rounded transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      title={showPassword ? 'Hide passphrase' : 'Show passphrase'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 shadow-md cursor-pointer mt-1"
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: 'var(--accent-primary-fg)',
                    boxShadow: '0 4px 14px var(--accent-primary-glow)',
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Authenticate Session</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Bottom Register */}
              <div
                className="mt-4 pt-3 border-t flex items-center justify-between text-xs"
                style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
              >
                <span>Need a new tenant?</span>
                <button
                  type="button"
                  onClick={onNavigateToRegister}
                  className="font-bold flex items-center gap-1 transition-colors cursor-pointer hover:underline text-[11px]"
                  style={{ color: 'var(--accent-magenta)' }}
                >
                  <span>Provision Tenant</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-1 text-[10px] shrink-0" style={{ color: 'var(--text-muted)' }}>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          <span>Zero-Knowledge AES-Fernet Encryption • Strict Tenant Isolation</span>
        </div>
        <div className="flex items-center gap-3 font-mono">
          <span>PostgreSQL 16 + pgvector</span>
          <span>•</span>
          <span>FastAPI</span>
          <span>•</span>
          <span>Agno AI</span>
        </div>
      </footer>
    </div>
  );
};
