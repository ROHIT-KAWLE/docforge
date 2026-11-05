import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PrivacyBadge } from './components/common/PrivacyBadge';
import { UnlockModal } from './components/modals/UnlockModal';
import { PageCard } from './components/workspace/PageCard';
import { OperationsList } from './components/toolbox/OperationsList';

import { PageModel, DocumentFile, HistoryEntry, OperationNotice } from './types';
import { api, getAuthToken, clearAuthToken } from './services/api';
import { triggerDirectDownload } from './utils/downloadHelper';
import {
  FileText, Sun, Moon, Lock, UploadCloud, Plus, Trash2,
  Undo2, Redo2, Layers, CheckSquare, ChevronDown, ChevronUp,
  RotateCw, AlertCircle, Sparkles, Image as ImageIcon, ImageDown, Download
} from 'lucide-react';

export const App: React.FC = () => {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('docforge_theme') === 'dark' ||
      (!('docforge_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [setupRequired, setSetupRequired] = useState<boolean>(false);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  // Document state
  const [pages, setPages] = useState<PageModel[]>([]);
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // UI state
  const [notice, setNotice] = useState<OperationNotice | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(true);
  const [isDraggingFiles, setIsDraggingFiles] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mergePdfsInputRef = useRef<HTMLInputElement>(null);
  const imagesToPdfInputRef = useRef<HTMLInputElement>(null);
  const pdfToImagesInputRef = useRef<HTMLInputElement>(null);

  // Sync theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('docforge_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('docforge_theme', 'light');
    }
  }, [darkMode]);

  // Check auth status on mount
  useEffect(() => {
    checkAuth();
    window.addEventListener('docforge-unauthorized', () => {
      setIsAuthenticated(false);
    });
  }, []);

  const checkAuth = async () => {
    setAuthChecking(true);
    try {
      const res = await api.getAuthStatus();
      setSetupRequired(res.setup_required);
      setIsAuthenticated(res.is_authenticated);
      if (!res.is_authenticated) {
        clearAuthToken();
      }
    } catch {
      setIsAuthenticated(true);
    } finally {
      setAuthChecking(false);
    }
  };

  const handleUnlocked = () => {
    setIsAuthenticated(true);
    setSetupRequired(false);
  };

  const handleLock = () => {
    clearAuthToken();
    setIsAuthenticated(false);
  };

  const pushNotice = (message: string, location: 'local' | 'server') => {
    setNotice({ message, location, timestamp: Date.now() });
    setTimeout(() => {
      setNotice((curr) => (curr && Date.now() - curr.timestamp > 4500 ? null : curr));
    }, 5000);
  };

  // History & Undo/Redo
  const pushHistory = (newPages: PageModel[], desc: string) => {
    const truncated = history.slice(0, historyIndex + 1);
    const updated = [...truncated, { pages: newPages, actionDescription: desc }];
    setHistory(updated);
    setHistoryIndex(updated.length - 1);
    setPages(newPages);
  };

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const target = historyIndex - 1;
      setHistoryIndex(target);
      setPages(history[target].pages);
      pushNotice(`Undo: ${history[target].actionDescription}`, 'local');
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const target = historyIndex + 1;
      setHistoryIndex(target);
      setPages(history[target].pages);
      pushNotice(`Redo: ${history[target].actionDescription}`, 'local');
    }
  }, [historyIndex, history]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setPages((curr) => curr.map((p) => ({ ...p, selected: true })));
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const hasSelected = pages.some((p) => p.selected);
        if (hasSelected) {
          e.preventDefault();
          const count = pages.filter((p) => p.selected).length;
          const updated = pages.filter((p) => !p.selected);
          pushHistory(updated, `Deleted ${count} page(s)`);
          pushNotice(`Deleted ${count} page(s). Click Undo to restore.`, 'local');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, pages]);

  // File Uploading & Parsing
  const handleFilesAdded = async (newRawFiles: File[]) => {
    if (newRawFiles.length === 0) return;
    try {
      pushNotice('Uploading and parsing documents...', 'server');
      const res = await api.uploadFiles(newRawFiles);

      const addedPages: PageModel[] = [];
      const addedFiles: DocumentFile[] = [];

      for (const item of res.uploaded) {
        const docFile: DocumentFile = {
          id: item.file_id,
          name: item.original_name,
          sizeBytes: item.size_bytes,
          extension: item.extension,
          pageCount: item.page_count,
          uploadedAt: item.created_at,
          docxPreview: item.docx_info,
        };
        addedFiles.push(docFile);

        const pCount = item.page_count || 1;
        for (let i = 1; i <= pCount; i++) {
          addedPages.push({
            id: `${item.file_id}_p${i}_${Math.random().toString(36).substring(2, 7)}`,
            fileId: item.file_id,
            fileName: item.original_name,
            sourcePageNum: i,
            rotation: 0,
            selected: false,
            thumbnailUrl: api.getThumbnailUrl(item.file_id, i, 300),
          });
        }
      }

      setFiles((curr) => [...curr, ...addedFiles]);
      const nextPages = [...pages, ...addedPages];
      pushHistory(nextPages, `Loaded ${addedPages.length} pages`);
      pushNotice(`Loaded ${addedPages.length} pages from ${newRawFiles.length} file(s).`, 'server');
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    }
  };

  const handleClearDocument = () => {
    if (pages.length === 0) return;
    setPages([]);
    setFiles([]);
    setHistory([]);
    setHistoryIndex(-1);
    pushNotice('Cleared document.', 'local');
  };

  // Compile current workspace pages into a single PDF ID for server operations
  const getEffectiveFileId = async (): Promise<string> => {
    if (pages.length === 0) throw new Error('No documents uploaded.');

    // Fast path: untouched single file
    if (
      files.length === 1 &&
      pages.length === files[0].pageCount &&
      pages.every((p, i) => p.fileId === files[0].id && p.sourcePageNum === i + 1 && p.rotation === 0 && !p.crop)
    ) {
      return files[0].id;
    }

    // Compile current workspace pages (respecting order, rotations, multi-file merges)
    const specs = pages.map((p) => ({
      file_id: p.fileId,
      page_number: p.sourcePageNum,
      rotation: p.rotation,
      crop: p.crop,
    }));
    const res = await api.mergePages(specs, 'workspace_compiled.pdf');
    return res.file.file_id;
  };

  // Base filename helper
  const getBaseName = () => {
    return files[0]?.name ? files[0].name.replace(/\.[^/.]+$/, '') : 'document';
  };

  // ----------------------------------------------------
  // DEDICATED TOOL ACTIONS: MERGE PDFS & IMAGES TO A4 PDF
  // ----------------------------------------------------

  // 0A. Merge Multiple PDFs
  const handleMergePdfsPrompt = () => {
    mergePdfsInputRef.current?.click();
  };

  const handleMergePdfsFilesSelected = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;
    setLoadingAction('merge');
    try {
      pushNotice(`Uploading ${selectedFiles.length} PDF(s) to merge...`, 'server');
      const uploadRes = await api.uploadFiles(selectedFiles);
      const fileIds = uploadRes.uploaded.map((f: any) => f.file_id);

      pushNotice('Merging PDFs in sequence...', 'server');
      const mergeRes = await api.mergePdfs(fileIds, 'merged_document.pdf');
      if (mergeRes.file) {
        triggerDirectDownload(api.getDownloadUrl(mergeRes.file.file_id), mergeRes.file.original_name || 'merged_document.pdf');
        pushNotice(`Merged ${selectedFiles.length} PDFs into 1 document and downloaded!`, 'server');
      }

      // Also append files into workspace
      await handleFilesAdded(selectedFiles);
    } catch (err: any) {
      alert(`Merge PDFs failed: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleMergeCurrentPdfs = async () => {
    if (pages.length === 0) return;
    setLoadingAction('merge');
    try {
      pushNotice('Compiling and merging all document pages...', 'server');
      const specs = pages.map((p) => ({
        file_id: p.fileId,
        page_number: p.sourcePageNum,
        rotation: p.rotation,
        crop: p.crop,
      }));
      const res = await api.mergePages(specs, `${getBaseName()}_merged.pdf`);
      if (res.file) {
        triggerDirectDownload(api.getDownloadUrl(res.file.file_id), res.file.original_name || 'merged_document.pdf');
        pushNotice(`Merged all ${pages.length} pages into PDF and downloaded!`, 'server');
      }
    } catch (err: any) {
      alert(`Merge failed: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // 0B. Images to A4 PDF (Proportional Auto-Fit)
  const handleImagesToPdfPrompt = () => {
    imagesToPdfInputRef.current?.click();
  };

  const handleImagesToPdfFilesSelected = async (selectedImages: File[]) => {
    if (selectedImages.length === 0) return;
    setLoadingAction('images_to_pdf');
    try {
      pushNotice(`Uploading ${selectedImages.length} image(s)...`, 'server');
      const uploadRes = await api.uploadFiles(selectedImages);
      const fileIds = uploadRes.uploaded.map((f: any) => f.file_id);

      pushNotice('Fitting images into standard A4 PDF pages...', 'server');
      const res = await api.imagesToPdf(fileIds, 'A4', 'contain');
      if (res.file) {
        triggerDirectDownload(api.getDownloadUrl(res.file.file_id), res.file.original_name || 'images_document_A4.pdf');
        pushNotice(`Converted ${selectedImages.length} image(s) to A4 PDF and downloaded!`, 'server');
      }

      // Also load to workspace
      await handleFilesAdded(selectedImages);
    } catch (err: any) {
      alert(`Images to PDF conversion failed: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleConvertLoadedImagesToPdf = async () => {
    const imageFiles = files.filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f.name || f.extension || ''));
    if (imageFiles.length === 0) {
      alert('No image files currently loaded. Use "Select Images ➔ A4 PDF" to pick images.');
      return;
    }
    setLoadingAction('images_to_pdf');
    try {
      pushNotice(`Converting ${imageFiles.length} loaded image(s) to A4 PDF...`, 'server');
      const fileIds = imageFiles.map((f) => f.id);
      const res = await api.imagesToPdf(fileIds, 'A4', 'contain');
      if (res.file) {
        triggerDirectDownload(api.getDownloadUrl(res.file.file_id), res.file.original_name || 'images_document_A4.pdf');
        pushNotice('Converted images to A4 PDF and downloaded!', 'server');
      }
    } catch (err: any) {
      alert(`Images to PDF conversion failed: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // 0C. PDF to Images (Download PNG / JPG)
  const handlePdfToImages = async (format: 'png' | 'jpg') => {
    if (pages.length === 0) return;
    setLoadingAction(`pdf_to_images_${format}`);
    try {
      pushNotice(`Exporting pages as high-resolution ${format.toUpperCase()} images...`, 'server');
      const fileId = await getEffectiveFileId();
      const res = await api.pdfToImages(fileId, format, 150);
      const fileToDownload = res.zip_file || res.file;
      if (fileToDownload) {
        triggerDirectDownload(api.getDownloadUrl(fileToDownload.file_id), fileToDownload.original_name);
        pushNotice(`Downloaded ${res.image_count || pages.length} pages as ${format.toUpperCase()} images!`, 'server');
      }
    } catch (err: any) {
      alert(`Export to images failed: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDownloadOriginalImage = () => {
    if (files.length > 0) {
      const file = files[0];
      triggerDirectDownload(api.getDownloadUrl(file.id), file.name);
      pushNotice(`Downloaded image ${file.name}`, 'server');
    }
  };

  // 1. Odd Pages Download
  const handleDownloadOdd = async () => {
    const oddPages = pages.filter((_, i) => i % 2 === 0);
    if (oddPages.length === 0) {
      alert('No odd pages available in document.');
      return;
    }
    setLoadingAction('odd');
    try {
      pushNotice(`Generating PDF with ${oddPages.length} odd pages...`, 'server');
      const specs = oddPages.map((p) => ({
        file_id: p.fileId,
        page_number: p.sourcePageNum,
        rotation: p.rotation,
        crop: p.crop,
      }));
      const res = await api.mergePages(specs, `${getBaseName()}_odd.pdf`);
      if (res.file) {
        triggerDirectDownload(api.getDownloadUrl(res.file.file_id), res.file.original_name || 'odd_pages.pdf');
        pushNotice(`Downloaded ${oddPages.length} odd pages as PDF!`, 'server');
      }
    } catch (err: any) {
      alert(`Download odd pages failed: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // 2. Even Pages Download
  const handleDownloadEven = async () => {
    const evenPages = pages.filter((_, i) => i % 2 === 1);
    if (evenPages.length === 0) {
      alert('Document only has 1 page (no even pages to extract).');
      return;
    }
    setLoadingAction('even');
    try {
      pushNotice(`Generating PDF with ${evenPages.length} even pages...`, 'server');
      const specs = evenPages.map((p) => ({
        file_id: p.fileId,
        page_number: p.sourcePageNum,
        rotation: p.rotation,
        crop: p.crop,
      }));
      const res = await api.mergePages(specs, `${getBaseName()}_even.pdf`);
      if (res.file) {
        triggerDirectDownload(api.getDownloadUrl(res.file.file_id), res.file.original_name || 'even_pages.pdf');
        pushNotice(`Downloaded ${evenPages.length} even pages as PDF!`, 'server');
      }
    } catch (err: any) {
      alert(`Download even pages failed: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // 3. Download Both as ZIP
  const handleDownloadBothZip = async () => {
    if (pages.length < 2) {
      alert('Document must have at least 2 pages to separate odd and even.');
      return;
    }
    setLoadingAction('odd_even_zip');
    try {
      pushNotice('Separating odd & even pages into ZIP...', 'server');
      const fileId = await getEffectiveFileId();
      const res = await api.oddEvenSplit(fileId, 'both');
      if (res.zip_file) {
        triggerDirectDownload(api.getDownloadUrl(res.zip_file.file_id), res.zip_file.original_name);
        pushNotice('Downloaded Odd & Even PDFs as ZIP!', 'server');
      } else if (res.files?.odd) {
        triggerDirectDownload(api.getDownloadUrl(res.files.odd.file_id), 'odd_pages.pdf');
      }
    } catch (err: any) {
      alert(`Odd/Even separation failed: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // 4. Compress PDF
  const handleCompress = async (level: string) => {
    if (pages.length === 0) return;
    setLoadingAction(`compress_${level}`);
    try {
      pushNotice(`Compressing PDF with ${level} preset...`, 'server');
      const fileId = await getEffectiveFileId();
      const res = await api.compressPdf(fileId, level);
      if (res.file) {
        triggerDirectDownload(api.getDownloadUrl(res.file.file_id), res.file.original_name || 'compressed_document.pdf');
        const stats = res.compression_stats;
        const msg = stats
          ? `Compressed: saved ${stats.savings_percent}% (${Math.round((stats.original_size - stats.final_size) / 1024)} KB reduction).`
          : 'Compressed PDF downloaded!';
        pushNotice(msg, 'server');
      }
    } catch (err: any) {
      alert(`Compression failed: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // 5. Split Every Page (ZIP)
  const handleSplitEveryPage = async () => {
    if (pages.length === 0) return;
    setLoadingAction('split_every');
    try {
      pushNotice('Splitting document into single pages...', 'server');
      const fileId = await getEffectiveFileId();
      const res = await api.splitPdf({ file_id: fileId, mode: 'every_page' });
      if (res.zip_file) {
        triggerDirectDownload(api.getDownloadUrl(res.zip_file.file_id), res.zip_file.original_name);
        pushNotice(`Split into ${res.count} single-page documents (ZIP downloaded).`, 'server');
      }
    } catch (err: any) {
      alert(`Split failed: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // 6. Split in Half
  const handleSplitHalf = async () => {
    if (pages.length < 2) return;
    setLoadingAction('split_half');
    try {
      pushNotice('Dividing document in half...', 'server');
      const fileId = await getEffectiveFileId();
      const mid = Math.ceil(pages.length / 2);
      const ranges = `1-${mid}, ${mid + 1}-${pages.length}`;
      const res = await api.splitPdf({ file_id: fileId, mode: 'ranges', ranges });
      if (res.zip_file) {
        triggerDirectDownload(api.getDownloadUrl(res.zip_file.file_id), res.zip_file.original_name);
        pushNotice('Split into 2 parts (ZIP downloaded).', 'server');
      }
    } catch (err: any) {
      alert(`Split failed: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // 7. Split by Custom Ranges
  const handleSplitRanges = async (ranges: string) => {
    if (pages.length === 0 || !ranges.trim()) return;
    setLoadingAction('split_ranges');
    try {
      pushNotice(`Splitting by ranges (${ranges})...`, 'server');
      const fileId = await getEffectiveFileId();
      const res = await api.splitPdf({ file_id: fileId, mode: 'ranges', ranges });
      if (res.zip_file) {
        triggerDirectDownload(api.getDownloadUrl(res.zip_file.file_id), res.zip_file.original_name);
        pushNotice(`Split completed into ${res.count} files (ZIP downloaded).`, 'server');
      }
    } catch (err: any) {
      alert(`Split failed: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // 8. Rotate All Pages
  const handleRotateAll = (angle: number) => {
    if (pages.length === 0) return;
    const updated = pages.map((p) => ({
      ...p,
      rotation: (p.rotation + angle) % 360,
    }));
    pushHistory(updated, `Rotated all pages ${angle}°`);
    pushNotice(`Rotated all pages by ${angle}°. Processed locally.`, 'local');
  };

  // 9. Reverse Order
  const handleReverseOrder = () => {
    if (pages.length < 2) return;
    const updated = [...pages].reverse();
    pushHistory(updated, 'Reversed document page order');
    pushNotice('Reversed document page order. Processed locally.', 'local');
  };

  // 10. Extract Selected Pages
  const handleExtractSelected = async () => {
    const selected = pages.filter((p) => p.selected);
    if (selected.length === 0) {
      alert('Click on pages above to select which pages to extract.');
      return;
    }
    setLoadingAction('extract');
    try {
      pushNotice(`Extracting ${selected.length} selected pages...`, 'server');
      const specs = selected.map((p) => ({
        file_id: p.fileId,
        page_number: p.sourcePageNum,
        rotation: p.rotation,
        crop: p.crop,
      }));
      const res = await api.mergePages(specs, `${getBaseName()}_extracted.pdf`);
      if (res.file) {
        triggerDirectDownload(api.getDownloadUrl(res.file.file_id), res.file.original_name || 'extracted_pages.pdf');
        pushNotice(`Extracted ${selected.length} pages as PDF!`, 'server');
      }
    } catch (err: any) {
      alert(`Extraction failed: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // 11. Extract by Ranges
  const handleExtractRanges = async (rangesStr: string) => {
    if (pages.length === 0 || !rangesStr.trim()) return;
    setLoadingAction('extract');
    try {
      // Parse ranges like "1-3, 5" into 1-indexed page indices
      const indices = new Set<number>();
      for (const part of rangesStr.split(',')) {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
          const [s, e] = trimmed.split('-').map((n) => parseInt(n.trim()));
          if (!isNaN(s) && !isNaN(e)) {
            for (let i = Math.min(s, e); i <= Math.max(s, e); i++) {
              if (i >= 1 && i <= pages.length) indices.add(i);
            }
          }
        } else {
          const num = parseInt(trimmed);
          if (!isNaN(num) && num >= 1 && num <= pages.length) {
            indices.add(num);
          }
        }
      }

      if (indices.size === 0) {
        alert('Invalid page range entered.');
        return;
      }

      const selectedPages = pages.filter((_, idx) => indices.has(idx + 1));
      const specs = selectedPages.map((p) => ({
        file_id: p.fileId,
        page_number: p.sourcePageNum,
        rotation: p.rotation,
        crop: p.crop,
      }));

      pushNotice(`Extracting ${selectedPages.length} pages (${rangesStr})...`, 'server');
      const res = await api.mergePages(specs, `${getBaseName()}_range.pdf`);
      if (res.file) {
        triggerDirectDownload(api.getDownloadUrl(res.file.file_id), res.file.original_name || 'extracted_range.pdf');
        pushNotice(`Extracted ${selectedPages.length} pages as PDF!`, 'server');
      }
    } catch (err: any) {
      alert(`Extraction failed: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // 12. Apply Watermark
  const handleApplyWatermark = async (text: string) => {
    if (pages.length === 0 || !text.trim()) return;
    setLoadingAction('watermark');
    try {
      pushNotice('Applying watermark...', 'server');
      const fileId = await getEffectiveFileId();
      const res = await api.watermarkPdf({
        file_id: fileId,
        text,
        font_size: 44,
        opacity: 0.3,
        rotation: 45,
        color: '#e11d48',
        position: 'center',
      });
      if (res.file) {
        triggerDirectDownload(api.getDownloadUrl(res.file.file_id), res.file.original_name || 'watermarked.pdf');
        pushNotice('Watermarked PDF downloaded!', 'server');
      }
    } catch (err: any) {
      alert(`Watermark failed: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // 13. Apply Page Numbers
  const handleApplyPageNumbers = async (position: string) => {
    if (pages.length === 0) return;
    setLoadingAction('numbers');
    try {
      pushNotice('Applying page numbering...', 'server');
      const fileId = await getEffectiveFileId();
      const res = await api.pageNumbersPdf({
        file_id: fileId,
        format: 'Page {n} of {total}',
        position,
        start_number: 1,
        skip_first: false,
        font_size: 10,
      });
      if (res.file) {
        triggerDirectDownload(api.getDownloadUrl(res.file.file_id), res.file.original_name || 'numbered.pdf');
        pushNotice('Numbered PDF downloaded!', 'server');
      }
    } catch (err: any) {
      alert(`Page numbering failed: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // 14. Convert DOCX / PDF
  const handleConvertDocx = async () => {
    if (files.length === 0) return;
    setLoadingAction('docx');
    try {
      const targetFile = files[0];
      if (targetFile.extension === '.docx') {
        pushNotice('Converting DOCX to PDF with LibreOffice...', 'server');
        const res = await api.docxToPdf(targetFile.id);
        if (res.file) {
          triggerDirectDownload(api.getDownloadUrl(res.file.file_id), res.file.original_name || 'converted.pdf');
          pushNotice('DOCX converted to PDF and downloaded!', 'server');
        }
      } else {
        pushNotice('Converting PDF to Word DOCX...', 'server');
        const fileId = await getEffectiveFileId();
        const res = await api.pdfToDocx(fileId);
        if (res.file) {
          triggerDirectDownload(api.getDownloadUrl(res.file.file_id), res.file.original_name || 'converted.docx');
          pushNotice('PDF converted to Word DOCX and downloaded!', 'server');
        }
      }
    } catch (err: any) {
      alert(`Conversion failed: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // 15. Detect and Remove Blank Pages
  const handleDetectAndRemoveBlanks = async () => {
    if (pages.length === 0) return;
    setLoadingAction('blanks');
    try {
      pushNotice('Scanning document for blank pages...', 'server');
      const fileId = await getEffectiveFileId();
      const res = await api.detectBlankPages(fileId);
      const blanks: number[] = res.blank_pages || [];
      if (blanks.length === 0) {
        pushNotice('Scan complete: No blank pages found in document.', 'server');
      } else {
        const blankSet = new Set(blanks);
        const updated = pages.filter((_, i) => !blankSet.has(i + 1));
        pushHistory(updated, `Removed ${blanks.length} blank page(s)`);
        pushNotice(`Removed ${blanks.length} blank page(s). Click Undo to restore.`, 'local');
      }
    } catch (err: any) {
      alert(`Blank page check failed: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // 16. Export Complete Document as PDF
  const handleExportMerge = async () => {
    if (pages.length === 0) return;
    setLoadingAction('export');
    try {
      pushNotice('Exporting complete document...', 'server');
      const specs = pages.map((p) => ({
        file_id: p.fileId,
        page_number: p.sourcePageNum,
        rotation: p.rotation,
        crop: p.crop,
      }));
      const res = await api.mergePages(specs, `${getBaseName()}_docforge.pdf`);
      if (res.file) {
        triggerDirectDownload(api.getDownloadUrl(res.file.file_id), res.file.original_name || 'document.pdf');
        pushNotice('Complete PDF document downloaded!', 'server');
      }
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // Page Card Operations
  const handleToggleSelectPage = (id: string, shiftKey: boolean) => {
    setPages((curr) =>
      curr.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
  };

  const handleRotateSinglePage = (id: string, delta: number) => {
    const updated = pages.map((p) =>
      p.id === id ? { ...p, rotation: (p.rotation + delta) % 360 } : p
    );
    pushHistory(updated, `Rotated page ${delta}°`);
  };

  const handleDeleteSinglePage = (id: string) => {
    const updated = pages.filter((p) => p.id !== id);
    pushHistory(updated, 'Deleted page');
    pushNotice('Deleted page. Click Undo to restore.', 'local');
  };

  const handleDuplicateSinglePage = (id: string) => {
    const idx = pages.findIndex((p) => p.id === id);
    if (idx >= 0) {
      const src = pages[idx];
      const dup: PageModel = {
        ...src,
        id: `${src.fileId}_dup_${Math.random().toString(36).substring(2, 7)}`,
        selected: false,
      };
      const updated = [...pages.slice(0, idx + 1), dup, ...pages.slice(idx + 1)];
      pushHistory(updated, 'Duplicated page');
    }
  };

  const handleReorderPages = (fromIndex: number, toIndex: number) => {
    const updated = [...pages];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    pushHistory(updated, `Moved page ${fromIndex + 1} → ${toIndex + 1}`);
  };

  // Full-window file drop handling
  const handleWindowDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      setIsDraggingFiles(true);
    }
  };

  const handleWindowDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingFiles(false);
  };

  const handleWindowDrop = (e: React.DragEvent) => {
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      e.preventDefault();
      setIsDraggingFiles(false);
      handleFilesAdded(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesAdded(Array.from(e.target.files));
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      onDragOver={handleWindowDragOver}
      onDragLeave={handleWindowDragLeave}
      onDrop={handleWindowDrop}
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white"
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
        ref={mergePdfsInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleMergePdfsFilesSelected(Array.from(e.target.files));
          }
        }}
        multiple
        accept=".pdf"
        className="hidden"
      />
      <input
        type="file"
        ref={imagesToPdfInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleImagesToPdfFilesSelected(Array.from(e.target.files));
          }
        }}
        multiple
        accept="image/*,.jpg,.jpeg,.png,.webp"
        className="hidden"
      />
      <input
        type="file"
        ref={pdfToImagesInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFilesAdded(Array.from(e.target.files));
          }
        }}
        accept=".pdf"
        className="hidden"
      />

      {/* External File Drop Overlay */}
      {isDraggingFiles && (
        <div className="fixed inset-0 z-50 bg-brand-600/90 backdrop-blur-sm flex flex-col items-center justify-center text-white pointer-events-none animate-fade-in">
          <div className="p-8 rounded-3xl bg-white/10 border-2 border-dashed border-white/60 flex flex-col items-center gap-3">
            <UploadCloud className="w-14 h-14 stroke-[2.2] animate-bounce" />
            <p className="text-2xl font-bold">Drop files to open in DocForge</p>
            <p className="text-xs text-brand-100">Supports PDF, DOCX, JPG, PNG, WEBP</p>
          </div>
        </div>
      )}

      {/* Authentication Gateway */}
      {!isAuthenticated && (
        <UnlockModal
          setupRequired={setupRequired}
          onUnlocked={handleUnlocked}
        />
      )}

      {/* Minimal Header */}
      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-xs">
              <FileText className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-base text-slate-900 dark:text-white">
                DOCFORGE
              </span>
              <span className="ml-1.5 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400">
                Personal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleLock}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Lock DocForge"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Single-Page Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-4 py-5 sm:py-6 space-y-6">
        
        {/* TOP: DOCUMENT UPLOAD & PREVIEW SECTION */}
        {pages.length === 0 ? (
          <div className="space-y-4">
            {/* 1-Click Direct Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Quick Card 1: Merge Multiple PDFs */}
              <div
                onClick={handleMergePdfsPrompt}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Layers className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      Merge PDFs
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Select 2 or more PDF files and combine them in order with 1 click.
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                    Instant Download
                  </span>
                  <span className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-xs group-hover:bg-indigo-700 transition-colors">
                    + Select PDFs to Merge
                  </span>
                </div>
              </div>

              {/* Quick Card 2: Images to A4 PDF */}
              <div
                onClick={handleImagesToPdfPrompt}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ImageIcon className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      Images ➔ A4 PDF
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Convert JPG, PNG, WEBP auto-fitted into standard A4 pages with zero distortion.
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Auto-Fit Contain
                  </span>
                  <span className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs group-hover:bg-emerald-700 transition-colors">
                    + Select Images ➔ A4 PDF
                  </span>
                </div>
              </div>
            </div>

            {/* General Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 rounded-3xl p-8 sm:p-12 bg-white dark:bg-slate-900/60 transition-all text-center flex flex-col items-center justify-center cursor-pointer shadow-xs hover:shadow-md group"
            >
              <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <UploadCloud className="w-7 h-7 stroke-[2.2]" />
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-1">
                Open Any Document
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mb-5">
                Drop any PDF, Word (DOCX), or image to open the complete document toolbox.
              </p>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-6 py-2.5 rounded-2xl bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-500/25 flex items-center gap-2 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Choose Document to Begin</span>
              </button>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Supported:</span>
                {['PDF', 'DOCX', 'JPG', 'PNG', 'WEBP'].map((fmt) => (
                  <span key={fmt} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[10px]">
                    {fmt}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
            {/* Document Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate" title={files[0]?.name}>
                    {files[0]?.name || 'Uploaded Document'}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    {pages.length} {pages.length === 1 ? 'page' : 'pages'}
                    {files[0]?.sizeBytes && ` • ${Math.round(files[0].sizeBytes / 1024)} KB`}
                    {files.length > 1 && ` • ${files.length} files combined`}
                  </p>
                </div>
              </div>

              {/* Document actions: Add more files, Undo/Redo, Toggle view, Clear */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Add another file to this document"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add File</span>
                </button>

                <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl">
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    title="Undo (Ctrl+Z)"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    title="Redo (Ctrl+Shift+Z)"
                  >
                    <Redo2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowThumbnails(!showThumbnails)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Pages</span>
                  {showThumbnails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={handleClearDocument}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                  title="Clear document and upload another"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Collapsible Page Thumbnails Ribbon */}
            {showThumbnails && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>Page Cards (click to select, drag to reorder):</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPages((curr) => curr.map((p) => ({ ...p, selected: true })))}
                      className="hover:text-brand-500 underline"
                    >
                      Select All
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setPages((curr) => curr.map((p) => ({ ...p, selected: false })))}
                      className="hover:text-brand-500 underline"
                    >
                      Deselect
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-72 overflow-y-auto p-1 rounded-2xl bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80">
                  {pages.map((page, idx) => (
                    <PageCard
                      key={page.id}
                      page={page}
                      index={idx}
                      onToggleSelect={handleToggleSelectPage}
                      onRotateCW={() => handleRotateSinglePage(page.id, 90)}
                      onRotateCCW={() => handleRotateSinglePage(page.id, 270)}
                      onDelete={() => handleDeleteSinglePage(page.id)}
                      onDuplicate={() => handleDuplicateSinglePage(page.id)}
                      onDragStart={(e, i) => {
                        e.dataTransfer.setData('text/plain', i.toString());
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e, targetIdx) => {
                        e.preventDefault();
                        const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
                        if (!isNaN(fromIdx) && fromIdx !== targetIdx) {
                          handleReorderPages(fromIdx, targetIdx);
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* BOTTOM: THE OPERATIONS LIST (ONE AFTER THE OTHER, WITH FUNCTION-SPECIFIC BUTTONS) */}
        {pages.length > 0 && (
          <OperationsList
            pages={pages}
            files={files}
            loadingAction={loadingAction}
            onDownloadOdd={handleDownloadOdd}
            onDownloadEven={handleDownloadEven}
            onDownloadBothZip={handleDownloadBothZip}
            onSelectOdd={() => setPages((curr) => curr.map((p, i) => ({ ...p, selected: i % 2 === 0 })))}
            onSelectEven={() => setPages((curr) => curr.map((p, i) => ({ ...p, selected: i % 2 === 1 })))}
            onCompress={handleCompress}
            onSplitEveryPage={handleSplitEveryPage}
            onSplitHalf={handleSplitHalf}
            onSplitRanges={handleSplitRanges}
            onRotateAll={handleRotateAll}
            onReverseOrder={handleReverseOrder}
            onExtractSelected={handleExtractSelected}
            onExtractRanges={handleExtractRanges}
            onApplyWatermark={handleApplyWatermark}
            onApplyPageNumbers={handleApplyPageNumbers}
            onConvertDocx={handleConvertDocx}
            onDetectAndRemoveBlanks={handleDetectAndRemoveBlanks}
            onExportMerge={handleExportMerge}
            onMergePdfsPrompt={handleMergePdfsPrompt}
            onMergeCurrentPdfs={handleMergeCurrentPdfs}
            onImagesToPdfPrompt={handleImagesToPdfPrompt}
            onConvertLoadedImagesToPdf={handleConvertLoadedImagesToPdf}
            onPdfToImages={handlePdfToImages}
            onDownloadOriginalImage={handleDownloadOriginalImage}
          />
        )}
      </main>

      {/* Discreet Toast Notification with Undo */}
      <PrivacyBadge
        notice={notice}
        onDismiss={() => setNotice(null)}
        onUndo={handleUndo}
      />
    </div>
  );
};
export default App;
