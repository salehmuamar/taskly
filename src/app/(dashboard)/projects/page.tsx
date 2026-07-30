'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, FolderKanban, Users, CheckSquare, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { apiClient } from '@/shared/lib/api-client';
import { statusBadgeStyles } from '@/shared/lib/constants';
import { useI18n } from '@/i18n';
import { useToast } from '@/shared/ui/toast';
import { ProjectsSkeleton } from '@/shared/ui/skeleton';
import type { Project } from '@/shared/types';

export default function ProjectsPage() {
  const { t } = useI18n();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => { document.title = `${t('projects.title')} | Taskly`; }, []);
  useEffect(() => {
    async function fetchProjects() {
      try { const response = await apiClient.get<{ data: Project[] }>('/api/projects'); setProjects(response.data); }
      catch { setProjects([]); toast(t('projects.failedToLoad')); }
      finally { setIsLoading(false); }
    }
    fetchProjects();
  }, [toast]);

  async function handleDelete(e: React.MouseEvent, projectId: string) {
    e.preventDefault(); e.stopPropagation();
    if (!confirm(t('projects.deleteConfirm'))) return;
    setDeletingId(projectId);
      try { await apiClient.delete(`/api/projects/${projectId}`); setProjects((prev) => prev.filter((p) => p.id !== projectId)); toast(t('projects.deleted'), 'success'); }
      catch { toast(t('projects.failedToDelete')); }
    finally { setDeletingId(null); }
  }

  if (isLoading) {
    return <ProjectsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{t('projects.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-300">{t('projects.subtitle')}</p>
        </div>
        <Link href="/projects/new"><Button><Plus className="mr-2 h-4 w-4" /> {t('projects.create')}</Button></Link>
      </div>

      {projects.length === 0 ? (
        <Card><CardContent className="py-12"><div className="text-center">
          <FolderKanban className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" aria-hidden="true" />
          <h3 className="mt-4 text-lg font-medium text-slate-800 dark:text-white">{t('projects.noProjects')}</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{t('projects.createFirst')}</p>
          <Link href="/projects/new" className="mt-4 inline-block"><Button><Plus className="mr-2 h-4 w-4" /> {t('projects.createProject')}</Button></Link>
        </div></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-0.5 cursor-pointer relative group glow-border">
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg" style={{ backgroundColor: project.color }}>
                        {project.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-white">{project.name}</h3>
                        {(() => {
                          const s = statusBadgeStyles[project.status] || { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8' };
                          return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: s.bg, color: s.text }}>{t('status.' + project.status)}</span>;
                        })()}
                      </div>
                    </div>
                    <button onClick={(e) => handleDelete(e, project.id)} disabled={deletingId === project.id} aria-label={t('common.delete')} className="opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-xl text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {project.description && <p className="mt-3 text-sm text-slate-500 dark:text-slate-300 line-clamp-2">{project.description}</p>}
                  <div className="mt-4 flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-4">
                    <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-300">
                      <span className="flex items-center gap-1"><CheckSquare className="h-4 w-4" /> {project._count.tasks} {t('projects.tasksCount')}</span>
                      <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {project.members.length} {t('projects.membersCount')}</span>
                    </div>
                    {project.members.length > 0 && (
                      <div className="flex -space-x-2">
                        {project.members.slice(0, 3).map((member) => (
                          <div key={member.user.id} className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 border-2 border-white dark:border-slate-900 flex items-center justify-center text-xs font-bold text-white" aria-label={member.user.name || 'User'}>
                            {member.user.name?.charAt(0) || '?'}
                          </div>
                        ))}
                        {project.members.length > 3 && <div className="h-6 w-6 rounded-full glass border-2 border-white dark:border-slate-900 flex items-center justify-center text-xs font-bold text-slate-400">+{project.members.length - 3}</div>}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
