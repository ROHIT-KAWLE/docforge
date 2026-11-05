import React, { useState } from 'react';
import { X, Hash } from 'lucide-react';

interface PageNumbersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyNumbers: (params: {
    format: string;
    position: string;
    startNumber: number;
    skipFirst: boolean;
    fontSize: number;
  }) => void;
}

export const PageNumbersModal: React.FC<PageNumbersModalProps> = ({
  isOpen,
  onClose,
  onApplyNumbers,
}) => {
  const [format, setFormat] = useState('Page {n} of {total}');
  const [position, setPosition] = useState('bottom-center');
  const [startNumber, setStartNumber] = useState(1);
  const [skipFirst, setSkipFirst] = useState(false);
  const [fontSize, setFontSize] = useState(11);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <Hash className="w-5 h-5 text-brand-500" />
            <span>Add Page Numbers</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            >
              <option value="Page {n} of {total}">Page 1 of 10</option>
              <option value="{n}">1, 2, 3...</option>
              <option value="Page {n}">Page 1, Page 2...</option>
              <option value="0{n}">01, 02, 03...</option>
              <option value="{n}/{total}">1/10, 2/10...</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">Position</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {[
                { id: 'top-left', label: 'Top Left' },
                { id: 'top-center', label: 'Top Center' },
                { id: 'top-right', label: 'Top Right' },
                { id: 'bottom-left', label: 'Bottom Left' },
                { id: 'bottom-center', label: 'Bottom Center' },
                { id: 'bottom-right', label: 'Bottom Right' },
              ].map((pos) => (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => setPosition(pos.id)}
                  className={`p-2 rounded-xl border text-center font-medium transition-colors ${
                    position === pos.id
                      ? 'border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-300'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Start Number</label>
              <input
                type="number"
                min="1"
                value={startNumber}
                onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)}
                className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Font Size ({fontSize}pt)</label>
              <input
                type="number"
                min="8"
                max="24"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value) || 11)}
                className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="skipFirst"
              checked={skipFirst}
              onChange={(e) => setSkipFirst(e.target.checked)}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
            />
            <label htmlFor="skipFirst" className="cursor-pointer select-none text-slate-700 dark:text-slate-300">
              Skip page numbering on cover (first page)
            </label>
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
              onApplyNumbers({ format, position, startNumber, skipFirst, fontSize });
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-md shadow-brand-500/20"
          >
            Apply Page Numbers
          </button>
        </div>
      </div>
    </div>
  );
};
