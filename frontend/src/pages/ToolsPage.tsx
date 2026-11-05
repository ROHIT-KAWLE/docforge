import React from 'react';
import {
  FileText, Split, Scissors, RotateCw, Minimize2,
  FileCode2, Search, Stamp, Hash, ArrowUpDown, ShieldAlert,
  Image as ImageIcon, ShieldCheck
} from 'lucide-react';

interface ToolsPageProps {
  onSelectTool: (toolId: string) => void;
  hasFiles?: boolean;
}

export const ToolsPage: React.FC<ToolsPageProps> = ({ onSelectTool, hasFiles = false }) => {
  const tools = [
    {
      id: 'merge',
      title: 'Merge PDF',
      desc: 'Combine multiple PDFs, images, or converted documents in any exact order.',
      icon: FileText,
      badge: 'Local / Server',
      color: 'text-blue-500 bg-blue-500/10'
    },
    {
      id: 'split',
      title: 'Split PDF',
      desc: 'Split document by page ranges, every N pages, or every individual page.',
      icon: Split,
      badge: 'Interactive Preview',
      color: 'text-purple-500 bg-purple-500/10'
    },
    {
      id: 'compress',
      title: 'Compress PDF',
      desc: 'Reduce PDF file size with Low, Balanced, High, or Maximum compression presets.',
      icon: Minimize2,
      badge: 'Fast Optimizer',
      color: 'text-cyan-500 bg-cyan-500/10'
    },
    {
      id: 'oddeven',
      title: 'Odd & Even Pages',
      desc: 'Separate odd and even numbered pages into individual clean PDFs in 1 click.',
      icon: ArrowUpDown,
      badge: '1-Click Split',
      color: 'text-teal-500 bg-teal-500/10'
    },
    {
      id: 'blank',
      title: 'Blank Page Detection',
      desc: 'Scan documents for blank pages and remove them with review confirmation.',
      icon: Search,
      badge: 'Smart Detection',
      color: 'text-yellow-500 bg-yellow-500/10'
    },
    {
      id: 'duplicates',
      title: 'Duplicate Page Detection',
      desc: 'Find identical or duplicate scanned pages across documents automatically.',
      icon: ShieldAlert,
      badge: 'Perceptual Hash',
      color: 'text-orange-500 bg-orange-500/10'
    },
    {
      id: 'watermark',
      title: 'Add Watermark',
      desc: 'Apply custom text watermarks with opacity, rotation, and customizable colors.',
      icon: Stamp,
      badge: 'Visual Styling',
      color: 'text-rose-500 bg-rose-500/10'
    },
    {
      id: 'numbers',
      title: 'Page Numbering',
      desc: 'Add professional page numbers in 6 positions with prefix/suffix formatting.',
      icon: Hash,
      badge: 'Typography',
      color: 'text-indigo-500 bg-indigo-500/10'
    },
    {
      id: 'docx',
      title: 'DOCX & Word Tools',
      desc: 'Convert Word DOCX to PDF with LibreOffice or export PDF to Word DOCX format.',
      icon: FileCode2,
      badge: 'LibreOffice Engine',
      color: 'text-sky-500 bg-sky-500/10'
    },
    {
      id: 'ocr',
      title: 'OCR & Text Search',
      desc: 'Extract text, search inside documents, or create searchable PDFs.',
      icon: Search,
      badge: 'PyMuPDF Engine',
      color: 'text-lime-500 bg-lime-500/10'
    },
    {
      id: 'crop',
      title: 'Crop Margins',
      desc: 'Trim headers, margins, or scanner borders across single or all pages.',
      icon: Scissors,
      badge: 'Visual Trimmer',
      color: 'text-emerald-500 bg-emerald-500/10'
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Document Toolbox
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          {hasFiles
            ? 'Click any tool to apply it directly to your currently loaded document.'
            : 'Click any tool to select a document and launch immediately.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {tools.map((t) => {
          const Icon = t.icon;
          return (
            <div
              key={t.id}
              onClick={() => onSelectTool(t.id)}
              className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 cursor-pointer transition-all hover:shadow-md active:scale-[0.99] flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${t.color} group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <span className="text-[10px] font-semibold font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {t.badge}
                  </span>
                </div>

                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white mb-1">
                  {t.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {t.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-brand-600 dark:text-brand-400">
                <span>{hasFiles ? 'Apply to Document' : 'Select File & Launch'}</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
