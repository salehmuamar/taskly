'use client';

import { useMemo } from 'react';
import { format, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '@/i18n';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface GanttViewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tasks: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onTaskClick?: (task: any) => void;
}

const statusColors: Record<string, { bg: string; text: string; bar: string }> = {
  TODO: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300', bar: 'bg-slate-400' },
  IN_PROGRESS: { bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', bar: 'bg-indigo-500' },
  IN_REVIEW: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500' },
  DONE: { bg: 'bg-green-50 dark:bg-green-500/10', text: 'text-green-600 dark:text-green-400', bar: 'bg-green-500' },
};

const priorityDots: Record<string, string> = {
  URGENT: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-blue-500',
  LOW: 'bg-slate-300 dark:bg-slate-600',
};

export function GanttView({ tasks, onTaskClick }: GanttViewProps) {
  const { t } = useI18n();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [visibleRange, setVisibleRange] = useState<'month' | 'quarter'>('month');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = visibleRange === 'quarter' ? endOfMonth(addMonths(currentDate, 2)) : endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });
  const totalDays = differenceInDays(calEnd, calStart) + 1;

  const tasksWithDates = useMemo(() => {
    return tasks.filter((t) => t.startDate || t.dueDate).map((task) => {
      const start = task.startDate ? new Date(task.startDate) : (task.dueDate ? new Date(task.dueDate) : null);
      const end = task.dueDate ? new Date(task.dueDate) : (task.startDate ? new Date(task.startDate) : null);
      if (start && end && start > end) {
        return { ...task, _start: end, _end: start };
      }
      return { ...task, _start: start, _end: end };
    });
  }, [tasks]);

  const dayWidth = 36;
  const chartWidth = totalDays * dayWidth;

  const today = new Date();

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentDate((d) => subMonths(d, visibleRange === 'quarter' ? 3 : 1))} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <ChevronLeft className="h-4 w-4 text-slate-500" />
          </button>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200 min-w-[140px] text-center">
            {format(monthStart, 'MMM yyyy')} {visibleRange === 'quarter' && `– ${format(monthEnd, 'MMM yyyy')}`}
          </span>
          <button onClick={() => setCurrentDate((d) => addMonths(d, visibleRange === 'quarter' ? 3 : 1))} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <ChevronRight className="h-4 w-4 text-slate-500" />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="ml-2 px-3 py-1 text-xs font-medium rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-colors">
            {t('calendar.today')}
          </button>
        </div>
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
          <button onClick={() => setVisibleRange('month')} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${visibleRange === 'month' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>{t('gantt.month')}</button>
          <button onClick={() => setVisibleRange('quarter')} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${visibleRange === 'quarter' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>{t('gantt.quarter')}</button>
        </div>
      </div>

      <div className="flex overflow-x-auto">
        <div className="min-w-[240px] border-r border-slate-200/50 dark:border-slate-700/50">
          <div className="h-10 px-4 flex items-center text-xs font-medium text-slate-500 border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50">
            {t('tasks.title_label')}
          </div>
          {tasksWithDates.map((task) => {
            const sc = statusColors[task.status] || statusColors.TODO;
            return (
              <div
                key={task.id}
                onClick={() => onTaskClick?.(task)}
                className="h-10 px-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
              >
                <span className={`h-2 w-2 rounded-full shrink-0 ${priorityDots[task.priority] || ''}`} />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{task.title}</span>
                <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full ${sc.bg} ${sc.text} shrink-0`}>{task.status.replace('_', ' ')}</span>
              </div>
            );
          })}
          {tasksWithDates.length === 0 && (
            <div className="h-20 flex items-center justify-center text-xs text-slate-400">{t('tasks.noTasksWithDates')}</div>
          )}
        </div>

        <div className="flex-1 overflow-x-auto">
          <div className="relative" style={{ width: chartWidth }}>
            <div className="h-10 flex border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50">
              {days.map((day, i) => {
                const isToday = isSameDay(day, today);
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                const isFirstOfMonth = day.getDate() === 1;
                return (
                  <div
                    key={i}
                    className={`flex flex-col items-center justify-center border-r border-slate-100 dark:border-slate-800 ${isWeekend ? 'bg-slate-100/50 dark:bg-slate-800/30' : ''} ${isToday ? 'bg-indigo-50 dark:bg-indigo-500/10' : ''}`}
                    style={{ width: dayWidth, minWidth: dayWidth }}
                  >
                    {isFirstOfMonth && (
                      <span className="text-[9px] font-medium text-indigo-500 dark:text-indigo-400">{format(day, 'MMM')}</span>
                    )}
                    <span className={`text-[10px] ${isToday ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400'}`}>
                      {format(day, 'd')}
                    </span>
                  </div>
                );
              })}
            </div>

            {tasksWithDates.map((task) => {
              if (!task._start || !task._end) return null;
              const startOffset = Math.max(0, differenceInDays(task._start, calStart));
              const duration = Math.max(1, differenceInDays(task._end, task._start) + 1);
              const left = startOffset * dayWidth;
              const width = duration * dayWidth;
              const sc = statusColors[task.status] || statusColors.TODO;

              return (
                <div key={task.id} className="h-10 border-b border-slate-100 dark:border-slate-800 relative" style={{ width: chartWidth }}>
                  <div className="absolute top-1/2 -translate-y-1/2 group" style={{ left, width: Math.max(width, dayWidth) }}>
                    <div
                      onClick={() => onTaskClick?.(task)}
                      className={`h-6 rounded-md ${sc.bar} bg-opacity-80 hover:bg-opacity-100 cursor-pointer flex items-center px-2 transition-all shadow-sm group-hover:shadow-md`}
                      style={{ width: '100%' }}
                    >
                      <span className="text-[10px] font-medium text-white truncate">{task.title}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            <div
              className="absolute top-0 bottom-0 w-px bg-red-400 dark:bg-red-500 z-10"
              style={{ left: differenceInDays(today, calStart) * dayWidth + dayWidth / 2 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
