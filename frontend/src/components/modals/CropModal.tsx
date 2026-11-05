import React, { useState } from 'react';
import { X, Crop, Check } from 'lucide-react';

interface CropModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onApplyCrop: (crop: { x0: number; y0: number; x1: number; y1: number }, applyTo: 'selected' | 'all') => void;
}

export const CropModal: React.FC<CropModalProps> = ({
  isOpen,
  onClose,
  selectedCount,
  onApplyCrop,
}) => {
  const [insetPercent, setInsetPercent] = useState(5);
  const [applyTo, setApplyTo] = useState<'selected' | 'all'>('selected');

  if (!isOpen) return null;

  const handleApply = () => {
    const fraction = insetPercent / 100.0;
    const crop = {
      x0: fraction,
      y0: fraction,
      x1: 1.0 - fraction,
      y1: 1.0 - fraction,
    };
    onApplyCrop(crop, applyTo);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <Crop className="w-5 h-5 text-brand-500" />
            <span>Crop Document Pages</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs">
          <div className="flex flex-col items-center justify-center p-4 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="relative w-36 h-48 bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-600 flex items-center justify-center">
              {/* Visual Crop Box */}
              <div
                style={{
                  inset: `${insetPercent}%`,
                }}
                className="absolute border-2 border-dashed border-brand-500 bg-brand-500/10 transition-all rounded-sm flex items-center justify-center text-[10px] text-brand-600 font-bold"
              >
                -{insetPercent}% Margin
              </div>
            </div>
            <span className="text-[11px] text-slate-400 mt-2">Interactive Margin Trimming</span>
          </div>

          <div>
            <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300">
              <label>Crop Margin Inset</label>
              <span>{insetPercent}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="25"
              value={insetPercent}
              onChange={(e) => setInsetPercent(parseInt(e.target.value))}
              className="mt-2 w-full"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300">Apply to</label>
            <div className="mt-1 flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="crop_target"
                  checked={applyTo === 'selected'}
                  onChange={() => setApplyTo('selected')}
                />
                <span>Selected Pages ({selectedCount})</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="crop_target"
                  checked={applyTo === 'all'}
                  onChange={() => setApplyTo('all')}
                />
                <span>All Pages in Workspace</span>
              </label>
            </div>
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
            onClick={handleApply}
            className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-md shadow-brand-500/20"
          >
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
};
