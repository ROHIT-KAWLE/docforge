import React, { useState } from 'react';
import { X, Minimize2, CheckCircle2, Zap } from 'lucide-react';

interface CompressModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileSizeBytes: number;
  onConfirmCompress: (level: string) => void;
}

export const CompressModal: React.FC<CompressModalProps> = ({
  isOpen,
  onClose,
  fileSizeBytes,
  onConfirmCompress,
}) => {
  const [level, setLevel] = useState('balanced');

  if (!isOpen) return null;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getEstimatedReduction = () => {
    switch (level) {
      case 'low': return { percent: 15, estimatedBytes: Math.round(fileSizeBytes * 0.85) };
      case 'balanced': return { percent: 40, estimatedBytes: Math.round(fileSizeBytes * 0.60) };
      case 'high': return { percent: 65, estimatedBytes: Math.round(fileSizeBytes * 0.35) };
      case 'maximum': return { percent: 80, estimatedBytes: Math.round(fileSizeBytes * 0.20) };
      default: return { percent: 40, estimatedBytes: Math.round(fileSizeBytes * 0.60) };
    }
  };

  const est = getEstimatedReduction();

  const presets = [
    {
      id: 'low',
      name: 'Low Compression',
      desc: 'Lossless streams & metadata cleanup. 100% full original image quality.',
      badge: '~15% reduction'
    },
    {
      id: 'balanced',
      name: 'Balanced (Recommended)',
      desc: 'Optimal balance of smaller file size while keeping crisp vector text and sharp graphics.',
      badge: '~40% reduction'
    },
    {
      id: 'high',
      name: 'High Compression',
      desc: 'Substantial file size decrease. Great for multi-page PDF documents & scans.',
      badge: '~65% reduction'
    },
    {
      id: 'maximum',
      name: 'Maximum Compression',
      desc: 'Aggressive image compression for email attachments and tight storage limits.',
      badge: '~80% reduction'
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <Minimize2 className="w-5 h-5 text-brand-500" />
            <span>Compress PDF File</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Size Comparison Card */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-center">
          <div>
            <span className="text-[11px] text-slate-400 font-medium">Original File</span>
            <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              {formatSize(fileSizeBytes)}
            </p>
          </div>
          <div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Estimated Output</span>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              ~{formatSize(est.estimatedBytes)} (-{est.percent}%)
            </p>
          </div>
        </div>

        {/* 1-Click Preset Selection */}
        <div className="space-y-2">
          {presets.map((opt) => (
            <div
              key={opt.id}
              onClick={() => setLevel(opt.id)}
              className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                level === opt.id
                  ? 'border-brand-500 bg-brand-500/10 text-brand-950 dark:text-brand-100 ring-1 ring-brand-500/30'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                  level === opt.id ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {level === opt.id && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white block">
                    {opt.name}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block mt-0.5">
                    {opt.desc}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                {opt.badge}
              </span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirmCompress(level);
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-bold text-xs shadow-md shadow-brand-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Compress & Download</span>
          </button>
        </div>
      </div>
    </div>
  );
};
