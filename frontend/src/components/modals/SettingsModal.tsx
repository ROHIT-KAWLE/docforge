import React, { useState, useEffect } from 'react';
import { X, Settings, HardDrive, Trash2, Shield, KeyRound, Cpu, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  onToggleTheme,
}) => {
  const [stats, setStats] = useState<any>(null);
  const [caps, setCaps] = useState<any>(null);
  const [cleaning, setCleaning] = useState(false);
  const [cleanMsg, setCleanMsg] = useState<string | null>(null);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSystemData();
    }
  }, [isOpen]);

  const loadSystemData = async () => {
    try {
      const [statsRes, capsRes] = await Promise.all([
        api.getStorageStats(),
        api.getCapabilities(),
      ]);
      setStats(statsRes.storage);
      setCaps(capsRes);
    } catch {
      // Ignored if offline/local
    }
  };

  const handleCleanup = async () => {
    setCleaning(true);
    setCleanMsg(null);
    try {
      const res = await api.cleanupStorage(true);
      setStats(res.new_storage_stats);
      setCleanMsg(`Removed ${res.files_removed} temporary files.`);
    } catch (err: any) {
      alert(`Cleanup failed: ${err.message}`);
    } finally {
      setCleaning(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    setPwError(null);
    try {
      if (newPw.length < 6) {
        throw new Error('New password must be at least 6 characters.');
      }
      await api.changePassword(currentPw, newPw);
      setPwMsg('Master password updated successfully.');
      setCurrentPw('');
      setNewPw('');
    } catch (err: any) {
      setPwError(err.message || 'Failed to change password.');
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <Settings className="w-5 h-5 text-brand-500" />
            <span>Settings & Storage Management</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-5 overflow-y-auto no-scrollbar text-xs">
          {/* Storage Cleanup Section (Requirement 68) */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                <HardDrive className="w-4 h-4 text-brand-500" />
                <span>Storage Footprint</span>
              </div>
              <button
                onClick={handleCleanup}
                disabled={cleaning}
                className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-red-500 hover:text-white transition-colors font-semibold flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{cleaning ? 'Cleaning...' : 'Clear Temporary Files'}</span>
              </button>
            </div>

            {stats && (
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono">Uploads</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{formatBytes(stats.uploads?.bytes)}</p>
                  <span className="text-[10px] text-slate-400">{stats.uploads?.files || 0} files</span>
                </div>
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono">Processed</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{formatBytes(stats.processed?.bytes)}</p>
                  <span className="text-[10px] text-slate-400">{stats.processed?.files || 0} files</span>
                </div>
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono">Temp / Cache</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{formatBytes(stats.temp?.bytes)}</p>
                  <span className="text-[10px] text-slate-400">{stats.temp?.files || 0} files</span>
                </div>
              </div>
            )}

            {cleanMsg && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{cleanMsg}</p>
            )}
          </div>

          {/* Capabilities */}
          {caps && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm mb-2">
                <Cpu className="w-4 h-4 text-brand-500" />
                <span>Backend Processing Engines</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <span>LibreOffice Headless:</span>
                  <span className={`font-semibold flex items-center gap-1 ${caps.libreoffice_available ? 'text-emerald-500' : 'text-slate-400'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Enabled</span>
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <span>PyMuPDF Engine:</span>
                  <span className="font-mono text-brand-500 font-semibold">{caps.pymupdf_version || '2.0'}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <span>Local OCR Engine:</span>
                  <span className="text-emerald-500 font-semibold">Tesseract OCR</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <span>In-Browser WASM:</span>
                  <span className="text-emerald-500 font-semibold">pdf-lib</span>
                </div>
              </div>
            </div>
          )}

          {/* Master Password Change */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
              <KeyRound className="w-4 h-4 text-brand-500" />
              <span>Change Master Password</span>
            </div>

            {pwMsg && <p className="text-emerald-600 dark:text-emerald-400 font-medium">{pwMsg}</p>}
            {pwError && <p className="text-red-500 font-medium">{pwError}</p>}

            <form onSubmit={handleChangePassword} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="password"
                  placeholder="Current Password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
                <input
                  type="password"
                  placeholder="New Password (min 6 chars)"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
              <button
                type="submit"
                disabled={!currentPw || !newPw}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 text-white rounded-xl font-semibold disabled:opacity-50"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white shadow-md shadow-brand-500/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
