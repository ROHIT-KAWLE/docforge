import React, { useState } from 'react';
import { X, Search, Copy, Download, Check, FileText } from 'lucide-react';
import { api } from '../../services/api';
import { downloadBlob } from '../../services/localPdfEngine';

interface OcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: string;
  fileName: string;
}

export const OcrModal: React.FC<OcrModalProps> = ({ isOpen, onClose, fileId, fileName }) => {
  const [activeTab, setActiveTab] = useState<'extract' | 'search' | 'searchable'>('extract');
  const [extractedText, setExtractedText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  if (!isOpen) return null;

  const handleExtractText = async () => {
    setLoading(true);
    try {
      const res = await api.extractText(fileId);
      setExtractedText(res.data.full_text);
    } catch (err: any) {
      alert(`Text extraction failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await api.searchDocument(fileId, searchQuery);
      setSearchResults(res.pages_with_matches || []);
    } catch (err: any) {
      alert(`Search failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSearchable = async () => {
    setLoading(true);
    try {
      const res = await api.runOcr({ file_id: fileId, language: 'eng', output_format: 'searchable_pdf' });
      if (res.file) {
        window.open(api.getDownloadUrl(res.file.file_id), '_blank');
      }
    } catch (err: any) {
      alert(`OCR failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const txtName = fileName.replace(/\.[^/.]+$/, '') + '_extracted.txt';
    downloadBlob(blob, txtName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <Search className="w-5 h-5 text-brand-500" />
            <span>OCR & Text Tools</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-2 my-3 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('extract')}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              activeTab === 'extract' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
            }`}
          >
            Extract Text
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              activeTab === 'search' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
            }`}
          >
            Search Inside
          </button>
          <button
            onClick={() => setActiveTab('searchable')}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              activeTab === 'searchable' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
            }`}
          >
            Searchable PDF
          </button>
        </div>

        {/* Tab 1: Extract Text */}
        {activeTab === 'extract' && (
          <div className="flex-1 overflow-hidden flex flex-col space-y-3">
            {!extractedText && (
              <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
                <FileText className="w-10 h-10 text-slate-400 mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Extract all text from document</p>
                <p className="text-xs text-slate-400 mt-1 mb-4">Reads all digital and embedded text layers across every page.</p>
                <button
                  onClick={handleExtractText}
                  disabled={loading}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-500/20"
                >
                  {loading ? 'Extracting...' : 'Start Extraction'}
                </button>
              </div>
            )}

            {extractedText && (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">Extracted Text</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 flex items-center gap-1 font-medium"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={handleDownloadTxt}
                      className="px-2.5 py-1 rounded-lg bg-brand-500 hover:bg-brand-600 text-white flex items-center gap-1 font-medium"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download TXT</span>
                    </button>
                  </div>
                </div>

                <textarea
                  readOnly
                  value={extractedText}
                  className="flex-1 w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 resize-none focus:outline-none"
                />
              </>
            )}
          </div>
        )}

        {/* Tab 2: Search */}
        {activeTab === 'search' && (
          <div className="flex-1 overflow-hidden flex flex-col space-y-3">
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search word or phrase..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
              <button
                type="submit"
                disabled={loading || !searchQuery.trim()}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-xl shadow"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-2 p-1 no-scrollbar">
              {searchResults.length === 0 && searchQuery && !loading && (
                <div className="text-center py-8 text-xs text-slate-400">No matches found for &quot;{searchQuery}&quot;.</div>
              )}
              {searchResults.map((m, i) => (
                <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="flex items-center justify-between font-semibold text-brand-600 dark:text-brand-400 mb-1">
                    <span>Page {m.page_number}</span>
                    <span className="text-[11px] font-mono text-slate-400">{m.occurrences} match(es)</span>
                  </div>
                  <div className="space-y-1 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    {m.snippets?.map((sn: string, j: number) => (
                      <p key={j} className="bg-white dark:bg-slate-900 p-1.5 rounded border border-slate-100 dark:border-slate-800">
                        ...{sn}...
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Searchable PDF */}
        {activeTab === 'searchable' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Convert Scanned PDF to Searchable PDF</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
              Uses local OCR to embed an invisible, selectable text layer directly on top of scanned image pages.
            </p>
            <button
              onClick={handleCreateSearchable}
              disabled={loading}
              className="mt-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20"
            >
              {loading ? 'Processing OCR...' : 'Generate Searchable PDF'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
