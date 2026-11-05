import React, { useRef } from 'react';
import {
  UploadCloud, FileText, Split, Scissors, Minimize2,
  FileCode2, Search, Stamp, Hash, ArrowUpDown, Clock, Plus,
  Sparkles, Layers
} from 'lucide-react';
import { SmartCommandBox } from '../components/common/SmartCommandBox';
import { CommandParseResult, DocumentFile } from '../types';

interface HomePageProps {
  onFilesSelected: (files: File[], targetAction?: string) => void;
  onNavigateToWorkspace: () => void;
  onQuickAction: (action: string) => void;
  onExecuteCommand: (result: CommandParseResult) => void;
  recentFiles: DocumentFile[];
  onOpenRecent: (file: DocumentFile) => void;
  onClearRecent: () => void;
  totalPages: number;
}

export const HomePage: React.FC<HomePageProps> = ({
  onFilesSelected,
  onNavigateToWorkspace,
  onQuickAction,
  onExecuteCommand,
  recentFiles,
  onOpenRecent,
  onClearRecent,
  totalPages,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const pendingActionRef = useRef<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files), pendingActionRef.current || undefined);
      pendingActionRef.current = null;
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files), pendingActionRef.current || undefined);
      pendingActionRef.current = null;
    }
  };

  const handleActionClick = (actionId: string) => {
    if (totalPages > 0) {
      onQuickAction(actionId);
    } else {
      // If no document is currently loaded, prompt file selection for this action directly!
      pendingActionRef.current = actionId;
      fileInputRef.current?.click();
    }
  };

  const quickActions = [
    { id: 'merge', label: 'Merge PDF', desc: 'Combine documents', icon: FileText, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40' },
    { id: 'split', label: 'Split PDF', desc: 'Separate pages', icon: Split, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40' },
    { id: 'organize', label: 'Organize', desc: 'Rearrange & rotate', icon: Scissors, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' },
    { id: 'compress', label: 'Compress', desc: 'Reduce file size', icon: Minimize2, color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/40' },
    { id: 'convert', label: 'Convert', desc: 'DOCX ⇄ PDF', icon: FileCode2, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' },
    { id: 'ocr', label: 'OCR & Text', desc: 'Extract text', icon: Search, color: 'text-lime-500 bg-lime-50 dark:bg-lime-950/40' },
    { id: 'watermark', label: 'Watermark', desc: 'Custom stamp', icon: Stamp, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40' },
    { id: 'numbers', label: 'Page Numbers', desc: 'Add header/footer', icon: Hash, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' },
    { id: 'oddeven', label: 'Odd / Even', desc: 'Split alternate', icon: ArrowUpDown, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/40' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-fade-in">
      {/* Smart Command Box (Deterministic Offline Assistant) */}
      <section>
        <SmartCommandBox totalPages={totalPages} onExecuteCommand={onExecuteCommand} />
      </section>

      {/* Main Drag & Drop Zone */}
      <section
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => {
          pendingActionRef.current = null;
          fileInputRef.current?.click();
        }}
        className="relative group border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 rounded-3xl p-8 sm:p-12 bg-white dark:bg-slate-900/60 transition-all text-center flex flex-col items-center justify-center cursor-pointer shadow-xs hover:shadow-md"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          multiple
          accept=".pdf,.docx,.jpg,.jpeg,.png,.webp"
          className="hidden"
        />
        <input
          type="file"
          ref={folderInputRef}
          onChange={handleFileInputChange}
          // @ts-ignore
          webkitdirectory=""
          // @ts-ignore
          directory=""
          className="hidden"
        />

        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
          <UploadCloud className="w-8 h-8 stroke-[2.2]" />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1">
          Drag & Drop documents here
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
          PDF, Word (DOCX), JPG, PNG, or WEBP. All common operations run locally or on your private server.
        </p>

        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => {
              pendingActionRef.current = null;
              fileInputRef.current?.click();
            }}
            className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-semibold text-xs shadow-md shadow-brand-500/25 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Choose Files</span>
          </button>

          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            <span>Choose Folder</span>
          </button>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Supported formats:</span>
          {['PDF', 'DOCX', 'JPG', 'PNG', 'WEBP'].map((fmt) => (
            <span key={fmt} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[10px]">
              {fmt}
            </span>
          ))}
        </div>
      </section>

      {/* Quick 1-Click Actions Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            Quick Actions
          </h3>
          {totalPages > 0 && (
            <button
              type="button"
              onClick={onNavigateToWorkspace}
              className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold flex items-center gap-1"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Open Workspace ({totalPages} pages) →</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2.5">
          {quickActions.map((qa) => {
            const Icon = qa.icon;
            return (
              <button
                key={qa.id}
                type="button"
                onClick={() => handleActionClick(qa.id)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500 hover:shadow-xs active:scale-95 transition-all group cursor-pointer text-center"
                title={qa.desc}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 ${qa.color} group-hover:scale-105 transition-transform`}>
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate w-full">
                  {qa.label}
                </span>
                <span className="text-[9px] text-slate-400 hidden sm:block truncate w-full mt-0.5">
                  {qa.desc}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Recent Documents Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Recent Documents</span>
          </div>
          {recentFiles.length > 0 && (
            <button
              type="button"
              onClick={onClearRecent}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {recentFiles.length === 0 ? (
          <div className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            No recent documents yet. Drop files above to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {recentFiles.map((file) => (
              <div
                key={file.id}
                onClick={() => onOpenRecent(file)}
                className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 cursor-pointer flex items-center justify-between gap-3 transition-all hover:shadow-xs group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{file.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{file.pageCount} pages</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-brand-500 shrink-0 group-hover:translate-x-0.5 transition-transform">
                  Open →
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
