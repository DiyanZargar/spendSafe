import React, { useState } from 'react';
import { Terminal, Lock, Mail, User, ArrowLeft, Loader2, DollarSign } from 'lucide-react';
import { authService } from '../services/auth';
import { ThemeToggle } from '../components/ThemeToggle';

interface RegisterPageProps {
  onRegisterSuccess: () => void;
  onNavigateToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onRegisterSuccess,
  onNavigateToLogin,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Passphrase must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await authService.register({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        currency,
      });
      // Auto-login after registration
      await authService.login({ email: email.trim(), password });
      onRegisterSuccess();
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 transition-colors font-mono relative"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      {/* Top Floating Theme Switcher */}
      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>

      <div
        className="w-full max-w-md p-8 rounded-3xl border shadow-2xl relative transition-all"
        style={{
          backgroundColor: 'var(--bg-card-elevated)',
          borderColor: 'var(--border-main)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 35px var(--accent-primary-glow)',
        }}
      >
        <div className="text-center mb-6">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--accent-primary-fg)',
              boxShadow: '0 4px 14px var(--accent-primary-glow)',
            }}
          >
            <Terminal className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Provision Tenant Node
          </h2>
          <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
            Encrypted Multi-Channel Expense Engine
          </p>
        </div>

        {error && (
          <div
            className="mb-4 p-3 rounded-2xl border text-xs font-semibold"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-magenta) 10%, transparent)',
              borderColor: 'var(--accent-magenta)',
              color: 'var(--accent-magenta)',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              Operator Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                required
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-2xl text-xs border focus:outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-main)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              Tenant Email *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3" style={{ color: 'var(--text-muted)' }} />
              <input
                type="email"
                required
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-2xl text-xs border focus:outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-main)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              Master Passphrase (min 6 chars) *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3" style={{ color: 'var(--text-muted)' }} />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-2xl text-xs border focus:outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-main)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              Primary Currency
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 absolute left-3 top-3" style={{ color: 'var(--accent-yellow)' }} />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-2xl text-xs border focus:outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-main)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD (CA$)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold transition-all hover:scale-102 active:scale-98 disabled:opacity-50 shadow-lg"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--accent-primary-fg)',
              boxShadow: '0 4px 14px var(--accent-primary-glow)',
            }}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Initialize Tenant</span>}
          </button>
        </form>

        <div
          className="mt-6 pt-4 border-t flex items-center justify-between text-xs"
          style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
        >
          <button
            onClick={onNavigateToLogin}
            className="flex items-center gap-1 font-bold transition-colors hover:scale-105"
            style={{ color: 'var(--accent-cyan)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Existing Tenant Login</span>
          </button>
        </div>
      </div>
    </div>
  );
};
