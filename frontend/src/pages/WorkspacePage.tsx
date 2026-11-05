import React, { useState, useRef } from 'react';
import {
  Undo2, Redo2, Plus, Trash, FolderHeart, LayoutGrid,
  Maximize2, Minimize2, X, FileText, ArrowUpDown, RotateCw,
  Scissors, CheckSquare, Layers
} from 'lucide-react';
import { PageCard } from '../components/workspace/PageCard';
import { ActionBar } from '../components/workspace/ActionBar';
import { PageModel, DocumentFile } from '../types';

interface WorkspacePageProps {
  pages: PageModel[];
  files: DocumentFile[];
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClearWorkspace: () => void;
  onAddFiles: (files: File[]) => void;
  onRemoveFile?: (fileId: string) => void;
  onToggleSelectPage: (id: string, shiftKey: boolean) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSelectOdd: () => void;
  onSelectEven: () => void;
  onInvertSelect?: () => void;
  onRotatePage: (id: string, delta: number) => void;
  onRotateSelected: (delta: number) => void;
  onDeletePage: (id: string) => void;
  onDeleteSelected: () => void;
  onDuplicatePage: (id: string) => void;
  onDuplicateSelected: () => void;
  onReorderPages: (fromIndex: number, toIndex: number) => void;
  onReverseOrder: () => void;
  onOddEvenSplit: () => void;
  onAddBlankPage: () => void;
  onSaveProject: () => void;
  onOpenSplit: () => void;
  onExtractSelected: () => void;
  onDetectBlanks: () => void;
  onDetectDuplicates: () => void;
  onOpenWatermark: () => void;
  onOpenPageNumbers: () => void;
  onOpenCrop: () => void;
  onOpenCompress: () => void;
  onOpenOcr: () => void;
  onOpenDocx: () => void;
  onExportMerge: () => void;
}

