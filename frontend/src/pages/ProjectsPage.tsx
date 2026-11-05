import React, { useState, useEffect } from 'react';
import { FolderKanban, Plus, Clock, Trash2, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

interface ProjectsPageProps {
  onLoadProject: (projectData: any) => void;
  onNewProject: () => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ onLoadProject, onNewProject }) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProjectsList();
  }, []);

  const loadProjectsList = async () => {
    setLoading(true);
    try {
      const res = await api.listProjects();
      setProjects(res.projects || []);
    } catch {
      // Offline fallback
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = async (id: string) => {
    try {
      const res = await api.getProject(id);
      onLoadProject(res.project);
    } catch (err: any) {
      alert(`Failed to load project: ${err.message}`);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this saved project?')) return;
    try {
      await api.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Recent';
    return new Date(timestamp * 1000).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Saved Projects</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cross-device document projects synchronized to your private DocForge server.
          </p>
        </div>
        <button
          onClick={onNewProject}
          className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-md shadow-brand-500/20 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <FolderKanban className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No saved projects yet.</p>
          <p className="text-xs text-slate-400">
            Open the workspace and click &quot;Save Project&quot; to save your document collection for access on other devices.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {projects.map((p) => (
            <div
              key={p.id}
              onClick={() => handleOpen(p.id)}
              className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 cursor-pointer transition-all hover:shadow-sm flex items-center justify-between group"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm text-slate-900 dark:text-white truncate">{p.name}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                  <span>{p.page_count} pages</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(p.updated_at)}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleDelete(e, p.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  title="Delete project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
