import React from 'react';
import { RotateCw, RotateCcw, Trash2, Copy, Check, GripVertical } from 'lucide-react';
import { PageModel } from '../../types';

interface PageCardProps {
  page: PageModel;
  index: number;
  onToggleSelect: (id: string, shiftKey: boolean) => void;
  onRotateCW: (id: string) => void;
  onRotateCCW: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDragStart?: (e: React.DragEvent, index: number) => void;
  onDragOver?: (e: React.DragEvent, index: number) => void;
  onDrop?: (e: React.DragEvent, index: number) => void;
  density?: 'compact' | 'normal' | 'large';
}

export const PageCard: React.FC<PageCardProps> = ({
  page,
  index,
  onToggleSelect,
  onRotateCW,
  onRotateCCW,
  onDelete,
  onDuplicate,
  onDragStart,
  onDragOver,
  onDrop,
  density = 'normal',
}) => {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart && onDragStart(e, index)}
      onDragOver={(e) => onDragOver && onDragOver(e, index)}
      onDrop={(e) => onDrop && onDrop(e, index)}
      onClick={(e) => onToggleSelect(page.id, e.shiftKey)}
      className={`group relative flex flex-col bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 select-none overflow-hidden cursor-pointer shadow-sm hover:shadow-md ${
        page.selected
          ? 'border-brand-500 ring-2 ring-brand-500/30 dark:ring-brand-500/40 bg-brand-50/20 dark:bg-brand-950/20'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Top Header: Selection + Page Number + Source info + Drag handle */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
              page.selected
                ? 'bg-brand-500 border-brand-500 text-white shadow-xs'
                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 group-hover:border-brand-400'
            }`}
          >
            {page.selected && <Check className="w-3 h-3 stroke-[3]" />}
          </div>
          <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] font-mono">
            #{index + 1}
          </span>
          {page.rotation > 0 && (
            <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400">
              {page.rotation}°
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 min-w-0">
          <span
            className="truncate max-w-[85px] text-[10px] text-slate-400 dark:text-slate-500 font-mono"
            title={page.fileName}
          >
            {page.fileName}
          </span>
          <div
            className="cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-300 p-0.5"
            title="Drag to reorder page"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Thumbnail View Area */}
      <div
        className={`relative w-full bg-slate-100/70 dark:bg-slate-950 flex items-center justify-center p-2.5 overflow-hidden ${
          density === 'compact' ? 'aspect-[3/4]' : density === 'large' ? 'aspect-[3/4]' : 'aspect-[3/4]'
        }`}
      >
        {page.thumbnailUrl ? (
          <img
            src={page.thumbnailUrl}
            alt={`Page ${index + 1}`}
            style={{ transform: `rotate(${page.rotation}deg)` }}
            className="max-h-full max-w-full object-contain rounded shadow-xs transition-transform duration-200"
            loading="lazy"
          />
        ) : (
          <div
            style={{ transform: `rotate(${page.rotation}deg)` }}
            className="w-4/5 h-4/5 bg-white dark:bg-slate-800 rounded shadow-xs border border-slate-200 dark:border-slate-700 flex flex-col justify-between p-3"
          >
            <div className="space-y-1.5">
              <div className="h-1.5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700/60 rounded" />
              <div className="h-1.5 w-5/6 bg-slate-100 dark:bg-slate-700/60 rounded" />
            </div>
            <div className="text-[10px] text-center font-mono text-slate-400">
              Page {page.sourcePageNum}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Strip: ALWAYS accessible in 1 click/tap (Touch & Mobile Friendly) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="px-1.5 py-1 bg-slate-50/90 dark:bg-slate-800/90 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1 text-slate-500 dark:text-slate-400"
      >
        <button
          type="button"
          onClick={() => onRotateCCW(page.id)}
          className="flex-1 py-1 px-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-brand-600 dark:hover:text-brand-400 active:scale-90 transition-all flex items-center justify-center"
          title="Rotate 90° CCW"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onRotateCW(page.id)}
          className="flex-1 py-1 px-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-brand-600 dark:hover:text-brand-400 active:scale-90 transition-all flex items-center justify-center"
          title="Rotate 90° CW"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onDuplicate(page.id)}
          className="flex-1 py-1 px-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-90 transition-all flex items-center justify-center"
          title="Duplicate Page"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(page.id)}
          className="flex-1 py-1 px-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-500 active:scale-90 transition-all flex items-center justify-center"
          title="Delete Page"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
