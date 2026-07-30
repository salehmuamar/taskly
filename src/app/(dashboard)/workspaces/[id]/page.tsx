'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FolderKanban, Settings, Plus, Mail, Trash2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Modal } from '@/shared/ui/modal';
import { apiClient } from '@/shared/lib/api-client';
import { useI18n } from '@/i18n';
import { Skeleton } from '@/shared/ui/skeleton';
import { Avatar } from '@/shared/ui/avatar';

interface Member {
  userId: string;
  role: string;
  user: { id: string; name: string; email: string; image: string | null };
}

interface Project {
  id: string;
  name: string;
  status: string;
  _count: { tasks: number };
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ownerId: string;
  owner: { id: string; name: string; email: string; image: string | null };
  members: Member[];
  projects: Project[];
}

export default function WorkspaceDetailPage() {
  const params = useParams();
  const workspaceId = params.id as string;
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const { t } = useI18n();

  useEffect(() => {
    document.title = `${workspace?.name || ''} | ${t('workspaces.title')}`;
  }, [workspace?.name, t]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [wsRes, sessionRes] = await Promise.all([
          apiClient.get<{ data: Workspace }>(`/api/workspaces/${workspaceId}`),
          fetch('/api/auth/session'),
        ]);
        const sessionData = await sessionRes.json();
        setCurrentUserId(sessionData?.user?.id || '');
        setWorkspace(wsRes.data);
      } catch { /* empty */ }
      finally { setIsLoading(false); }
    };
    loadData();
  }, [workspaceId]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setIsInviting(true);
    try {
      await apiClient.post(`/api/workspaces/${workspaceId}/members`, { email: inviteEmail });
      setShowInvite(false);
      setInviteEmail('');
      const res = await apiClient.get<{ data: Workspace }>(`/api/workspaces/${workspaceId}`);
      setWorkspace(res.data);
    } catch { /* empty */ }
    finally { setIsInviting(false); }
  }

  async function handleRemoveMember(userId: string) {
    if (!confirm(t('workspaces.removeConfirm'))) return;
    try {
      await apiClient.delete(`/api/workspaces/${workspaceId}/members?userId=${userId}`);
      const res = await apiClient.get<{ data: Workspace }>(`/api/workspaces/${workspaceId}`);
      setWorkspace(res.data);
    } catch { /* empty */ }
  }

  const isOwner = workspace?.ownerId === currentUserId;

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!workspace) return <div className="text-center py-20 text-slate-500">{t('workspaces.notFound')}</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/workspaces" className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <ArrowLeft className="h-5 w-5 text-slate-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{workspace.name}</h1>
          {workspace.description && <p className="text-slate-500 dark:text-slate-400 mt-1">{workspace.description}</p>}
        </div>
        {isOwner && <Link href={`/workspaces/${workspaceId}/settings`}><Button variant="secondary"><Settings className="h-4 w-4 mr-2" /> {t('nav.settings')}</Button></Link>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">{t('workspaces.projects')}</h2>
              <Link href={`/projects?workspace=${workspaceId}`}><Button size="sm"><Plus className="h-4 w-4 mr-1" /> {t('workspaces.add')}</Button></Link>
            </div>
            {workspace.projects.length === 0 ? (
              <p className="text-slate-400 text-sm">{t('workspaces.noProjectsInWorkspace')}</p>
            ) : (
              <div className="space-y-3">
                {workspace.projects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-3">
                      <FolderKanban className="h-5 w-5 text-indigo-400" />
                      <span className="font-medium text-slate-700 dark:text-slate-200 group-hover:text-indigo-500 transition-colors">{project.name}</span>
                    </div>
                    <span className="text-xs text-slate-400">{project._count.tasks} {t('workspaces.tasksCount')}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">{t('team.title')} ({workspace.members.length})</h2>
            {isOwner && <Button size="sm" onClick={() => setShowInvite(true)}><Mail className="h-4 w-4 mr-1" /> {t('team.invite')}</Button>}
          </div>
          <div className="space-y-3">
            {workspace.members.map((member) => (
              <div key={member.userId} className="flex items-center justify-between p-2 rounded-xl">
                <div className="flex items-center gap-3">
                  <Avatar src={member.user.image} name={member.user.name || member.user.email} className="h-8 w-8" />
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{member.user.name || member.user.email}</p>
                    <p className="text-xs text-slate-400">{member.role}</p>
                  </div>
                </div>
                {isOwner && member.userId !== workspace.ownerId && (
                  <button onClick={() => handleRemoveMember(member.userId)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal isOpen={showInvite} onClose={() => setShowInvite(false)} title={t('workspaces.inviteMember')}>
        <form onSubmit={handleInvite} className="space-y-4">
          <Input label={t('team.email')} type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder={t('workspaces.emailPlaceholder')} required />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowInvite(false)}>{t('common.cancel')}</Button>
            <Button type="submit" isLoading={isInviting}>{t('team.invite')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
