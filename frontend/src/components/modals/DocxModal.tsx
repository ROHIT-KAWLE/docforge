import React, { useState } from 'react';
import { X, FileCode2, ArrowRight, AlertTriangle, CheckCircle, Download } from 'lucide-react';
import { api } from '../../services/api';
import { triggerDirectDownload } from '../../utils/downloadHelper';

interface DocxModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: string;
  fileName: string;
  isDocx: boolean;
  onConverted: (newFile: any) => void;
}

export const DocxModal: React.FC<DocxModalProps> = ({
  isOpen,
  onClose,
  fileId,
  fileName,
  isDocx,
  onConverted,
}) => {
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConvert = async () => {
    setLoading(true);
    setNotice(null);
    try {
      if (isDocx) {
        const res = await api.docxToPdf(fileId);
        if (res.file) {
          triggerDirectDownload(api.getDownloadUrl(res.file.file_id), res.file.original_name);
          onConverted(res.file);
          setNotice('DOCX converted to PDF and downloaded successfully!');
        }
      } else {
        const res = await api.pdfToDocx(fileId);
        if (res.file) {
          triggerDirectDownload(api.getDownloadUrl(res.file.file_id), res.file.original_name);
          onConverted(res.file);
          setNotice(res.notice || 'Converted PDF to Word DOCX and downloaded!');
        }
      }
    } catch (err: any) {
      alert(`Conversion failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <FileCode2 className="w-5 h-5 text-brand-500" />
            <span>{isDocx ? 'Convert Word (DOCX) to PDF' : 'Convert PDF to Word (DOCX)'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Target Document</span>
            <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate mt-0.5">{fileName}</p>
          </div>

          {isDocx ? (
            <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-2xl text-brand-900 dark:text-brand-200 flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">LibreOffice Headless Engine</p>
                <p className="mt-0.5 text-[11px] opacity-90 leading-relaxed">
                  Your Word DOCX will be rendered into a standardized PDF with exact fonts, table formatting, and margins preserved.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Best-Effort Conversion Notice</p>
                <p className="mt-0.5 text-[11px] opacity-90 leading-relaxed">
                  PDF documents have fixed coordinate boxes. Layouts with multi-column text and tables may reflow when converted to editable Word DOCX.
                </p>
              </div>
            </div>
          )}

          {notice && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs font-semibold">
              {notice}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleConvert}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-bold text-xs shadow-md shadow-brand-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isDocx ? 'Convert to PDF & Download' : 'Convert to DOCX & Download'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
