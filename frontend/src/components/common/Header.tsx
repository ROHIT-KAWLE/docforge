import React from 'react';
import { FileText, Sun, Moon, Lock, LayoutGrid, Wrench, FolderKanban, Settings } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  pageCount: number;
  darkMode: boolean;
  onToggleTheme: () => void;
  onLock: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  pageCount,
  darkMode,
  onToggleTheme,
  onLock,
  onOpenSettings,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div 
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-lg text-slate-900 dark:text-white">DOCFORGE</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400">
                Personal
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">Universal Document Toolbox</p>
          </div>
        </div>

        {/* Navigation Tabs (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
          <button
            onClick={() => onSelectTab('home')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              currentTab === 'home'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onSelectTab('workspace')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              currentTab === 'workspace'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Workspace</span>
            {pageCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-xs bg-brand-500 text-white font-semibold">
                {pageCount}
              </span>
            )}
          </button>
          <button
            onClick={() => onSelectTab('tools')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              currentTab === 'tools'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tools
          </button>
          <button
            onClick={() => onSelectTab('projects')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              currentTab === 'projects'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Projects
          </button>
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Settings & Storage"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          <button
            onClick={onLock}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors"
            title="Lock toolbox"
            aria-label="Lock application"
          >
            <Lock className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
