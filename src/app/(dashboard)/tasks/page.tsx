'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { CheckSquare, Clock, AlertTriangle, Filter, SortAsc } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { apiClient } from '@/shared/lib/api-client';
import { statusBadgeStyles, priorityBadgeStyles, priorityDots } from '@/shared/lib/constants';
import { useI18n } from '@/i18n';
import { useToast } from '@/shared/ui/toast';
import { TasksSkeleton } from '@/shared/ui/skeleton';
import type { Task } from '@/shared/types';

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'project'>('dueDate');
  const { t } = useI18n();
  const { toast } = useToast();

  useEffect(() => { document.title = t('nav.myTasks') + ' | Taskly'; }, []);
  const fetchTasks = useCallback(async () => {
    try { const response = await apiClient.get<{ data: Task[] }>('/api/tasks/my'); setTasks(response.data); }
    catch { setTasks([]); toast(t('tasks.failedToLoad')); }
    finally { setIsLoading(false); }
  }, [toast]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchTasks is stable, only runs once
  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const stats = useMemo(() => ({
    total: tasks.length,
    active: tasks.filter((t) => t.status !== 'DONE' && t.status !== 'CANCELLED').length,
    completed: tasks.filter((t) => t.status === 'DONE').length,
    overdue: tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE').length,
  }), [tasks]);

  const filteredTasks = useMemo(() => tasks.filter((task) => {
    if (filter === 'active') return task.status !== 'DONE' && task.status !== 'CANCELLED';
    if (filter === 'completed') return task.status === 'DONE';
    return true;
  }), [tasks, filter]);

  const sortedTasks = useMemo(() => [...filteredTasks].sort((a, b) => {
    if (sortBy === 'dueDate') { if (!a.dueDate) return 1; if (!b.dueDate) return -1; return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(); }
    if (sortBy === 'priority') { const order = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }; return order[a.priority as keyof typeof order] - order[b.priority as keyof typeof order]; }
    return a.project.name.localeCompare(b.project.name);
  }), [filteredTasks, sortBy]);

  if (isLoading) {
    return <TasksSkeleton />;
  }

  const statCards = [
    { label: t('tasks.total'), value: stats.total, icon: CheckSquare, color: 'bg-gradient-to-br from-slate-500 to-slate-600', shadow: 'shadow-slate-500/25' },
    { label: t('tasks.active'), value: stats.active, icon: Clock, color: 'bg-gradient-to-br from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/25' },
    { label: t('dashboard.completedTasks'), value: stats.completed, icon: CheckSquare, color: 'bg-gradient-to-br from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/25' },
    { label: t('dashboard.overdueTasks'), value: stats.overdue, icon: AlertTriangle, color: 'bg-gradient-to-br from-red-500 to-rose-600', shadow: 'shadow-red-500/25' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{t('nav.myTasks')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">{t('tasks.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className={`rounded-xl p-3 ${stat.color} shadow-lg ${stat.shadow}`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <div><p className="text-sm text-slate-500 dark:text-slate-300">{stat.label}</p><p className="text-2xl font-bold text-slate-800 dark:text-white">{stat.value}</p></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2" role="group" aria-label={t('tasks.filterLabel')}>
          <Filter className="h-4 w-4 text-slate-400 dark:text-slate-400" />
          {(['all', 'active', 'completed'] as const).map((f) => (
            <Button key={f} variant={filter === f ? 'primary' : 'ghost'} size="sm" onClick={() => setFilter(f)} aria-pressed={filter === f}>{({ all: t('tasks.all'), active: t('tasks.active'), completed: t('dashboard.completedTasks') })[f]}</Button>
          ))}
        </div>
        <div className="h-6 w-px bg-black/5 dark:bg-white/10" />
        <div className="flex items-center gap-2" role="group" aria-label={t('tasks.sortLabel')}>
          <SortAsc className="h-4 w-4 text-slate-400 dark:text-slate-400" />
          {[{ key: 'dueDate', label: t('tasks.dueDate') }, { key: 'priority', label: t('tasks.priority') }, { key: 'project', label: t('dashboard.projectCol') }].map((s) => (
            <Button key={s.key} variant={sortBy === s.key ? 'primary' : 'ghost'} size="sm" onClick={() => setSortBy(s.key as typeof sortBy)} aria-pressed={sortBy === s.key}>{s.label}</Button>
          ))}
        </div>
      </div>

      {sortedTasks.length === 0 ? (
        <Card><CardContent className="py-12"><div className="text-center">
          <CheckSquare className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
          <p className="mt-4 text-slate-500 dark:text-slate-300">{filter === 'completed' ? t('tasks.noCompleted') : t('tasks.noAssigned')}</p>
        </div></CardContent></Card>
      ) : (
        <Card><CardContent className="p-0">
          <div role="list" className="divide-y divide-black/5 dark:divide-white/5">
            {sortedTasks.map((task) => (
              <div key={task.id} role="listitem" tabIndex={0} className="flex items-center gap-4 px-6 py-4 hover:bg-black/3 dark:hover:bg-white/5 transition-colors">
                <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${priorityDots[task.priority] || 'bg-slate-500'}`} aria-label={t('tasks.priority') + ': ' + t('priority.' + task.priority)} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${task.status === 'DONE' ? 'text-slate-400 dark:text-slate-400 line-through' : 'text-slate-800 dark:text-white'}`}>{task.title}</p>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: task.project.color }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: task.project.color }} /> {task.project.name}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadgeStyles[task.status] ? '' : ''}`} style={{ backgroundColor: (statusBadgeStyles[task.status] || { bg: 'rgba(148,163,184,0.15)' }).bg, color: (statusBadgeStyles[task.status] || { text: '#94a3b8' }).text }}>{t('status.' + task.status)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {task.dueDate && (
                    <span className={`flex items-center gap-1 text-xs ${new Date(task.dueDate) < new Date() && task.status !== 'DONE' ? 'font-medium' : 'text-slate-400 dark:text-slate-300'}`} style={new Date(task.dueDate) < new Date() && task.status !== 'DONE' ? { color: '#f87171' } : undefined}>
                      <Clock className="h-3 w-3" /> {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: (priorityBadgeStyles[task.priority] || { bg: 'rgba(148,163,184,0.15)' }).bg, color: (priorityBadgeStyles[task.priority] || { text: '#94a3b8' }).text }}>{t('priority.' + task.priority)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent></Card>
      )}
    </div>
  );
}
