'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Layers, Plus, Users, FolderKanban } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Modal } from '@/shared/ui/modal';
import { apiClient } from '@/shared/lib/api-client';
import { useI18n } from '@/i18n';
import { Skeleton } from '@/shared/ui/skeleton';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  owner: { id: string; name: string; email: string };
  _count: { projects: number; members: number };
}

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    document.title = `${t('workspaces.title')} | Taskly`;
  }, [t]);

  useEffect(() => {
    apiClient.get<{ data: Workspace[] }>('/api/workspaces')
      .then((res) => setWorkspaces(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await apiClient.post<{ data: Workspace }>('/api/workspaces', { name, description: description || undefined });
      setWorkspaces((prev) => [res.data, ...prev]);
      setShowCreate(false);
      setName('');
      setDescription('');
    } catch { /* empty */ }
    finally { setIsCreating(false); }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{t('workspaces.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{t('workspaces.subtitle')}</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" /> {t('workspaces.create')}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : workspaces.length === 0 ? (
        <div className="text-center py-20 glass rounded-2xl">
          <Layers className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300">{t('workspaces.noWorkspaces')}</h3>
          <p className="text-slate-400 mt-1">{t('workspaces.createFirst')}</p>
          <Button className="mt-6" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" /> {t('workspaces.createWorkspace')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/workspaces/${ws.id}`}
              className="group rounded-2xl glass p-6 hover:glass-strong transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <Layers className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-white group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                    {ws.name}
                  </h3>
                  <p className="text-xs text-slate-400">{t('workspaces.by')} {ws.owner.name || ws.owner.email}</p>
                </div>
              </div>
              {ws.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{ws.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><FolderKanban className="h-3.5 w-3.5" /> {ws._count.projects} {t('workspaces.tasksCount')}</span>
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {ws._count.members} {t('workspaces.membersCount')}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title={t('workspaces.create')}>
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label={t('workspaces.name')} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('workspaces.namePlaceholder')} required />
          <Input label={t('workspaces.descriptionOptional')} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('workspaces.descriptionPlaceholder')} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>{t('common.cancel')}</Button>
            <Button type="submit" isLoading={isCreating}>{t('common.create')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
