'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Target, Calendar, Play, CheckCircle2, Trash2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Modal } from '@/shared/ui/modal';
import { apiClient } from '@/shared/lib/api-client';
import { Skeleton } from '@/shared/ui/skeleton';
import { useI18n } from '@/i18n';

interface SprintTask {
  id: string;
  order: number;
  task: {
    id: string;
    title: string;
    status: string;
    priority: string;
    assignee: { id: string; name: string; image: string | null } | null;
  };
}

interface Sprint {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startDate: string;
  endDate: string;
  tasks: SprintTask[];
  _count: { tasks: number };
}

export default function SprintsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { t } = useI18n();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    apiClient.get<{ data: Sprint[] }>(`/api/projects/${projectId}/sprints`)
      .then((res) => setSprints(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [projectId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await apiClient.post<{ data: Sprint }>(`/api/projects/${projectId}/sprints`, {
        name, description: description || undefined, startDate, endDate,
      });
      setSprints((prev) => [res.data, ...prev]);
      setShowCreate(false);
      setName(''); setDescription(''); setStartDate(''); setEndDate('');
    } catch { /* empty */ }
    finally { setIsCreating(false); }
  }

  async function handleUpdateStatus(sprintId: string, status: string) {
    try {
      const res = await apiClient.patch<{ data: Sprint }>(`/api/projects/${projectId}/sprints/${sprintId}`, { status });
      setSprints((prev) => prev.map((s) => (s.id === sprintId ? { ...s, ...res.data } : s)));
    } catch { /* empty */ }
  }

  async function handleDeleteSprint(sprintId: string) {
    if (!confirm(t('sprints.deleteConfirm'))) return;
    try {
      await apiClient.delete(`/api/projects/${projectId}/sprints/${sprintId}`);
      setSprints((prev) => prev.filter((s) => s.id !== sprintId));
    } catch { /* empty */ }
  }

  const statusStyle: Record<string, { className: string; label: string }> = {
    PLANNING: { className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', label: t('sprints.status.PLANNING') },
    ACTIVE: { className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300', label: t('sprints.status.ACTIVE') },
    COMPLETED: { className: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300', label: t('sprints.status.COMPLETED') },
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href={`/projects/${projectId}`} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <ArrowLeft className="h-5 w-5 text-slate-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{t('sprints.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{t('sprints.subtitle')}</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" /> {t('sprints.create')}</Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
      ) : sprints.length === 0 ? (
        <div className="text-center py-20 glass rounded-2xl">
          <Target className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300">{t('sprints.noSprints')}</h3>
          <p className="text-slate-400 mt-1">{t('sprints.createFirst')}</p>
          <Button className="mt-6" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" /> {t('sprints.create')}</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sprints.map((sprint) => {
            const isActive = sprint.startDate <= today && sprint.endDate >= today && sprint.status === 'ACTIVE';
            const ss = statusStyle[sprint.status] || statusStyle.PLANNING;
            return (
              <div key={sprint.id} className={`glass rounded-2xl p-6 transition-all ${isActive ? 'ring-2 ring-indigo-500/30' : ''}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{sprint.name}</h3>
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${ss.className}`}>{ss.label}</span>
                    </div>
                    {sprint.description && <p className="text-sm text-slate-500 dark:text-slate-400">{sprint.description}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />
                        {new Date(sprint.startDate).toLocaleDateString()} – {new Date(sprint.endDate).toLocaleDateString()}
                      </span>
                      <span>{sprint._count.tasks} {t('tasks.title')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {sprint.status === 'PLANNING' && (
                      <Button size="sm" onClick={() => handleUpdateStatus(sprint.id, 'ACTIVE')}>
                        <Play className="h-3.5 w-3.5 mr-1" /> {t('sprints.start')}
                      </Button>
                    )}
                    {sprint.status === 'ACTIVE' && (
                      <Button size="sm" onClick={() => handleUpdateStatus(sprint.id, 'COMPLETED')}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> {t('sprints.complete')}
                      </Button>
                    )}
                    {sprint.status !== 'ACTIVE' && (
                      <button onClick={() => handleDeleteSprint(sprint.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors" aria-label={t('sprints.deleteConfirm')}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {sprint.tasks.length > 0 && (
                  <div className="space-y-2 mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                    {sprint.tasks.map((st) => (
                      <div key={st.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                        <span className={`h-2 w-2 rounded-full ${st.task.status === 'DONE' ? 'bg-green-500' : st.task.status === 'IN_PROGRESS' ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                        <span className="text-sm text-slate-700 dark:text-slate-200 flex-1">{st.task.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${st.task.priority === 'URGENT' ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' : st.task.priority === 'HIGH' ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                          {st.task.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title={t('sprints.create')}>
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label={t('sprints.name')} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('sprints.sprintNamePlaceholder')} required />
          <Input label={t('sprints.descriptionOptional')} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('sprints.descriptionPlaceholder')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('sprints.startDate')} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            <Input label={t('sprints.endDate')} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>{t('common.cancel')}</Button>
            <Button type="submit" isLoading={isCreating}>{t('common.create')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
