import React from 'react';
import { ShieldCheck, Server, X, Undo2 } from 'lucide-react';
import { OperationNotice } from '../../types';

interface PrivacyBadgeProps {
  notice: OperationNotice | null;
  onDismiss: () => void;
  onUndo?: () => void;
}

export const PrivacyBadge: React.FC<PrivacyBadgeProps> = ({ notice, onDismiss, onUndo }) => {
  if (!notice) return null;

  const isLocal = notice.location === 'local';

  return (
    <div
      className={`fixed bottom-20 md:bottom-6 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-slide-up ${
        isLocal
          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-950 dark:text-emerald-100'
          : 'bg-brand-500/15 border-brand-500/30 text-brand-950 dark:text-brand-100'
      }`}
    >
      <div
        className={`p-2 rounded-xl shrink-0 ${
          isLocal
            ? 'bg-emerald-500/25 text-emerald-600 dark:text-emerald-400'
            : 'bg-brand-500/25 text-brand-600 dark:text-brand-400'
        }`}
      >
        {isLocal ? <ShieldCheck className="w-5 h-5" /> : <Server className="w-5 h-5" />}
      </div>
      <div className="text-xs sm:text-sm">
        <p className="font-bold">{isLocal ? 'Processed locally' : 'Private Server Processing'}</p>
        <p className="text-xs opacity-85">{notice.message}</p>
      </div>

      <div className="flex items-center gap-1.5 ml-2 shrink-0">
        {onUndo && notice.message.toLowerCase().includes('delete') && (
          <button
            type="button"
            onClick={onUndo}
            className="px-2.5 py-1 rounded-lg bg-white/60 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 font-bold text-xs flex items-center gap-1 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer shadow-xs"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>
        )}

        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Close notice"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
