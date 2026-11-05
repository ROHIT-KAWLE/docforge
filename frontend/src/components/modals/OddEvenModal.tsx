import React from 'react';
import { X, ArrowUpDown, Download, CheckSquare, Trash2, Archive, FileText, RefreshCw } from 'lucide-react';

interface OddEvenModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalPages: number;
  onDownloadOdd: () => void;
  onDownloadEven: () => void;
  onDownloadBothZip: () => void;
  onSelectOdd: () => void;
  onSelectEven: () => void;
  onDeleteOdd: () => void;
  onDeleteEven: () => void;
  onReverseEven?: () => void;
}

export const OddEvenModal: React.FC<OddEvenModalProps> = ({
  isOpen,
  onClose,
  totalPages,
  onDownloadOdd,
  onDownloadEven,
  onDownloadBothZip,
  onSelectOdd,
  onSelectEven,
  onDeleteOdd,
  onDeleteEven,
  onReverseEven,
}) => {
  if (!isOpen) return null;

  const oddCount = Math.ceil(totalPages / 2);
  const evenCount = Math.floor(totalPages / 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <ArrowUpDown className="w-5 h-5 text-teal-500" />
            <span>Odd & Even Pages Tool</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Page Summary Cards */}
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-3.5 bg-teal-500/10 border border-teal-500/20 rounded-2xl">
            <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider block">
              Odd Pages
            </span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {oddCount} <span className="text-xs font-normal text-slate-500">pages</span>
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1">
              #1, #3, #5, #7...
            </p>
          </div>

          <div className="p-3.5 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
            <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider block">
              Even Pages
            </span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {evenCount} <span className="text-xs font-normal text-slate-500">pages</span>
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1">
              #2, #4, #6, #8...
            </p>
          </div>
        </div>

        {/* Section 1: One-Click Downloads */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            One-Click Downloads
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {/* Download Odd */}
            <button
              type="button"
              onClick={() => {
                onDownloadOdd();
                onClose();
              }}
              disabled={oddCount === 0}
              className="p-3 rounded-2xl border border-teal-500/30 bg-teal-500/5 hover:bg-teal-500/15 active:scale-95 text-slate-800 dark:text-slate-200 font-semibold transition-all flex flex-col items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <Download className="w-4 h-4 text-teal-500" />
              <span>Odd Pages PDF</span>
              <span className="text-[10px] text-slate-400 font-normal">({oddCount} pages)</span>
            </button>

            {/* Download Even */}
            <button
              type="button"
              onClick={() => {
                onDownloadEven();
                onClose();
              }}
              disabled={evenCount === 0}
              className="p-3 rounded-2xl border border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/15 active:scale-95 text-slate-800 dark:text-slate-200 font-semibold transition-all flex flex-col items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <Download className="w-4 h-4 text-purple-500" />
              <span>Even Pages PDF</span>
              <span className="text-[10px] text-slate-400 font-normal">({evenCount} pages)</span>
            </button>

            {/* Download Both ZIP */}
            <button
              type="button"
              onClick={() => {
                onDownloadBothZip();
                onClose();
              }}
              disabled={totalPages < 2}
              className="p-3 rounded-2xl border border-brand-500/30 bg-brand-500/10 hover:bg-brand-500/20 active:scale-95 text-slate-800 dark:text-slate-200 font-semibold transition-all flex flex-col items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <Archive className="w-4 h-4 text-brand-500" />
              <span>Both (ZIP)</span>
              <span className="text-[10px] text-slate-400 font-normal">(Odd + Even)</span>
            </button>
          </div>
        </div>

        {/* Section 2: Workspace Actions */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Workspace Actions
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                onSelectOdd();
                onClose();
              }}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5 text-teal-500" />
              <span>Select Odd Pages</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectEven();
                onClose();
              }}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5 text-purple-500" />
              <span>Select Even Pages</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onDeleteEven();
                onClose();
              }}
              disabled={evenCount === 0}
              className="p-2.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-600 dark:text-red-400 font-medium flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Even (Keep Odd)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onDeleteOdd();
                onClose();
              }}
              disabled={oddCount === 0}
              className="p-2.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-600 dark:text-red-400 font-medium flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Odd (Keep Even)</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
