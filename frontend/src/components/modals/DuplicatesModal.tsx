import React, { useState } from 'react';
import { X, ShieldAlert, Trash2, ArrowRightLeft } from 'lucide-react';

interface DuplicatePair {
  page_a: number;
  page_b: number;
}

interface DuplicatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  duplicates: DuplicatePair[];
  onDeletePages: (pages: number[]) => void;
}

export const DuplicatesModal: React.FC<DuplicatesModalProps> = ({
  isOpen,
  onClose,
  duplicates,
  onDeletePages,
}) => {
  const [pagesToDelete, setPagesToDelete] = useState<Set<number>>(new Set());

  if (!isOpen) return null;

  const togglePageToDelete = (p: number) => {
    const next = new Set(pagesToDelete);
    if (next.has(p)) next.delete(p);
    else next.add(p);
    setPagesToDelete(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <ShieldAlert className="w-5 h-5 text-orange-500" />
            <span>Duplicate Page Review</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs">
          <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-950 dark:text-orange-200">
            <p className="font-semibold text-sm">{duplicates.length} duplicate pair(s) detected.</p>
            <p className="mt-0.5 text-xs opacity-80">
              Select which duplicate pages to delete. The original duplicate remains untouched unless explicitly chosen.
            </p>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-2 no-scrollbar p-1">
            {duplicates.map((pair, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2">
                  <div
                    onClick={() => togglePageToDelete(pair.page_a)}
                    className={`px-3 py-2 rounded-lg border text-center font-bold cursor-pointer transition-colors ${
                      pagesToDelete.has(pair.page_a)
                        ? 'border-red-500 bg-red-500/10 text-red-600'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    Page {pair.page_a}
                    {pagesToDelete.has(pair.page_a) && <span className="block text-[10px] text-red-500">Delete</span>}
                  </div>

                  <ArrowRightLeft className="w-4 h-4 text-slate-400 shrink-0" />

                  <div
                    onClick={() => togglePageToDelete(pair.page_b)}
                    className={`px-3 py-2 rounded-lg border text-center font-bold cursor-pointer transition-colors ${
                      pagesToDelete.has(pair.page_b)
                        ? 'border-red-500 bg-red-500/10 text-red-600'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    Page {pair.page_b}
                    {pagesToDelete.has(pair.page_b) && <span className="block text-[10px] text-red-500">Delete</span>}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => togglePageToDelete(pair.page_b)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-red-500 hover:text-white transition-colors text-[11px] font-medium"
                >
                  {pagesToDelete.has(pair.page_b) ? 'Undo' : `Remove Page ${pair.page_b}`}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onDeletePages(Array.from(pagesToDelete));
              onClose();
            }}
            disabled={pagesToDelete.size === 0}
            className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-red-500/20 flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Selected Duplicates ({pagesToDelete.size})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
