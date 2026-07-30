'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Plus, FolderKanban, CheckSquare, Clock, AlertTriangle, BarChart3, Inbox } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { apiClient } from '@/shared/lib/api-client';
import { statusBadgeStyles, priorityBadgeStyles } from '@/shared/lib/constants';
import { useToast } from '@/shared/ui/toast';
import { DashboardSkeleton } from '@/shared/ui/skeleton';
import { useI18n } from '@/i18n';

interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  tasksByStatus: Record<string, number>;
  tasksByPriority: Record<string, number>;
  completedByDay: Array<{ date: string; count: number }>;
  recentTasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string | null;
    project: { name: string; color: string };
  }>;
}

const STATUS_COLORS: Record<string, string> = { TODO: '#94a3b8', IN_PROGRESS: '#60a5fa', IN_REVIEW: '#fbbf24', DONE: '#34d399', CANCELLED: '#f87171' };
const PRIORITY_COLORS: Record<string, string> = { URGENT: '#f87171', HIGH: '#fb923c', MEDIUM: '#fbbf24', LOW: '#34d399' };

function CenterLabel({ total }: { total: number }) {
  return (
    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="fill-slate-800 dark:fill-white text-2xl font-bold">{total}</text>
  );
}

function ChartTooltip({ active, payload, label, labelMap }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string }>; label?: string; labelMap?: Record<string, string> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl glass-strong px-3 py-2 shadow-xl border border-black/5 dark:border-white/10 text-sm">
      {label && <p className="text-slate-500 dark:text-slate-300 text-xs mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="font-semibold text-slate-800 dark:text-white">
          {(labelMap?.[p.name] || p.name)}: <span style={{ color: p.color }}>{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function EmptyChart({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="rounded-2xl bg-slate-100 dark:bg-white/5 p-4 mb-3">
        <Icon className="h-8 w-8 text-slate-300 dark:text-slate-600" />
      </div>
      <p className="text-sm text-slate-400 dark:text-slate-400">{message}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useI18n();
  const { toast } = useToast();

  const STATUS_LABELS: Record<string, string> = useMemo(() => ({ 
    TODO: t('status.TODO'), 
    IN_PROGRESS: t('status.IN_PROGRESS'), 
    IN_REVIEW: t('status.IN_REVIEW'), 
    DONE: t('status.DONE'), 
    CANCELLED: 'Cancelled' 
  }), [t]);

  const PRIORITY_LABELS: Record<string, string> = useMemo(() => ({ 
    URGENT: t('priority.URGENT'), 
    HIGH: t('priority.HIGH'), 
    MEDIUM: t('priority.MEDIUM'), 
    LOW: t('priority.LOW') 
  }), [t]);

  useEffect(() => { document.title = t('dashboard.title') + ' | Taskly'; }, [t]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await apiClient.get<{ data: DashboardStats }>('/api/dashboard');
        setStats(response.data);
      } catch {
        setStats({ totalProjects: 0, totalTasks: 0, completedTasks: 0, overdueTasks: 0, tasksByStatus: {}, tasksByPriority: {}, completedByDay: [], recentTasks: [] });
        toast(t('dashboard.failedToLoad'));
      } finally { setIsLoading(false); }
    }
    fetchStats();
  }, [toast, t]);

  const statusPieData = useMemo(() => {
    if (!stats?.tasksByStatus) return [];
    return Object.entries(stats.tasksByStatus).filter(([, v]) => v > 0).map(([key, value]) => ({ name: key, value }));
  }, [stats]);

  const priorityPieData = useMemo(() => {
    if (!stats?.tasksByPriority) return [];
    return Object.entries(stats.tasksByPriority).filter(([, v]) => v > 0).map(([key, value]) => ({ name: key, value }));
  }, [stats]);

  const totalStatus = useMemo(() => statusPieData.reduce((s, d) => s + d.value, 0), [statusPieData]);
  const totalPriority = useMemo(() => priorityPieData.reduce((s, d) => s + d.value, 0), [priorityPieData]);

  const recentTasksLimited = useMemo(() => (stats?.recentTasks ?? []).slice(0, 5), [stats]);

  const statCards = useMemo(() => [
    { name: t('dashboard.totalProjects'), value: stats?.totalProjects ?? 0, icon: FolderKanban, color: 'bg-gradient-to-br from-indigo-500 to-violet-600', shadow: 'shadow-indigo-500/25', isOverdue: false },
    { name: t('dashboard.totalTasks'), value: stats?.totalTasks ?? 0, icon: CheckSquare, color: 'bg-gradient-to-br from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/25', isOverdue: false },
    { name: t('dashboard.completedTasks'), value: stats?.completedTasks ?? 0, icon: CheckSquare, color: 'bg-gradient-to-br from-green-500 to-emerald-600', shadow: 'shadow-green-500/25', isOverdue: false },
    { name: t('dashboard.overdueTasks'), value: stats?.overdueTasks ?? 0, icon: AlertTriangle, color: 'bg-gradient-to-br from-red-500 to-rose-600', shadow: 'shadow-red-500/25', isOverdue: true },
  ], [stats, t]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{t('dashboard.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-300">{t('dashboard.subtitle')}</p>
        </div>
        <Link href="/projects/new"><Button><Plus className="mr-2 h-4 w-4" /> {t('projects.create')}</Button></Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card
            key={stat.name}
            className={stat.isOverdue && stat.value > 0 ? 'bg-red-50/80 dark:bg-red-500/10 border-red-200/50 dark:border-red-500/20' : ''}
          >
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{stat.name}</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                </div>
                <div className={`rounded-xl p-3 ${stat.color} shadow-lg ${stat.shadow}`}>
                  <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Status Doughnut */}
        <Card>
          <CardHeader><CardTitle className="text-sm">{t('dashboard.tasksByStatus')}</CardTitle></CardHeader>
          <CardContent>
            {statusPieData.length > 0 ? (
              <div className="relative">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {statusPieData.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip labelMap={STATUS_LABELS} />} />
                    <CenterLabel total={totalStatus} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
                  {statusPieData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[entry.name] || '#94a3b8' }} />
                      {STATUS_LABELS[entry.name] || entry.name.replace('_', ' ')} ({entry.value})
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyChart icon={BarChart3} message={t('dashboard.noTasks')} />
            )}
          </CardContent>
        </Card>

        {/* Priority Doughnut */}
        <Card>
          <CardHeader><CardTitle className="text-sm">{t('dashboard.tasksByPriority')}</CardTitle></CardHeader>
          <CardContent>
            {priorityPieData.length > 0 ? (
              <div className="relative">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={priorityPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {priorityPieData.map((entry) => (
                        <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip labelMap={PRIORITY_LABELS} />} />
                    <CenterLabel total={totalPriority} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
                  {priorityPieData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[entry.name] || '#94a3b8' }} />
                      {PRIORITY_LABELS[entry.name] || entry.name} ({entry.value})
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyChart icon={BarChart3} message={t('dashboard.noPriorities')} />
            )}
          </CardContent>
        </Card>

        {/* Completed Bar Chart */}
        <Card>
          <CardHeader><CardTitle className="text-sm">{t('dashboard.completed7Days')}</CardTitle></CardHeader>
          <CardContent>
            {stats?.completedByDay && stats.completedByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.completedByDay} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(148,163,184,0.7)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                  <Bar dataKey="count" name={t('dashboard.completedTasks')} fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart icon={Inbox} message={t('dashboard.noCompletedThisWeek')} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks - Compact Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.recentTasks')}</CardTitle>
          <Link href="/tasks" className="text-sm font-semibold text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors" aria-label={t('dashboard.viewAll')}>{t('dashboard.viewAll')}</Link>
        </CardHeader>
        <CardContent className="p-0">
          {recentTasksLimited.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/20 dark:border-white/20 text-left">
                    <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">{t('dashboard.taskCol')}</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">{t('dashboard.projectCol')}</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">{t('tasks.priority')}</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">{t('tasks.status')}</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50 text-right">{t('dashboard.dueCol')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/20 dark:divide-white/20">
                  {recentTasksLimited.map((task) => (
                    <tr key={task.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: task.project.color }} />
                          <span className="font-medium text-slate-800 dark:text-white truncate max-w-[200px]">{task.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-600 dark:text-slate-300 truncate max-w-[120px] block">{task.project.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const s = priorityBadgeStyles[task.priority] || { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8' };
                          return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ backgroundColor: s.bg, color: s.text }}>{PRIORITY_LABELS[task.priority] || task.priority}</span>;
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const s = statusBadgeStyles[task.status] || { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8' };
                          return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ backgroundColor: s.bg, color: s.text }}>{STATUS_LABELS[task.status] || task.status.replace('_', ' ')}</span>;
                        })()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {task.dueDate ? (
                          <span className={`flex items-center gap-1 text-xs justify-end ${new Date(task.dueDate) < new Date() && task.status !== 'DONE' ? 'font-semibold' : 'text-slate-400 dark:text-slate-400'}`} style={new Date(task.dueDate) < new Date() && task.status !== 'DONE' ? { color: '#f87171' } : undefined}>
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <Inbox className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm text-slate-400 dark:text-slate-400">{t('tasks.noTasks')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
