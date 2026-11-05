import React, { useState } from 'react';
import { X, Split, FileCheck, Layers } from 'lucide-react';

interface SplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalPages: number;
  selectedPages: number[];
  onConfirmSplit: (mode: string, nPages: number, ranges: string) => void;
}

export const SplitModal: React.FC<SplitModalProps> = ({
  isOpen,
  onClose,
  totalPages,
  selectedPages,
  onConfirmSplit,
}) => {
  const [mode, setMode] = useState<string>(selectedPages.length > 0 ? 'selected' : 'every_page');
  const [nPages, setNPages] = useState<number>(2);
  const [ranges, setRanges] = useState<string>(totalPages > 2 ? `1-${Math.ceil(totalPages / 2)}, ${Math.ceil(totalPages / 2) + 1}-${totalPages}` : '1-2');

  if (!isOpen) return null;

  // Calculate resulting files preview
  const getPreviewFiles = (): string[] => {
    if (totalPages === 0) return [];
    if (mode === 'every_page') {
      return Array.from({ length: totalPages }, (_, i) => `Page ${i + 1}.pdf`);
    } else if (mode === 'every_n') {
      const step = Math.max(1, nPages);
      const list: string[] = [];
      for (let i = 0; i < totalPages; i += step) {
        const start = i + 1;
        const end = Math.min(i + step, totalPages);
        list.push(`Pages ${start}-${end}.pdf`);
      }
      return list;
    } else if (mode === 'ranges') {
      const parts = ranges.split(',').map((p) => p.trim()).filter(Boolean);
      return parts.map((p) => `Range (${p}).pdf`);
    } else if (mode === 'selected') {
      return [`Selected (${selectedPages.length} pages).pdf`];
    }
    return [];
  };

  const preview = getPreviewFiles();

  const handleQuickPreset = (presetMode: string, num?: number) => {
    setMode(presetMode);
    if (num) setNPages(num);
    if (presetMode === 'half') {
      setMode('ranges');
      const mid = Math.ceil(totalPages / 2);
      setRanges(`1-${mid}, ${mid + 1}-${totalPages}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <Split className="w-5 h-5 text-brand-500" />
            <span>Split Document ({totalPages} pages)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Click Split Preset Tiles */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Split Method
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setMode('every_page')}
              className={`p-3 rounded-2xl border text-left font-semibold transition-all cursor-pointer ${
                mode === 'every_page'
                  ? 'border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500/30'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              Every Page (1 page each)
            </button>

            <button
              type="button"
              onClick={() => handleQuickPreset('half')}
              className={`p-3 rounded-2xl border text-left font-semibold transition-all cursor-pointer ${
                mode === 'ranges' && ranges.includes(',')
                  ? 'border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500/30'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              Split in Half (2 files)
            </button>

            <button
              type="button"
              onClick={() => setMode('every_n')}
              className={`p-3 rounded-2xl border text-left font-semibold transition-all cursor-pointer ${
                mode === 'every_n'
                  ? 'border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500/30'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              Every N Pages
            </button>

            <button
              type="button"
              onClick={() => setMode('selected')}
              disabled={selectedPages.length === 0}
              className={`p-3 rounded-2xl border text-left font-semibold transition-all cursor-pointer ${
                mode === 'selected'
                  ? 'border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500/30'
                  : selectedPages.length === 0
                  ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              Selected ({selectedPages.length}p)
            </button>
          </div>
        </div>

        {/* Dynamic Controls based on method */}
        {mode === 'every_n' && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Pages per document:</span>
            <div className="flex items-center gap-2">
              {[2, 3, 5, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNPages(n)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                    nPages === n
                      ? 'bg-brand-500 text-white'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {n}
                </button>
              ))}
              <input
                type="number"
                min={1}
                max={totalPages}
                value={nPages}
                onChange={(e) => setNPages(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-14 px-2 py-1 text-center bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-mono font-bold"
              />
            </div>
          </div>
        )}

        {mode === 'ranges' && (
          <div className="space-y-1.5 text-xs">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Page Ranges (comma separated)</label>
            <input
              type="text"
              value={ranges}
              onChange={(e) => setRanges(e.target.value)}
              placeholder="e.g. 1-3, 4-6, 7-10"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        )}

        {/* Live Result Preview */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            <span>Result Preview</span>
            <span className="font-mono text-brand-600 dark:text-brand-400 font-bold">
              {preview.length} {preview.length === 1 ? 'file' : 'files'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto no-scrollbar">
            {preview.slice(0, 12).map((name, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-mono text-slate-700 dark:text-slate-300 truncate max-w-[140px]"
              >
                {name}
              </span>
            ))}
            {preview.length > 12 && (
              <span className="px-2 py-0.5 text-[10px] font-mono text-slate-400">
                +{preview.length - 12} more
              </span>
            )}
          </div>
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
              onConfirmSplit(mode, nPages, ranges);
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-bold text-xs shadow-md shadow-brand-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Split className="w-3.5 h-3.5" />
            <span>Split & Download</span>
          </button>
        </div>
      </div>
    </div>
  );
};
