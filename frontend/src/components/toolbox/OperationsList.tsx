import React, { useState } from 'react';
import {
  ArrowUpDown, Minimize2, Split, RotateCw, RotateCcw,
  Scissors, Stamp, Hash, FileCode2, Search, Download,
  CheckSquare, Archive, Sparkles, Loader2, Layers,
  Image as ImageIcon, ImageDown, Plus
} from 'lucide-react';
import { PageModel, DocumentFile } from '../../types';

interface OperationsListProps {
  pages: PageModel[];
  files: DocumentFile[];
  loadingAction: string | null;
  onDownloadOdd: () => void;
  onDownloadEven: () => void;
  onDownloadBothZip: () => void;
  onSelectOdd: () => void;
  onSelectEven: () => void;
  onCompress: (level: string) => void;
  onSplitEveryPage: () => void;
  onSplitHalf: () => void;
  onSplitRanges: (ranges: string) => void;
  onRotateAll: (angle: number) => void;
  onReverseOrder: () => void;
  onExtractSelected: () => void;
  onExtractRanges: (ranges: string) => void;
  onApplyWatermark: (text: string) => void;
  onApplyPageNumbers: (position: string) => void;
  onConvertDocx: () => void;
  onDetectAndRemoveBlanks: () => void;
  onExportMerge: () => void;
  onMergePdfsPrompt: () => void;
  onMergeCurrentPdfs: () => void;
  onImagesToPdfPrompt: () => void;
  onConvertLoadedImagesToPdf: () => void;
  onPdfToImages: (format: 'png' | 'jpg') => void;
  onDownloadOriginalImage?: () => void;
}

