'use client';

import { Clock } from 'lucide-react';
import { statusBadgeStyles, priorityBadgeStyles, priorityDots } from '@/shared/lib/constants';
import type { Task } from '@/shared/types';
import { useI18n } from '@/i18n';

interface ListViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const statusOrder = ['IN_PROGRESS', 'IN_REVIEW', 'TODO', 'DONE', 'CANCELLED'];
const priorityOrder = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];

export function ListView({ tasks, onTaskClick }: ListViewProps) {
  const { t } = useI18n();
  const sorted = [...tasks].sort((a, b) => {
    const statusDiff = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
    if (statusDiff !== 0) return statusDiff;
    return priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
  });

  if (sorted.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-400 dark:text-slate-400">{t('tasks.noTasksInProject')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-black/5 dark:border-white/5 text-left">
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">{t('tasks.title_label')}</th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">{t('tasks.status')}</th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">{t('tasks.priority')}</th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">{t('tasks.assignee')}</th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">{t('tasks.dueDate')}</th>
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-white/50">{t('tasks.hours')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5 dark:divide-white/5">
          {sorted.map((task) => (
            <tr
              key={task.id}
              className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
              onClick={() => onTaskClick(task)}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className={`h-2 w-2 rounded-full shrink-0 ${priorityDots[task.priority] || ''}`} />
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 dark:text-white truncate max-w-[280px]">{task.title}</p>
                    {task.labels.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {task.labels.map(({ label }) => (
                          <span key={label.id} className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium" style={{ backgroundColor: label.color + '20', color: label.color }}>{label.name}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                {(() => {
                  const s = statusBadgeStyles[task.status] || { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8' };
                  return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: s.bg, color: s.text }}>{t('status.' + task.status)}</span>;
                })()}
              </td>
              <td className="px-4 py-3">
                {(() => {
                  const s = priorityBadgeStyles[task.priority] || { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8' };
                  return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: s.bg, color: s.text }}>{t('priority.' + task.priority)}</span>;
                })()}
              </td>
              <td className="px-4 py-3">
                {task.assignee ? (
                  <div className="flex items-center gap-1.5">
                    <div className="h-5 w-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[9px] font-bold text-white">{task.assignee.name?.charAt(0) || '?'}</div>
                    <span className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[100px]">{task.assignee.name}</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                {task.dueDate ? (
                  <span className={`flex items-center gap-1 text-xs ${new Date(task.dueDate) < new Date() && task.status !== 'DONE' ? 'font-semibold' : 'text-slate-400 dark:text-slate-300'}`} style={new Date(task.dueDate) < new Date() && task.status !== 'DONE' ? { color: '#f87171' } : undefined}>
                    <Clock className="h-3 w-3" />
                    {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                ) : (
                  <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                {task.estimatedHours ? (
                  <span className="text-xs text-slate-500 dark:text-slate-300">{task.estimatedHours}h</span>
                ) : (
                  <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
