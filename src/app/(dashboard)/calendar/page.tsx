'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useI18n } from '@/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { apiClient } from '@/shared/lib/api-client';
import { priorityDots } from '@/shared/lib/constants';
import { useToast } from '@/shared/ui/toast';
import type { Task } from '@/shared/types';

export default function CalendarPage() {
  const { t, locale } = useI18n();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const { toast } = useToast();

  const dayNames = useMemo(() =>
    Array.from({ length: 7 }, (_, i) =>
      new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short' }).format(new Date(2021, 10, i + 1))
    ), [locale]);

  const monthName = useMemo(() =>
    new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', { month: 'long' }).format(currentDate),
    [locale, currentDate]);

  useEffect(() => { document.title = t('calendar.title') + ' | Taskly'; }, []);
  useEffect(() => {
    async function fetchTasks() {
      try { const response = await apiClient.get<{ data: Task[] }>('/api/tasks/my'); setTasks(response.data); }
      catch { setTasks([]); toast(t('tasks.failedToLoad')); }
      finally { setIsLoading(false); }
    }
    fetchTasks();
  }, [toast]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const calendarDays = useMemo(() => {
    const days: Array<{ date: Date; isCurrentMonth: boolean; isToday: boolean }> = [];
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) days.push({ date: new Date(year, month - 1, prevMonthDays - i), isCurrentMonth: false, isToday: false });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      days.push({ date, isCurrentMonth: true, isToday: date.toDateString() === new Date().toDateString() });
    }
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) days.push({ date: new Date(year, month + 1, d), isCurrentMonth: false, isToday: false });
    return days;
  }, [year, month, startDay, daysInMonth]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((task) => { if (task.dueDate) { const key = new Date(task.dueDate).toDateString(); if (!map.has(key)) map.set(key, []); map.get(key)!.push(task); } });
    return map;
  }, [tasks]);

  const todayTasks = useMemo(() => tasks.filter((t) => t.dueDate && new Date(t.dueDate).toDateString() === new Date().toDateString() && t.status !== 'DONE'), [tasks]);
  const upcomingTasks = useMemo(() => {
    const now = new Date();
    return tasks.filter((t) => t.dueDate && new Date(t.dueDate) >= now && t.status !== 'DONE').sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()).slice(0, 5);
  }, [tasks]);

  if (isLoading) return <div className="flex h-64 items-center justify-center" role="status"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" /><span className="sr-only">{t('calendar.loading')}</span></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-800 dark:text-white">{t('calendar.title')}</h1><p className="text-sm text-slate-500 dark:text-slate-300">{t('calendar.subtitle')}</p></div>
        <Button variant="ghost" size="sm" onClick={goToday}>{t('calendar.today')}</Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <button onClick={prevMonth} className="rounded-xl p-1 hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-all" aria-label={t('calendar.previousMonth')}><ChevronLeft className="h-5 w-5" /></button>
                <CardTitle className="min-w-[180px] text-center">{monthName} {year}</CardTitle>
                <button onClick={nextMonth} className="rounded-xl p-1 hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-all" aria-label={t('calendar.nextMonth')}><ChevronRight className="h-5 w-5" /></button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-px glass rounded-xl overflow-hidden">
                {dayNames.map((day) => <div key={day} className="glass-subtle p-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-300">{day}</div>)}
                {calendarDays.map((day, i) => {
                  const key = day.date.toDateString();
                  const dayTasks = tasksByDate.get(key) || [];
                  return (
                    <div key={i} className={`glass-subtle p-1.5 min-h-[80px] ${!day.isCurrentMonth ? 'opacity-40' : ''} ${day.isToday ? 'ring-2 ring-inset ring-indigo-500/50 bg-indigo-500/5 dark:bg-indigo-500/10' : ''}`}>
                      <span className={`text-xs font-medium ${day.isToday ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-700 dark:text-white'}`}>{day.date.getDate()}</span>
                      <div className="mt-1 space-y-0.5">
                        {dayTasks.slice(0, 3).map((task) => (
                          <div key={task.id} className="flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[10px] glass border-indigo-500/20 text-indigo-600 dark:text-indigo-300 truncate" title={task.title}>
                            <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${priorityDots[task.priority] || ''}`} /> {task.title}
                          </div>
                        ))}
                        {dayTasks.length > 3 && <span className="text-[10px] text-indigo-500/70 dark:text-indigo-400/70">+{dayTasks.length - 3} more</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">{t('calendar.todayTasks')}</CardTitle></CardHeader>
            <CardContent>
              {todayTasks.length === 0 ? <p className="text-xs text-slate-400 dark:text-slate-400">{t('calendar.noTasksToday')}</p> : (
                <div className="space-y-2">{todayTasks.map((task) => <div key={task.id} className="flex items-center gap-2 text-sm"><div className={`h-2 w-2 rounded-full ${priorityDots[task.priority] || ''}`} /><span className="text-slate-800 dark:text-white truncate">{task.title}</span></div>)}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">{t('calendar.upcoming')}</CardTitle></CardHeader>
            <CardContent>
              {upcomingTasks.length === 0 ? <p className="text-xs text-slate-400 dark:text-slate-400">{t('calendar.noUpcoming')}</p> : (
                <div className="space-y-3">{upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0"><div className={`h-2 w-2 rounded-full shrink-0 ${priorityDots[task.priority] || ''}`} /><span className="text-sm text-slate-800 dark:text-white truncate">{task.title}</span></div>
                    <span className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-300 shrink-0"><Clock className="h-3 w-3" /> {new Date(task.dueDate!).toLocaleDateString()}</span>
                  </div>
                ))}</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