export const OperationsList: React.FC<OperationsListProps> = ({
  pages,
  files,
  loadingAction,
  onDownloadOdd,
  onDownloadEven,
  onDownloadBothZip,
  onSelectOdd,
  onSelectEven,
  onCompress,
  onSplitEveryPage,
  onSplitHalf,
  onSplitRanges,
  onRotateAll,
  onReverseOrder,
  onExtractSelected,
  onExtractRanges,
  onApplyWatermark,
  onApplyPageNumbers,
  onConvertDocx,
  onDetectAndRemoveBlanks,
  onExportMerge,
  onMergePdfsPrompt,
  onMergeCurrentPdfs,
  onImagesToPdfPrompt,
  onConvertLoadedImagesToPdf,
  onPdfToImages,
  onDownloadOriginalImage,
}) => {
  const [splitRangesInput, setSplitRangesInput] = useState('1-2, 3-4');
  const [extractRangesInput, setExtractRangesInput] = useState('1-2');
  const [watermarkTextInput, setWatermarkTextInput] = useState('CONFIDENTIAL');
  const [pageNumberPosition, setPageNumberPosition] = useState('bottom_center');

  const totalPages = pages.length;
  const oddCount = Math.ceil(totalPages / 2);
  const evenCount = Math.floor(totalPages / 2);
  const selectedCount = pages.filter((p) => p.selected).length;
  const isDocx = files[0]?.extension === '.docx';
  const hasImages = files.some((f) => /\.(jpg|jpeg|png|webp)$/i.test(f.name || f.extension || ''));
  const isSingleImage = files.length === 1 && /\.(jpg|jpeg|png|webp)$/i.test(files[0]?.name || files[0]?.extension || '');

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const fileSizeBytes = files[0]?.sizeBytes;

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Available Operations (Click to run)
        </h2>
        <span className="text-xs text-slate-400 font-mono">
          {totalPages} {totalPages === 1 ? 'page' : 'pages'} loaded
        </span>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
        
        {/* ROW 0A: MERGE MULTIPLE PDFS */}
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Merge PDFs
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-semibold">
                  {files.length} {files.length === 1 ? 'file' : 'files'} • {totalPages} pages
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Combine multiple PDF documents in order into a single clean PDF file.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onMergePdfsPrompt}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Add more PDFs to merge"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add PDFs</span>
            </button>

            <button
              type="button"
              onClick={onMergeCurrentPdfs}
              disabled={loadingAction === 'merge' || totalPages === 0}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-xs shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Merge all loaded pages into one document and download"
            >
              {loadingAction === 'merge' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
              <span>Merge & Download PDF</span>
            </button>
          </div>
        </div>

        {/* ROW 0B: IMAGES TO A4 PDF (AUTO-FIT) */}
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ImageIcon className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Images ➔ A4 PDF
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold">
                  Standard A4 • Auto-Fit Contain
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Convert JPG, PNG, WEBP images auto-fitted into standard A4 pages with zero distortion.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onImagesToPdfPrompt}
              disabled={loadingAction === 'images_to_pdf'}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Choose image files from your computer and convert directly to A4 PDF"
            >
              {loadingAction === 'images_to_pdf' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5 stroke-[2.5]" />}
              <span>Select Images ➔ A4 PDF</span>
            </button>

            {hasImages && (
              <button
                type="button"
                onClick={onConvertLoadedImagesToPdf}
                disabled={loadingAction === 'images_to_pdf'}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Convert already loaded images in workspace to A4 PDF"
              >
                {loadingAction === 'images_to_pdf' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                <span>Convert Current Images</span>
              </button>
            )}
          </div>
        </div>

        {/* ROW 0C: PDF TO IMAGES / DOWNLOAD IMAGES */}
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <ImageDown className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  PDF ➔ Images (Download)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-300 font-semibold">
                  PNG & JPG
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Download high-resolution image files of every page in this document.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onPdfToImages('png')}
              disabled={loadingAction === 'pdf_to_images_png' || totalPages === 0}
              className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-xs shadow-xs shadow-sky-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Download pages as lossless PNG images (ZIP)"
            >
              {loadingAction === 'pdf_to_images_png' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>Download PNG ({totalPages}p)</span>
            </button>

            <button
              type="button"
              onClick={() => onPdfToImages('jpg')}
              disabled={loadingAction === 'pdf_to_images_jpg' || totalPages === 0}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Download pages as JPG images (ZIP)"
            >
              {loadingAction === 'pdf_to_images_jpg' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>Download JPG</span>
            </button>

            {isSingleImage && onDownloadOriginalImage && (
              <button
                type="button"
                onClick={onDownloadOriginalImage}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-xs transition-colors"
                title="Download original uploaded image"
              >
                Download Image
              </button>
            )}
          </div>
        </div>

        {/* ROW 1: ODD & EVEN PAGES */}
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <ArrowUpDown className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Odd & Even Pages
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 font-semibold">
                  {oddCount} odd • {evenCount} even
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Download alternating pages directly or extract odd / even separately.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Button 1: Odd Pages */}
            <button
              type="button"
              onClick={onDownloadOdd}
              disabled={loadingAction === 'odd' || oddCount === 0}
              className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 active:scale-95 text-white font-bold text-xs shadow-xs shadow-teal-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Download Odd Pages (Pages 1, 3, 5...)"
            >
              {loadingAction === 'odd' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>Odd Pages ({oddCount}p)</span>
            </button>

            {/* Button 2: Even Pages */}
            <button
              type="button"
              onClick={onDownloadEven}
              disabled={loadingAction === 'even' || evenCount === 0}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs shadow-xs shadow-purple-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Download Even Pages (Pages 2, 4, 6...)"
            >
              {loadingAction === 'even' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>Even Pages ({evenCount}p)</span>
            </button>

            {/* Button 3: Both as ZIP */}
            <button
              type="button"
              onClick={onDownloadBothZip}
              disabled={loadingAction === 'odd_even_zip' || totalPages < 2}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              title="Download Odd and Even as a single ZIP file"
            >
              {loadingAction === 'odd_even_zip' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
              <span>Both (ZIP)</span>
            </button>

            {/* Select Odd / Even */}
            <button
              type="button"
              onClick={onSelectOdd}
              className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-xs transition-colors"
              title="Highlight odd pages in document"
            >
              Select Odd
            </button>
            <button
              type="button"
              onClick={onSelectEven}
              className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-xs transition-colors"
              title="Highlight even pages in document"
            >
              Select Even
            </button>
          </div>
        </div>

        {/* ROW 2: COMPRESS PDF */}
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <Minimize2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Compress PDF
                </h3>
                {fileSizeBytes && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                    Current: {formatSize(fileSizeBytes)}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Shrinks PDF streams, subsets fonts, and downsamples heavy images for sharing.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onCompress('balanced')}
              disabled={loadingAction === 'compress_balanced'}
              className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 active:scale-95 text-white font-bold text-xs shadow-xs shadow-cyan-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Balanced compression (Recommended: optimal quality & reduction)"
            >
              {loadingAction === 'compress_balanced' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Minimize2 className="w-3.5 h-3.5" />}
              <span>Compress (Balanced)</span>
            </button>

            <button
              type="button"
              onClick={() => onCompress('maximum')}
              disabled={loadingAction === 'compress_maximum'}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Maximum compression (Smallest file size)"
            >
              {loadingAction === 'compress_maximum' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
              <span>Compress (Max Size Reduction)</span>
            </button>
          </div>
        </div>

        {/* ROW 3: SPLIT DOCUMENT */}
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Split className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Split Document
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Break document into single pages or divide into equal parts.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onSplitEveryPage}
              disabled={loadingAction === 'split_every'}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-xs shadow-blue-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Creates an individual 1-page PDF for every page and downloads ZIP"
            >
              {loadingAction === 'split_every' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Split className="w-3.5 h-3.5" />}
              <span>Split Every Page (ZIP)</span>
            </button>

            <button
              type="button"
              onClick={onSplitHalf}
              disabled={loadingAction === 'split_half' || totalPages < 2}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              title="Split into 2 equal halves"
            >
              {loadingAction === 'split_half' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Split className="w-3.5 h-3.5" />}
              <span>Split in Half</span>
            </button>
          </div>
        </div>

        {/* ROW 4: ROTATE ALL PAGES */}
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <RotateCw className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Rotate Pages
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Rotate orientation across the document in 1 click.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onRotateAll(90)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs shadow-xs shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Rotate +90° Clockwise"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Rotate 90° CW</span>
            </button>

            <button
              type="button"
              onClick={() => onRotateAll(270)}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Rotate 90° Counter-Clockwise"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Rotate 90° CCW</span>
            </button>

            <button
              type="button"
              onClick={() => onRotateAll(180)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-xs transition-colors"
              title="Flip Upside Down (180°)"
            >
              Rotate 180°
            </button>
          </div>
        </div>

        {/* ROW 5: REVERSE PAGE ORDER */}
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <ArrowUpDown className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Reverse Order
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Flip page sequence backward (e.g. Page {totalPages} becomes Page 1).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onReverseOrder}
              disabled={totalPages < 2}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs shadow-xs shadow-purple-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              title="Reverse document pages order"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Reverse Page Order</span>
            </button>
          </div>
        </div>

        {/* ROW 6: EXTRACT PAGES */}
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Scissors className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Extract Pages
                </h3>
                {selectedCount > 0 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold">
                    {selectedCount} selected
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Extract selected thumbnail pages or a custom range into a new clean PDF.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {selectedCount > 0 ? (
              <button
                type="button"
                onClick={onExtractSelected}
                disabled={loadingAction === 'extract'}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Extract currently selected pages"
              >
                {loadingAction === 'extract' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Scissors className="w-3.5 h-3.5" />}
                <span>Extract Selected ({selectedCount}p)</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={extractRangesInput}
                  onChange={(e) => setExtractRangesInput(e.target.value)}
                  placeholder="e.g. 1-3"
                  className="w-24 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-center"
                />
                <button
                  type="button"
                  onClick={() => onExtractRanges(extractRangesInput)}
                  disabled={loadingAction === 'extract'}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {loadingAction === 'extract' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Scissors className="w-3.5 h-3.5" />}
                  <span>Extract Ranges</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ROW 7: ADD WATERMARK */}
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Stamp className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Add Watermark
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Stamps customizable diagonal text across every page.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <input
              type="text"
              value={watermarkTextInput}
              onChange={(e) => setWatermarkTextInput(e.target.value)}
              placeholder="CONFIDENTIAL"
              className="w-36 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold"
            />
            <button
              type="button"
              onClick={() => onApplyWatermark(watermarkTextInput)}
              disabled={loadingAction === 'watermark' || !watermarkTextInput.trim()}
              className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-bold text-xs shadow-xs shadow-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loadingAction === 'watermark' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Stamp className="w-3.5 h-3.5" />}
              <span>Apply & Download</span>
            </button>
          </div>
        </div>

        {/* ROW 8: ADD PAGE NUMBERS */}
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Hash className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Page Numbering
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Inserts clean page numbers (e.g. Page 1 of {totalPages}) onto every page.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <select
              value={pageNumberPosition}
              onChange={(e) => setPageNumberPosition(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium"
            >
              <option value="bottom_center">Bottom Center</option>
              <option value="bottom_right">Bottom Right</option>
              <option value="top_right">Top Right</option>
            </select>
            <button
              type="button"
              onClick={() => onApplyPageNumbers(pageNumberPosition)}
              disabled={loadingAction === 'numbers'}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-xs shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loadingAction === 'numbers' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Hash className="w-3.5 h-3.5" />}
              <span>Add Numbers</span>
            </button>
          </div>
        </div>

        {/* ROW 9: DOCX ⇄ PDF CONVERSION */}
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <FileCode2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Word / DOCX Tools
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isDocx ? 'Convert Word document to standardized PDF.' : 'Convert PDF document into editable Microsoft Word DOCX.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onConvertDocx}
              disabled={loadingAction === 'docx'}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-xs shadow-xs shadow-sky-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loadingAction === 'docx' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileCode2 className="w-3.5 h-3.5" />}
              <span>{isDocx ? 'Convert DOCX to PDF' : 'Convert PDF to Word DOCX'}</span>
            </button>
          </div>
        </div>

        {/* ROW 10: REMOVE BLANK PAGES */}
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 flex items-center justify-center shrink-0">
              <Search className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Blank Page Detection
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Detects blank scanner pages and removes them instantly with 1 click.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onDetectAndRemoveBlanks}
              disabled={loadingAction === 'blanks'}
              className="px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-600 active:scale-95 text-slate-900 font-bold text-xs shadow-xs shadow-yellow-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loadingAction === 'blanks' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Scan & Remove Blanks</span>
            </button>
          </div>
        </div>

      </div>

      {/* MASTER EXPORT ROW */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-brand-600 to-brand-500 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-base">
            Ready to export?
          </h3>
          <p className="text-xs text-brand-100 mt-0.5">
            Download your current document with all page rotations, deletions, and reordering.
          </p>
        </div>

        <button
          type="button"
          onClick={onExportMerge}
          disabled={loadingAction === 'export'}
          className="px-6 py-3 rounded-2xl bg-white hover:bg-brand-50 active:scale-95 text-brand-600 font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loadingAction === 'export' ? <Loader2 className="w-4 h-4 animate-spin text-brand-600" /> : <Download className="w-4 h-4 stroke-[2.5]" />}
          <span>Download Complete Document ({totalPages}p)</span>
        </button>
      </div>
    </div>
  );
};
