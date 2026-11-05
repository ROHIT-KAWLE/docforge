import React, { useState } from 'react';
import { Lock, KeyRound, AlertCircle, ShieldCheck } from 'lucide-react';
import { api, setAuthToken } from '../../services/api';

interface UnlockModalProps {
  setupRequired: boolean;
  onUnlocked: () => void;
}

export const UnlockModal: React.FC<UnlockModalProps> = ({ setupRequired, onUnlocked }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (setupRequired) {
        if (password.length < 4) {
          throw new Error('Password must be at least 4 characters.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        const res = await api.setupPassword(password);
        setAuthToken(res.token, remember);
        onUnlocked();
      } else {
        const res = await api.unlock(password, remember);
        setAuthToken(res.token, remember);
        onUnlocked();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 text-center animate-scale-up">
        {/* Logo / Lock icon */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-5">
          {setupRequired ? <KeyRound className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
        </div>

        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-1">
          DOCFORGE
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          {setupRequired
            ? 'Initialize master password for your private document toolbox'
            : 'Your private document toolbox'}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={setupRequired ? 'Create Master Password' : 'Enter Password'}
              autoFocus
              className="w-full px-4 py-3 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-mono"
            />
          </div>

          {setupRequired && (
            <div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Master Password"
                className="w-full px-4 py-3 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-mono"
              />
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <input
              type="checkbox"
              id="remember"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-600"
            />
            <label htmlFor="remember" className="cursor-pointer select-none">
              Remember this device
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white font-semibold text-sm shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : setupRequired ? (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Set Password & Unlock</span>
              </>
            ) : (
              <span>Unlock</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400">
          <span>Self-hosted & privacy-first. No external tracking.</span>
        </div>
      </div>
    </div>
  );
};
