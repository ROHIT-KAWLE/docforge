import React, { useState } from 'react';
import { X, Stamp } from 'lucide-react';

interface WatermarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onApplyWatermark: (params: {
    text: string;
    fontSize: number;
    opacity: number;
    rotation: number;
    color: string;
    position: string;
    target: 'all' | 'selected';
  }) => void;
}

export const WatermarkModal: React.FC<WatermarkModalProps> = ({
  isOpen,
  onClose,
  selectedCount,
  onApplyWatermark,
}) => {
  const [text, setText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(36);
  const [opacity, setOpacity] = useState(0.35);
  const [rotation, setRotation] = useState(45);
  const [color, setColor] = useState('#e11d48');
  const [position, setPosition] = useState('center');
  const [target, setTarget] = useState<'all' | 'selected'>('all');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <Stamp className="w-5 h-5 text-brand-500" />
            <span>Add Watermark</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {/* Controls */}
          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Watermark Text</label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Font Size ({fontSize}px)</label>
                <input
                  type="range"
                  min="16"
                  max="72"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="mt-2 w-full"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Opacity ({Math.round(opacity * 100)}%)</label>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="mt-2 w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Rotation</label>
                <select
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value))}
                  className="mt-1 w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value={0}>Horizontal (0°)</option>
                  <option value={45}>Diagonal (45°)</option>
                  <option value={90}>Vertical (90°)</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Position</label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="mt-1 w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="center">Center</option>
                  <option value="top-left">Top Left</option>
                  <option value="bottom-right">Bottom Right</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Color</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-7 rounded border cursor-pointer"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Apply to</label>
              <div className="mt-1 flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="wm_target"
                    checked={target === 'all'}
                    onChange={() => setTarget('all')}
                  />
                  <span>All Pages</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="wm_target"
                    checked={target === 'selected'}
                    onChange={() => setTarget('selected')}
                    disabled={selectedCount === 0}
                  />
                  <span>Selected Pages ({selectedCount})</span>
                </label>
              </div>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-semibold text-slate-400 mb-2">Live Watermark Preview</span>
            <div className="relative w-36 h-48 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center">
              <div className="space-y-2 p-2 opacity-20 w-full">
                <div className="h-1.5 w-3/4 bg-slate-400 rounded" />
                <div className="h-1.5 w-full bg-slate-400 rounded" />
                <div className="h-1.5 w-5/6 bg-slate-400 rounded" />
                <div className="h-1.5 w-2/3 bg-slate-400 rounded" />
              </div>

              <div
                style={{
                  color,
                  opacity,
                  fontSize: `${Math.max(12, fontSize / 2.5)}px`,
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: 'center',
                }}
                className="absolute font-black tracking-wider text-center select-none pointer-events-none uppercase"
              >
                {text || 'PREVIEW'}
              </div>
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
            onClick={() => {
              onApplyWatermark({ text, fontSize, opacity, rotation, color, position, target });
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-md shadow-brand-500/20"
          >
            Apply Watermark
          </button>
        </div>
      </div>
    </div>
  );
};
