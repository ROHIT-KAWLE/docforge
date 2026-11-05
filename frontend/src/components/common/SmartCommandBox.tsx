import React, { useState } from 'react';
import { Sparkles, ArrowRight, CornerDownLeft } from 'lucide-react';
import { parseSmartCommand } from '../../utils/commandParser';
import { CommandParseResult } from '../../types';

interface SmartCommandBoxProps {
  totalPages: number;
  onExecuteCommand: (result: CommandParseResult) => void;
}

export const SmartCommandBox: React.FC<SmartCommandBoxProps> = ({ totalPages, onExecuteCommand }) => {
  const [query, setQuery] = useState('');
  const parseResult = parseSmartCommand(query, totalPages);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseResult) {
      onExecuteCommand(parseResult);
      setQuery('');
    }
  };

  const handleApplySuggestion = (text: string) => {
    setQuery(text);
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 transition-all">
      <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
        <div className="absolute left-3.5 text-brand-500">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='What do you want to do? (e.g. "Separate odd and even", "Rotate pages 1-3", "Remove blank pages")'
          className="w-full pl-11 pr-24 py-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 border border-transparent dark:border-slate-700/60 transition-all"
        />

        <button
          type="submit"
          disabled={!parseResult}
          className={`absolute right-2 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            parseResult
              ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30 hover:bg-brand-600'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span>Run</span>
          <CornerDownLeft className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Real-time Parsed Command Preview */}
      {parseResult && (
        <div className="mt-2.5 px-3 py-2 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/50 flex items-center justify-between text-xs text-brand-900 dark:text-brand-200 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="font-semibold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-brand-500 text-white">
              {parseResult.action}
            </span>
            <span>{parseResult.description}</span>
          </div>
          <span className="text-brand-600 dark:text-brand-400 font-mono text-[11px]">Press Enter ↵</span>
        </div>
      )}

      {/* Suggestion Chips */}
      {!query && (
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 text-xs text-slate-500 no-scrollbar">
          <span className="text-[11px] font-medium text-slate-400 shrink-0">Try:</span>
          {[
            'Separate odd and even pages',
            'Delete pages 1 and 3',
            'Rotate clockwise',
            'Remove blank pages',
            'Compress this PDF',
            'Add page numbers'
          ].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleApplySuggestion(s)}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
