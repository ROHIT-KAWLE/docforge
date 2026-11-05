import React, { useState, useRef, useEffect } from 'react';
import {
  Download, Split, Scissors, RotateCw, Trash2, ArrowUpDown,
  Search, ShieldAlert, PlusCircle, Stamp, Hash, Crop,
  Minimize2, FileCode2, MoreHorizontal, Copy, CheckSquare,
  Sparkles, X
} from 'lucide-react';

interface ActionBarProps {
  totalCount: number;
  selectedCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSelectOdd: () => void;
  onSelectEven: () => void;
  onInvertSelect?: () => void;
  onExportMerge: () => void;
  onOpenSplit: () => void;
  onExtractSelected: () => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onRotateSelected: (angle: number) => void;
  onReverseOrder: () => void;
  onOddEvenSplit: () => void;
  onDetectBlanks: () => void;
  onDetectDuplicates: () => void;
  onAddBlankPage: () => void;
  onOpenWatermark: () => void;
  onOpenPageNumbers: () => void;
  onOpenCrop: () => void;
  onOpenCompress: () => void;
  onOpenOcr: () => void;
  onOpenDocx: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  totalCount,
  selectedCount,
  onSelectAll,
  onDeselectAll,
  onSelectOdd,
  onSelectEven,
  onInvertSelect,
  onExportMerge,
  onOpenSplit,
  onExtractSelected,
  onDeleteSelected,
  onDuplicateSelected,
  onRotateSelected,
  onReverseOrder,
  onOddEvenSplit,
  onDetectBlanks,
  onDetectDuplicates,
  onAddBlankPage,
  onOpenWatermark,
  onOpenPageNumbers,
  onOpenCrop,
  onOpenCompress,
  onOpenOcr,
  onOpenDocx,
}) => {
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowToolsMenu(false);
      }
    };
    if (showToolsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showToolsMenu]);

  if (totalCount === 0) return null;

  return (
    <div className="fixed bottom-16 md:bottom-4 inset-x-0 z-30 flex justify-center px-3 sm:px-4 pointer-events-none animate-slide-up">
      <div className="pointer-events-auto bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-md text-white px-3 py-2 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-2 max-w-5xl w-full justify-between overflow-x-auto no-scrollbar">
        {/* Left: Selection Badges & 1-Click Select Presets */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex flex-col">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-200">
              {selectedCount > 0 ? (
                <span className="text-brand-400 font-bold">{selectedCount} of {totalCount} selected</span>
              ) : (
                <span>{totalCount} pages</span>
              )}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 font-medium">
              <button
                type="button"
                onClick={selectedCount === totalCount ? onDeselectAll : onSelectAll}
                className="hover:text-white transition-colors"
              >
                {selectedCount === totalCount ? 'None' : 'All'}
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={onSelectOdd}
                className="hover:text-white transition-colors"
              >
                Odd
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={onSelectEven}
                className="hover:text-white transition-colors"
              >
                Even
              </button>
              {onInvertSelect && (
                <>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={onInvertSelect}
                    className="hover:text-white transition-colors"
                  >
                    Invert
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center: Contextual 1-Click Operations */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Rotate 90° (works on selected or all pages in 1 click) */}
          <button
            type="button"
            onClick={() => onRotateSelected(90)}
            className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-medium flex items-center gap-1.5 transition-all"
            title={selectedCount > 0 ? "Rotate selected pages 90°" : "Rotate all pages 90°"}
          >
            <RotateCw className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] sm:text-xs">
              {selectedCount > 0 ? 'Rotate' : 'Rotate All'}
            </span>
          </button>

          {/* Contextual actions based on selection */}
          {selectedCount > 0 ? (
            <>
              {/* Extract Selected (1-click download of selected pages) */}
              <button
                type="button"
                onClick={onExtractSelected}
                className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-medium flex items-center gap-1.5 transition-all"
                title="Extract selected pages into separate PDF"
              >
                <Scissors className="w-3.5 h-3.5 text-brand-400" />
                <span className="text-[11px] sm:text-xs">Extract</span>
              </button>

              {/* Duplicate Selected */}
              <button
                type="button"
                onClick={onDuplicateSelected}
                className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-medium flex items-center gap-1.5 transition-all"
                title="Duplicate selected pages"
              >
                <Copy className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline text-[11px] sm:text-xs">Duplicate</span>
              </button>

              {/* Delete Selected (1-click with instant undo notification) */}
              <button
                type="button"
                onClick={onDeleteSelected}
                className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 active:scale-95 text-xs font-medium flex items-center gap-1.5 transition-all"
                title="Delete selected pages"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="text-[11px] sm:text-xs">Delete ({selectedCount})</span>
              </button>
            </>
          ) : (
            <>
              {/* Split Document */}
              <button
                type="button"
                onClick={onOpenSplit}
                className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                title="Split document into multiple files"
              >
                <Split className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[11px] sm:text-xs">Split</span>
              </button>

              {/* Odd & Even Tool */}
              <button
                type="button"
                onClick={onOddEvenSplit}
                className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                title="Odd & Even Pages Tool"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-teal-400" />
                <span className="text-[11px] sm:text-xs">Odd/Even</span>
              </button>

              {/* Compress PDF */}
              <button
                type="button"
                onClick={onOpenCompress}
                className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                title="Compress PDF file size"
              >
                <Minimize2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline text-[11px] sm:text-xs">Compress</span>
              </button>

              {/* Reverse document order */}
              <button
                type="button"
                onClick={onReverseOrder}
                className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-medium flex items-center gap-1.5 transition-all"
                title="Reverse document order"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden md:inline text-[11px] sm:text-xs">Reverse</span>
              </button>

              {/* Add blank page */}
              <button
                type="button"
                onClick={onAddBlankPage}
                className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-medium flex items-center gap-1.5 transition-all"
                title="Add blank page"
              >
                <PlusCircle className="w-3.5 h-3.5 text-teal-400" />
                <span className="hidden lg:inline text-[11px] sm:text-xs">Add Blank</span>
              </button>
            </>
          )}

          {/* Quick Tools Flyout Menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowToolsMenu(!showToolsMenu)}
              className={`p-2 rounded-xl text-xs font-medium transition-colors flex items-center gap-1 ${
                showToolsMenu ? 'bg-slate-700 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title="More Document Tools"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showToolsMenu && (
              <div className="absolute bottom-full right-0 mb-2.5 w-56 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-2 flex flex-col gap-1 text-xs z-50 animate-scale-up">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1">
                  Document Tools
                </div>

                <button
                  type="button"
                  onClick={() => { setShowToolsMenu(false); onOpenWatermark(); }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2.5 text-slate-200 transition-colors"
                >
                  <Stamp className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Add Watermark</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setShowToolsMenu(false); onOpenPageNumbers(); }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2.5 text-slate-200 transition-colors"
                >
                  <Hash className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Page Numbers</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setShowToolsMenu(false); onOddEvenSplit(); }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2.5 text-slate-200 transition-colors"
                >
                  <ArrowUpDown className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Separate Odd & Even</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setShowToolsMenu(false); onDetectBlanks(); }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2.5 text-slate-200 transition-colors"
                >
                  <Search className="w-4 h-4 text-yellow-400 shrink-0" />
                  <span>Detect Blank Pages</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setShowToolsMenu(false); onDetectDuplicates(); }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2.5 text-slate-200 transition-colors"
                >
                  <ShieldAlert className="w-4 h-4 text-orange-400 shrink-0" />
                  <span>Duplicate Pages Check</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setShowToolsMenu(false); onOpenCrop(); }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2.5 text-slate-200 transition-colors"
                >
                  <Crop className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Visual Page Crop</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setShowToolsMenu(false); onOpenOcr(); }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2.5 text-slate-200 transition-colors"
                >
                  <Search className="w-4 h-4 text-lime-400 shrink-0" />
                  <span>OCR & Text Search</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setShowToolsMenu(false); onOpenDocx(); }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center gap-2.5 text-slate-200 transition-colors"
                >
                  <FileCode2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>DOCX / Word Tools</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Primary 1-Click Export PDF Button */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={onExportMerge}
            className="px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-brand-500/30 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
