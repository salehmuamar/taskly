'use client';

import { useMemo } from 'react';
import { Clock } from 'lucide-react';
import { statusBadgeStyles, priorityBadgeStyles } from '@/shared/lib/constants';
import type { Task } from '@/shared/types';
import { useI18n } from '@/i18n';

interface TimelineViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const STATUS_COLORS: Record<string, string> = {
  TODO: '#94a3b8',
  IN_PROGRESS: '#60a5fa',
  IN_REVIEW: '#fbbf24',
  DONE: '#34d399',
  CANCELLED: '#f87171',
};

export function TimelineView({ tasks, onTaskClick }: TimelineViewProps) {
  const { t } = useI18n();
  const { months } = useMemo(() => {
    const now = new Date();
    const monthMap = new Map<string, Task[]>();

    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(key, []);
    }

    for (const task of tasks) {
      const dateStr = task.dueDate || task.startDate;
      if (!dateStr) continue;
      const d = new Date(dateStr);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthMap.has(key)) {
        monthMap.get(key)!.push(task);
      }
    }

    const months = Array.from(monthMap.entries()).map(([key, tasks]) => {
      const [year, month] = key.split('-').map(Number);
      const date = new Date(year, month - 1);
      return {
        key,
        label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        tasks,
      };
    });

    return { months };
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-400 dark:text-slate-400">{t('tasks.noTasksTimeline')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {months.map((month) => (
        <div key={month.key}>
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">{month.label}</h3>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-400 glass rounded-full px-2 py-0.5">{month.tasks.length}</span>
          </div>
          {month.tasks.length === 0 ? (
            <div className="ml-4 py-3 text-xs text-slate-400 dark:text-slate-500">{t('tasks.noTasksScheduled')}</div>
          ) : (
            <div className="relative ml-4 border-l-2 border-black/5 dark:border-white/5 pl-6 space-y-3">
              {month.tasks.map((task) => {
                const statusColor = STATUS_COLORS[task.status] || '#94a3b8';
                const dueDate = task.dueDate ? new Date(task.dueDate) : null;
                const startDate = task.startDate ? new Date(task.startDate) : null;
                const isOverdue = dueDate && dueDate < new Date() && task.status !== 'DONE';

                return (
                  <div key={task.id} className="relative group" onClick={() => onTaskClick(task)}>
                    <div
                      className="absolute -left-[31px] top-3 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 shadow-sm cursor-pointer transition-transform group-hover:scale-125"
                      style={{ backgroundColor: statusColor }}
                    />
                    <div className="glass rounded-xl p-3 cursor-pointer transition-all hover:shadow-lg hover:shadow-indigo-500/5 hover:border-indigo-500/20">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium ${task.status === 'DONE' ? 'text-slate-400 dark:text-slate-400 line-through' : 'text-slate-800 dark:text-white'}`}>{task.title}</p>
                          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                            {(() => {
                              const s = statusBadgeStyles[task.status] || { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8' };
                              return <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold" style={{ backgroundColor: s.bg, color: s.text }}>{t('status.' + task.status)}</span>;
                            })()}
                            {(() => {
                              const s = priorityBadgeStyles[task.priority] || { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8' };
                              return <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold" style={{ backgroundColor: s.bg, color: s.text }}>{t('priority.' + task.priority)}</span>;
                            })()}
                            {task.labels.map(({ label }) => (
                              <span key={label.id} className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium" style={{ backgroundColor: label.color + '20', color: label.color }}>{label.name}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {task.assignee && (
                            <div className="h-5 w-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[9px] font-bold text-white" title={task.assignee.name || ''}>{task.assignee.name?.charAt(0) || '?'}</div>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-300">
                        {dueDate && (
                          <span className={`flex items-center gap-1 ${isOverdue ? 'font-semibold' : ''}`} style={isOverdue ? { color: '#f87171' } : undefined}>
                            <Clock className="h-3 w-3" />
                            {t('tasks.due')} {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        {startDate && (
                          <span className="flex items-center gap-1">
                            {t('tasks.start')} {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        {task.estimatedHours && (
                          <span className="glass rounded-lg px-1.5 py-0.5">{task.estimatedHours}h</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
