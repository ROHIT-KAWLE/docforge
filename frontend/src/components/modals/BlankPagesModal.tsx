import React, { useState } from 'react';
import { X, Search, Trash2, CheckSquare, Square } from 'lucide-react';

interface BlankPagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  blankPageNumbers: number[];
  onDeleteSelected: (pagesToDelete: number[]) => void;
}

export const BlankPagesModal: React.FC<BlankPagesModalProps> = ({
  isOpen,
  onClose,
  blankPageNumbers,
  onDeleteSelected,
}) => {
  const [selected, setSelected] = useState<Set<number>>(new Set(blankPageNumbers));

  if (!isOpen) return null;

  const togglePage = (p: number) => {
    const next = new Set(selected);
    if (next.has(p)) next.delete(p);
    else next.add(p);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === blankPageNumbers.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(blankPageNumbers));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <Search className="w-5 h-5 text-amber-500" />
            <span>Blank Page Detection</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-900 dark:text-amber-200">
            <p className="font-semibold text-sm">{blankPageNumbers.length} potentially blank pages detected.</p>
            <p className="mt-0.5 text-xs opacity-80">
              Review and select which pages you wish to remove. Pages are never deleted automatically.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={toggleAll}
              className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-semibold hover:text-brand-500"
            >
              {selected.size === blankPageNumbers.length ? <CheckSquare className="w-4 h-4 text-brand-500" /> : <Square className="w-4 h-4" />}
              <span>{selected.size === blankPageNumbers.length ? 'Deselect All' : 'Select All'}</span>
            </button>
            <span className="text-slate-400 font-mono">{selected.size} selected for removal</span>
          </div>

          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto no-scrollbar p-1">
            {blankPageNumbers.map((p) => (
              <div
                key={p}
                onClick={() => togglePage(p)}
                className={`p-3 rounded-xl border cursor-pointer text-center font-medium transition-all ${
                  selected.has(p)
                    ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="text-sm font-bold">Page {p}</div>
                <span className="text-[10px] opacity-75">{selected.has(p) ? 'Will Delete' : 'Keep'}</span>
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
              onDeleteSelected(Array.from(selected));
              onClose();
            }}
            disabled={selected.size === 0}
            className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-red-500/20 flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Selected ({selected.size})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