export const WorkspacePage: React.FC<WorkspacePageProps> = ({
  pages,
  files,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClearWorkspace,
  onAddFiles,
  onRemoveFile,
  onToggleSelectPage,
  onSelectAll,
  onDeselectAll,
  onSelectOdd,
  onSelectEven,
  onInvertSelect,
  onRotatePage,
  onRotateSelected,
  onDeletePage,
  onDeleteSelected,
  onDuplicatePage,
  onDuplicateSelected,
  onReorderPages,
  onReverseOrder,
  onOddEvenSplit,
  onAddBlankPage,
  onSaveProject,
  onOpenSplit,
  onExtractSelected,
  onDetectBlanks,
  onDetectDuplicates,
  onOpenWatermark,
  onOpenPageNumbers,
  onOpenCrop,
  onOpenCompress,
  onOpenOcr,
  onOpenDocx,
  onExportMerge,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [density, setDensity] = useState<'compact' | 'normal' | 'large'>('normal');
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedPages = pages.filter((p) => p.selected);

  // Handle page reordering
  const handlePageDragStart = (e: React.DragEvent, index: number) => {
    // Only drag reorder if not dragging files
    if (e.dataTransfer.types.includes('Files')) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handlePageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handlePageDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      onReorderPages(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
  };

  // Handle external file drag-and-drop into workspace
  const handleWorkspaceDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      setIsDraggingFiles(true);
    }
  };

  const handleWorkspaceDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingFiles(false);
  };

  const handleWorkspaceDrop = (e: React.DragEvent) => {
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      e.preventDefault();
      setIsDraggingFiles(false);
      onAddFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddFiles(Array.from(e.target.files));
    }
  };

  // Determine grid columns based on density
  const getGridColsClass = () => {
    switch (density) {
      case 'compact':
        return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5';
      case 'large':
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5';
      case 'normal':
      default:
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5';
    }
  };

  return (
    <div
      onDragOver={handleWorkspaceDragOver}
      onDragLeave={handleWorkspaceDragLeave}
      onDrop={handleWorkspaceDrop}
      className="relative max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-36 space-y-4 animate-fade-in"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        multiple
        accept=".pdf,.docx,.jpg,.jpeg,.png,.webp"
        className="hidden"
      />

      {/* External File Drop Overlay */}
      {isDraggingFiles && (
        <div className="fixed inset-0 z-50 bg-brand-600/90 backdrop-blur-sm flex flex-col items-center justify-center text-white pointer-events-none animate-fade-in">
          <div className="p-6 rounded-3xl bg-white/10 border-2 border-dashed border-white/60 flex flex-col items-center gap-3">
            <Plus className="w-12 h-12 stroke-[2.5] animate-bounce" />
            <p className="text-xl font-bold">Drop files to add to workspace</p>
            <p className="text-xs text-brand-100">Supports PDF, DOCX, JPG, PNG, WEBP</p>
          </div>
        </div>
      )}

      {/* Workspace Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Left: Add files button + File pills with 1-click removal */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-semibold flex items-center gap-1.5 shrink-0 shadow-xs shadow-brand-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Files</span>
          </button>

          {files.map((f) => (
            <div
              key={f.id}
              className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] flex items-center gap-1.5 shrink-0 border border-slate-200/60 dark:border-slate-700/60"
            >
              <FileText className="w-3 h-3 text-brand-500" />
              <span className="font-semibold truncate max-w-[130px]" title={f.name}>{f.name}</span>
              <span className="text-[10px] text-slate-400">({f.pageCount}p)</span>
              {onRemoveFile && (
                <button
                  type="button"
                  onClick={() => onRemoveFile(f.id)}
                  className="p-0.5 rounded-md hover:bg-red-500/10 hover:text-red-500 text-slate-400 transition-colors ml-0.5"
                  title={`Remove ${f.name} from workspace`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Right: View density controls + Undo/Redo + Save Project + Clear */}
        <div className="flex items-center gap-2 text-xs">
          {/* Density Selector */}
          <div className="hidden sm:flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl">
            <button
              type="button"
              onClick={() => setDensity('compact')}
              className={`p-1.5 rounded-lg transition-colors ${
                density === 'compact'
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Compact View (More pages at once)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDensity('normal')}
              className={`p-1.5 rounded-lg transition-colors ${
                density === 'normal'
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Comfortable View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDensity('large')}
              className={`p-1.5 rounded-lg transition-colors ${
                density === 'large'
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Large View (Detailed preview)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 text-slate-700 dark:text-slate-300 transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 text-slate-700 dark:text-slate-300 transition-colors"
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Save Project */}
          <button
            type="button"
            onClick={onSaveProject}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
            title="Save project state to private server"
          >
            <FolderHeart className="w-3.5 h-3.5 text-brand-500" />
            <span className="hidden sm:inline">Save</span>
          </button>

          {/* Clear Workspace */}
          <button
            type="button"
            onClick={onClearWorkspace}
            className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            title="Clear all pages from workspace"
          >
            <Trash className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Pages Grid or Empty State */}
      {pages.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="p-12 sm:p-20 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-500 cursor-pointer space-y-3 transition-all"
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <Layers className="w-7 h-7" />
          </div>
          <p className="text-base font-bold text-slate-800 dark:text-slate-200">
            Workspace is empty
          </p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Click here or drag & drop PDF, DOCX, or images anywhere on this page to start rearranging, rotating, and editing.
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="mt-3 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-semibold text-xs shadow-md shadow-brand-500/25 transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Choose Documents</span>
          </button>
        </div>
      ) : (
        <div className={`grid ${getGridColsClass()}`}>
          {pages.map((page, idx) => (
            <PageCard
              key={page.id}
              page={page}
              index={idx}
              density={density}
              onToggleSelect={onToggleSelectPage}
              onRotateCW={() => onRotatePage(page.id, 90)}
              onRotateCCW={() => onRotatePage(page.id, 270)}
              onDelete={() => onDeletePage(page.id)}
              onDuplicate={() => onDuplicatePage(page.id)}
              onDragStart={handlePageDragStart}
              onDragOver={handlePageDragOver}
              onDrop={handlePageDrop}
            />
          ))}
        </div>
      )}

      {/* Floating Action Bar */}
      <ActionBar
        totalCount={pages.length}
        selectedCount={selectedPages.length}
        onSelectAll={onSelectAll}
        onDeselectAll={onDeselectAll}
        onSelectOdd={onSelectOdd}
        onSelectEven={onSelectEven}
        onInvertSelect={onInvertSelect}
        onExportMerge={onExportMerge}
        onOpenSplit={onOpenSplit}
        onExtractSelected={onExtractSelected}
        onDeleteSelected={onDeleteSelected}
        onDuplicateSelected={onDuplicateSelected}
        onRotateSelected={onRotateSelected}
        onReverseOrder={onReverseOrder}
        onOddEvenSplit={onOddEvenSplit}
        onDetectBlanks={onDetectBlanks}
        onDetectDuplicates={onDetectDuplicates}
        onAddBlankPage={onAddBlankPage}
        onOpenWatermark={onOpenWatermark}
        onOpenPageNumbers={onOpenPageNumbers}
        onOpenCrop={onOpenCrop}
        onOpenCompress={onOpenCompress}
        onOpenOcr={onOpenOcr}
        onOpenDocx={onOpenDocx}
      />
    </div>
  );
};
